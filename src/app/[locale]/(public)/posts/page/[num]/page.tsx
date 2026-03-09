import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPosts, getCategories } from '@/lib/wordpress';
import { PostList } from '@/components/posts/post-list';
import { SITE_URL } from '@/lib/constants';
import { routing } from '@/i18n/routing';

const POSTS_PER_PAGE = 20;

interface PageProps {
  params: Promise<{ locale: string; num: string }>;
}

function getArchivePagePath(locale: string, pageNum: number) {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return pageNum === 1 ? `${prefix}/posts` : `${prefix}/posts/page/${pageNum}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { num } = await params;
  const pageNum = parseInt(num, 10);

  const canonicalUrl = `${SITE_URL}/posts/page/${pageNum}`;

  return {
    title: `文章归档 - 第 ${pageNum} 页`,
    description: `山维空间技术文章归档 - 第 ${pageNum} 页`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        zh: canonicalUrl,
        en: `${SITE_URL}/en/posts/page/${pageNum}`,
      },
    },
    openGraph: {
      title: `文章归档 - 第 ${pageNum} 页`,
      description: `山维空间技术文章归档 - 第 ${pageNum} 页`,
      url: canonicalUrl,
    },
  };
}

export default async function ArchivePageNum({ params }: PageProps) {
  const { locale, num } = await params;
  const currentPage = parseInt(num, 10);

  if (isNaN(currentPage) || currentPage < 1) {
    return notFound();
  }

  // 第 1 页应该重定向到 /posts
  if (currentPage === 1) {
    return notFound();
  }

  const { posts, total, totalPages } = await getPosts({
    page: currentPage,
    perPage: POSTS_PER_PAGE,
  });

  if (currentPage > totalPages) {
    if (totalPages > 0) {
      return redirect(getArchivePagePath(locale, totalPages));
    }
    return notFound();
  }

  const categories = await getCategories();

  return (
    <PostList posts={posts} total={total} totalPages={totalPages} currentPage={currentPage} categories={categories} />
  );
}
