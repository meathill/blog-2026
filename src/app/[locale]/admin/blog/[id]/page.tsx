import { notFound } from 'next/navigation';
import { generateBlogMetadata, getBlogPost, publishBlogPost, updateBlogPost } from '@/actions/blog';
import BlogEditorForm from '@/components/admin/BlogEditorForm';
import { routing } from '@/i18n/routing';

interface EditBlogPostPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id, locale } = await params;
  const post = await getBlogPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl">
      <BlogEditorForm
        locale={locale}
        mode="edit"
        saveAction={updateBlogPost}
        publishAction={publishBlogPost}
        generateMetadataAction={generateBlogMetadata}
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
