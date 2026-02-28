import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPosts, getCategories, getUserBySlug } from '@/lib/wordpress';
import { PostList } from '@/components/posts/post-list';
import { SITE_URL } from '@/lib/constants';

const POSTS_PER_PAGE = 20;

interface AuthorPageNumProps {
  params: Promise<{ slug: string; num: string }>;
}

export async function generateMetadata({ params }: AuthorPageNumProps): Promise<Metadata> {
  const { slug, num } = await params;
  const pageNum = parseInt(num, 10);
  const author = await getUserBySlug(slug);

  if (!author) {
    return {
      title: '作者未找到',
    };
  }

  const canonicalUrl = `${SITE_URL}/posts/author/${slug}/page/${pageNum}`;

  return {
    title: `${author.name} 的文章归档 - 第 ${pageNum} 页`,
    description: `查看由 ${author.name} 编写的所有文章归档 - 第 ${pageNum} 页`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        zh: canonicalUrl,
        en: `${SITE_URL}/en/posts/author/${slug}/page/${pageNum}`,
      },
    },
    openGraph: {
      title: `${author.name} 的文章归档 - 第 ${pageNum} 页`,
      description: `查看由 ${author.name} 编写的所有文章归档 - 第 ${pageNum} 页`,
      url: canonicalUrl,
    },
  };
}

export default async function AuthorPageNum({ params }: AuthorPageNumProps) {
  const { slug, num } = await params;
  const currentPage = parseInt(num, 10);

  if (isNaN(currentPage) || currentPage < 1) {
    notFound();
  }

  if (currentPage === 1) {
    notFound(); // Page 1 should redirect to /posts/author/[slug] or just 404 since it's canonical there.
  }

  const author = await getUserBySlug(slug);

  if (!author) {
    notFound();
  }

  const { posts, total, totalPages } = await getPosts({
    author: author.id,
    page: currentPage,
    perPage: POSTS_PER_PAGE,
  });

  if (currentPage > totalPages && totalPages > 0) {
    notFound();
  }

  const categories = await getCategories();

  return (
    <PostList
      posts={posts}
      total={total}
      totalPages={totalPages}
      currentPage={currentPage}
      categories={categories}
      basePath={`/posts/author/${slug}`}
    />
  );
}
