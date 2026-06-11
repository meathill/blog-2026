'use client';

import { LoaderCircleIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';
import { toast } from 'sonner';
import BlogEditorSidebar from '@/components/admin/BlogEditorSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { routing } from '@/i18n/routing';
import { parseBlogStringListInput } from '@/lib/blog-post';

interface BlogEditorFormData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'draft' | 'published' | 'archived';
  coverImage: string;
  categories: string[];
  tags: string[];
  blocksJson: string;
  wpPostId: number | null;
  slugPreviewPath: string | null;
}

interface BlogEditorActionResult {
  id: string;
  slug: string;
  status: 'saved' | 'published';
  warning?: 'cover-image-upload-failed' | 'cache-purge-failed';
}

interface BlogMetadataActionResult {
  slug: string;
  excerpt: string;
  tags: string[];
}

interface BlogEditorFormProps {
  locale: string;
  mode: 'create' | 'edit';
  initialData?: BlogEditorFormData;
  saveAction: (formData: FormData) => Promise<BlogEditorActionResult>;
  publishAction: (formData: FormData) => Promise<BlogEditorActionResult>;
  generateMetadataAction: (formData: FormData) => Promise<BlogMetadataActionResult>;
}

type SubmitIntent = 'save' | 'publish';

const BlogBlockEditor = dynamic(() => import('@/components/admin/BlogBlockEditor'), {
  ssr: false,
  loading: function BlogBlockEditorLoading() {
    return (
      <div className="rounded-[1.5rem] border border-border/80 bg-background/90 p-6 text-sm text-muted-foreground shadow-xs/5">
        正在加载编辑器…
      </div>
    );
  },
});

export default function BlogEditorForm({
  locale,
  mode,
  initialData,
  saveAction,
  publishAction,
  generateMetadataAction,
}: BlogEditorFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitIntentRef = useRef<SubmitIntent>('save');
  const router = useRouter();
  const [activeIntent, setActiveIntent] = useState<SubmitIntent | null>(null);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [postId, setPostId] = useState(initialData?.id || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [categoriesInput, setCategoriesInput] = useState(initialData?.categories.join(', ') || '');
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(', ') || '');
  const [previewPath, setPreviewPath] = useState(initialData?.slugPreviewPath || null);

  const categoryPreview = parseBlogStringListInput(categoriesInput);
  const tagPreview = parseBlogStringListInput(tagsInput);
  const isSubmitting = activeIntent !== null;
  const isBusy = isSubmitting || isGeneratingMetadata || isUploadingCover;
  function handleSaveClick() {
    submitIntentRef.current = 'save';
  }

  function handlePublishClick() {
    submitIntentRef.current = 'publish';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = buildFormData(formRef.current);
    if (!formData) {
      return;
    }

    const intent = submitIntentRef.current;
    setActiveIntent(intent);

    try {
      const result = intent === 'publish' ? await publishAction(formData) : await saveAction(formData);
      applyMutationResult(result, intent);
    } catch (error) {
      toast.error(
        resolveErrorMessage(error, intent === 'publish' ? '发布失败，请稍后再试。' : '保存失败，请稍后再试。'),
      );
    } finally {
      setActiveIntent(null);
    }
  }

  async function handleGenerateMetadataClick() {
    const formData = buildFormData(formRef.current);
    if (!formData) {
      return;
    }

    setIsGeneratingMetadata(true);

    try {
      const result = await generateMetadataAction(formData);
      setSlug(result.slug);
      setExcerpt(result.excerpt);
      setTagsInput(result.tags.join(', '));
      toast.success('AI 已生成元数据', {
        description: '已回填 slug、摘要和标签，你可以继续手动调整。',
      });
    } catch (error) {
      toast.error(resolveErrorMessage(error, 'AI 生成失败，请稍后再试。'));
    } finally {
      setIsGeneratingMetadata(false);
    }
  }

  function applyMutationResult(result: BlogEditorActionResult, intent: SubmitIntent) {
    setPostId(result.id);
    setSlug(result.slug);

    if (result.status === 'published') {
      setStatus('published');
      setPreviewPath(buildPublicPreviewPath(locale, result.slug));
    }

    if (intent === 'save') {
      toast.success('草稿已保存', {
        description: '本地内容已写入 D1，尚未同步到 WordPress。',
      });
    } else {
      toast.success('发布成功', {
        description: '本地内容已同步到 WordPress。',
      });
    }

    if (result.warning === 'cover-image-upload-failed') {
      toast.warning('封面图未同步到 WordPress', {
        description: '正文已经发布成功，可稍后重新发布一次补传特色图。',
      });
    }

    if (result.warning === 'cache-purge-failed') {
      toast.warning('边缘缓存未能清理', {
        description:
          '文章已发布,但 wp-json 边缘缓存(24h)没清掉,站上可能要明天才可见。可去 Cloudflare dashboard 手动 Purge Everything。',
      });
    }

    if (postId !== result.id) {
      router.replace(buildAdminEditorPath(locale, result.id));
    }
  }

  async function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || '封面上传失败。');
      }

      const data = (await response.json()) as { url: string };
      setCoverImage(data.url);
      toast.success('封面上传成功');
    } catch (error) {
      toast.error(resolveErrorMessage(error, '封面上传失败。'));
    } finally {
      setIsUploadingCover(false);
      event.target.value = '';
    }
  }

  function handleBackClick() {
    router.back();
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }

  function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
    setSlug(event.target.value);
  }

  function handleExcerptChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setExcerpt(event.target.value);
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === 'published' || value === 'archived') {
      setStatus(value);
      return;
    }

    setStatus('draft');
  }

  function handleCoverImageChange(event: ChangeEvent<HTMLInputElement>) {
    setCoverImage(event.target.value);
  }

  function handleCategoriesChange(event: ChangeEvent<HTMLInputElement>) {
    setCategoriesInput(event.target.value);
  }

  function handleTagsChange(event: ChangeEvent<HTMLInputElement>) {
    setTagsInput(event.target.value);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {postId && <input type="hidden" name="id" value={postId} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'create' ? '新建博客文章' : '编辑博客文章'}</CardTitle>
            <CardDescription>
              正文使用 BlockNote block 编辑器保存，并在服务端生成 Markdown / HTML 快照。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">标题</span>
                <input
                  name="title"
                  value={title}
                  onChange={handleTitleChange}
                  required
                  placeholder="例如：BlockNote 集成笔记"
                  className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Slug</span>
                <input
                  name="slug"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="留空时根据标题自动生成"
                  className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">状态</span>
                <select
                  name="status"
                  value={status}
                  onChange={handleStatusChange}
                  className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">摘要</span>
                <textarea
                  name="excerpt"
                  rows={3}
                  value={excerpt}
                  onChange={handleExcerptChange}
                  placeholder="可选，作为文章摘要同步到 WordPress。"
                  className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">正文</h2>
                  <p className="text-sm text-muted-foreground">支持 block 编辑，发布时会自动同步到 WordPress。</p>
                </div>
                <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  Block JSON 为主数据
                </div>
              </div>

              <BlogBlockEditor locale={locale} name="blocksJson" defaultValue={initialData?.blocksJson} />
            </div>
          </CardContent>
        </Card>

        <BlogEditorSidebar
          mode={mode}
          isBusy={isBusy}
          isUploadingCover={isUploadingCover}
          isGeneratingMetadata={isGeneratingMetadata}
          activeIntent={activeIntent}
          coverImage={coverImage}
          categoriesInput={categoriesInput}
          tagsInput={tagsInput}
          categoryPreview={categoryPreview}
          tagPreview={tagPreview}
          previewPath={previewPath}
          metadataPreview={{
            slug,
            excerpt,
            tags: tagPreview,
          }}
          onCoverImageChange={handleCoverImageChange}
          onCoverUpload={handleCoverUpload}
          onCategoriesChange={handleCategoriesChange}
          onTagsChange={handleTagsChange}
          onAiProcessClick={handleGenerateMetadataClick}
          onSaveClick={handleSaveClick}
          onPublishClick={handlePublishClick}
          onBackClick={handleBackClick}
        />
      </div>
    </form>
  );
}

function buildFormData(form: HTMLFormElement | null): FormData | null {
  if (!form) {
    toast.error('表单尚未准备完成，请稍后再试。');
    return null;
  }

  return new FormData(form);
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error.message === 'Unauthorized') {
    return '登录已失效，请重新登录。';
  }

  return error.message || fallback;
}

function buildAdminEditorPath(locale: string, id: string): string {
  if (locale === routing.defaultLocale) {
    return `/admin/blog/${id}`;
  }

  return `/${locale}/admin/blog/${id}`;
}

function buildPublicPreviewPath(locale: string, slug: string): string {
  if (locale === routing.defaultLocale) {
    return `/posts/${slug}`;
  }

  return `/${locale}/posts/${slug}`;
}
