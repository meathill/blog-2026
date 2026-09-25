import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getPosts, getCategories } from '@/lib/wordpress';
import { PostList } from '@/components/posts/post-list';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';

const POSTS_PER_PAGE = 20;

interface PageProps {
  params: Promise<{ locale: string; num: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, num } = await params;
  const pageNum = parseInt(num, 10);
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const zhUrl = `${SITE_URL}/posts/page/${pageNum}`;
  const enUrl = `${SITE_URL}/en/posts/page/${pageNum}`;
  const canonical = locale === 'en' ? enUrl : zhUrl;
  const title = t('posts_archive_title', { num: pageNum });
  const description = t('posts_archive_description', { num: pageNum });

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: {
      canonical,
      languages: {
        zh: zhUrl,
        en: enUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function ArchivePageNum({ params }: PageProps) {
  const { locale, num } = await params;
  const currentPage = parseInt(num, 10);
  const postsPath = locale === 'en' ? '/en/posts' : '/posts';

  if (isNaN(currentPage) || currentPage < 1) {
    return notFound();
  }

  // 第 1 页的 canonical 是 /posts（middleware 已 301，这里兜住直接渲染的情况）
  if (currentPage === 1) {
    permanentRedirect(postsPath);
  }

  const { posts, total, totalPages } = await getPosts({
    page: currentPage,
    perPage: POSTS_PER_PAGE,
  });

  // 超出范围：跳最后一页（或列表首页），不给爬虫硬 404
  if (currentPage > totalPages) {
    permanentRedirect(totalPages > 1 ? `${postsPath}/page/${totalPages}` : postsPath);
  }

  const categories = await getCategories();

  return (
    <PostList posts={posts} total={total} totalPages={totalPages} currentPage={currentPage} categories={categories} />
  );
}
