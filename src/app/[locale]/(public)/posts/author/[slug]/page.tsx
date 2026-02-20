import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPosts, getCategories, getUserBySlug } from '@/lib/wordpress';
import { PostList } from '@/components/posts/post-list';

const POSTS_PER_PAGE = 20;

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getUserBySlug(slug);

  if (!author) {
    return {
      title: '作者未找到',
    };
  }

  return {
    title: `${author.name} 的文章归档`,
    description: `查看由 ${author.name} 编写的所有文章归档`,
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await getUserBySlug(slug);

  if (!author) {
    notFound();
  }

  const { posts, total, totalPages } = await getPosts({
    author: author.id,
    perPage: POSTS_PER_PAGE,
    page: 1,
  });

  const categories = await getCategories();

  return (
    <PostList
      posts={posts}
      total={total}
      totalPages={totalPages}
      currentPage={1}
      categories={categories}
      basePath={`/posts/author/${slug}`}
    />
  );
}
