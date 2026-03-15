import { CheckCircle2Icon, TriangleAlertIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getBlogPost, publishBlogPost, updateBlogPost } from '@/actions/blog';
import BlogEditorForm from '@/components/admin/BlogEditorForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { routing } from '@/i18n/routing';

interface EditBlogPostPageProps {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ saved?: string; published?: string; warning?: string }>;
}

export default async function EditBlogPostPage({ params, searchParams }: EditBlogPostPageProps) {
  const [{ id, locale }, query] = await Promise.all([params, searchParams]);
  const post = await getBlogPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {query.saved === '1' && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
          <CheckCircle2Icon className="h-4 w-4" />
          <AlertTitle>保存成功</AlertTitle>
          <AlertDescription>本地草稿已更新，尚未自动同步到 WordPress。</AlertDescription>
        </Alert>
      )}

      {query.published === '1' && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
          <CheckCircle2Icon className="h-4 w-4" />
          <AlertTitle>发布成功</AlertTitle>
          <AlertDescription>本地内容已同步到 WordPress，公开站点将继续走现有读取链路。</AlertDescription>
        </Alert>
      )}

      {query.warning === 'cover-image' && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          <TriangleAlertIcon className="h-4 w-4" />
          <AlertTitle>封面图未同步到 WordPress</AlertTitle>
          <AlertDescription>正文发布成功，但 WordPress 特色图上传失败。可稍后重新发布一次。</AlertDescription>
        </Alert>
      )}

      <BlogEditorForm
        locale={locale}
        mode="edit"
        saveAction={updateBlogPost}
        publishAction={publishBlogPost}
        initialData={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          status: post.status,
          coverImage: post.coverImage || '',
          categories: post.categories,
          tags: post.tags,
          blocksJson: post.blocksJson,
          wpPostId: post.wpPostId,
          slugPreviewPath: post.wpSyncedAt ? buildPreviewPath(locale, post.slug) : null,
        }}
      />
    </div>
  );
}

function buildPreviewPath(locale: string, slug: string): string {
  if (locale === routing.defaultLocale) {
    return `/posts/${slug}`;
  }

  return `/${locale}/posts/${slug}`;
}
