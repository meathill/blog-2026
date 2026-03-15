import BlogEditorForm from '@/components/admin/BlogEditorForm';
import { createBlogPost, generateBlogMetadata, publishBlogPost } from '@/actions/blog';

export default async function NewBlogPostPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-7xl">
      <BlogEditorForm
        locale={locale}
        mode="create"
        saveAction={createBlogPost}
        publishAction={publishBlogPost}
        generateMetadataAction={generateBlogMetadata}
      />
    </div>
  );
}
