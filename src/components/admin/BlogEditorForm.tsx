'use client';

import { ExternalLinkIcon, ImageUpIcon, LoaderCircleIcon, SaveIcon, SendHorizonalIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface BlogEditorFormProps {
  locale: string;
  mode: 'create' | 'edit';
  initialData?: BlogEditorFormData;
  saveAction: (formData: FormData) => Promise<void>;
  publishAction: (formData: FormData) => Promise<void>;
}

type SubmitIntent = 'save' | 'publish';

const BlogBlockEditor = dynamic(() => import('@/components/admin/BlogBlockEditor'), {
  ssr: false,
  loading: () => (
    <div className="rounded-[1.5rem] border border-border/80 bg-background/90 p-6 text-sm text-muted-foreground shadow-xs/5">
      正在加载编辑器…
    </div>
  ),
});

export default function BlogEditorForm({ locale, mode, initialData, saveAction, publishAction }: BlogEditorFormProps) {
  const router = useRouter();
  const submitIntentRef = useRef<SubmitIntent>('save');
  const [activeIntent, setActiveIntent] = useState<SubmitIntent | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [categoriesInput, setCategoriesInput] = useState(initialData?.categories.join(', ') || '');
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(', ') || '');

  const categoryPreview = parseBlogStringListInput(categoriesInput);
  const tagPreview = parseBlogStringListInput(tagsInput);
  const previewPath = initialData?.slugPreviewPath;

  function handleSaveClick() {
    submitIntentRef.current = 'save';
  }

  function handlePublishClick() {
    submitIntentRef.current = 'publish';
  }

  async function handleSubmit(formData: FormData) {
    const intent = submitIntentRef.current;
    setActiveIntent(intent);

    try {
      if (intent === 'publish') {
        await publishAction(formData);
        return;
      }

      await saveAction(formData);
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败，请稍后再试。';
      toast.error(message);
      setActiveIntent(null);
    }
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
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
      const message = error instanceof Error ? error.message : '封面上传失败。';
      toast.error(message);
    } finally {
      setIsUploadingCover(false);
      event.target.value = '';
    }
  }

  function handleCoverImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    setCoverImage(event.target.value);
  }

  function handleCategoriesChange(event: React.ChangeEvent<HTMLInputElement>) {
    setCategoriesInput(event.target.value);
  }

  function handleTagsChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTagsInput(event.target.value);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

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
                  defaultValue={initialData?.title || ''}
                  required
                  placeholder="例如：BlockNote 集成笔记"
                  className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Slug</span>
                <input
                  name="slug"
                  defaultValue={initialData?.slug || ''}
                  placeholder="留空时根据标题自动生成"
                  className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">状态</span>
                <select
                  name="status"
                  defaultValue={initialData?.status || 'draft'}
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
                  defaultValue={initialData?.excerpt || ''}
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>发布信息</CardTitle>
              <CardDescription>封面、分类和标签会在发布时一并同步到 WordPress。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">封面图</span>
                <div className="flex gap-2">
                  <input
                    name="coverImage"
                    value={coverImage}
                    onChange={handleCoverImageChange}
                    placeholder="https://..."
                    className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                  <label className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-input px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                    {isUploadingCover ? (
                      <LoaderCircleIcon className="size-4 animate-spin" />
                    ) : (
                      <ImageUpIcon className="size-4" />
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={isUploadingCover}
                    />
                  </label>
                </div>
              </label>

              {coverImage && (
                <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/30">
                  <img src={coverImage} alt="封面预览" className="aspect-[16/9] w-full object-cover" />
                </div>
              )}

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">分类</span>
                <input
                  name="categoriesInput"
                  value={categoriesInput}
                  onChange={handleCategoriesChange}
                  placeholder="技术, 前端, 生活"
                  className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                <TagPreview items={categoryPreview} emptyLabel="尚未设置分类" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">标签</span>
                <input
                  name="tagsInput"
                  value={tagsInput}
                  onChange={handleTagsChange}
                  placeholder="react, nextjs, markdown"
                  className="block w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
                <TagPreview items={tagPreview} emptyLabel="尚未设置标签" />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>操作</CardTitle>
              <CardDescription>保存只写入 D1，点击发布才会真正同步 WordPress。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="submit"
                onClick={handleSaveClick}
                disabled={activeIntent !== null}
                className="w-full"
                variant="outline"
              >
                {activeIntent === 'save' ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon />}
                保存草稿
              </Button>
              <Button type="submit" onClick={handlePublishClick} disabled={activeIntent !== null} className="w-full">
                {activeIntent === 'publish' ? <LoaderCircleIcon className="animate-spin" /> : <SendHorizonalIcon />}
                {mode === 'create' ? '发布到 WordPress' : '更新 WordPress 文章'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => router.back()}>
                返回上一页
              </Button>

              {previewPath && (
                <a
                  href={previewPath}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <ExternalLinkIcon className="size-4" />
                  预览公开页面
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

interface TagPreviewProps {
  items: string[];
  emptyLabel: string;
}

function TagPreview({ items, emptyLabel }: TagPreviewProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {item}
        </span>
      ))}
    </div>
  );
}
