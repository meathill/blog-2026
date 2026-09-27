import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPosts, getCategories, getUserBySlug } from '@/lib/wordpress';
import { PostList } from '@/components/posts/post-list';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';

const POSTS_PER_PAGE = 20;

interface AuthorPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const author = await getUserBySlug(slug);

  if (!author) {
    return {
      title: t('author_not_found'),
    };
  }

  const zhUrl = `${SITE_URL}/posts/author/${slug}`;
  const enUrl = `${SITE_URL}/en/posts/author/${slug}`;
  const canonical = locale === 'en' ? enUrl : zhUrl;
  const title = t('author_title', { name: author.name });
  const description = t('author_description', { name: author.name });

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

// ISR：构建期不预渲染任何路径，首个请求渲染后写入增量缓存（R2），按 revalidate 过期后台重建。
// 空数组 + dynamicParams（默认 true）= 全部按需生成；不要在这里列路径，见 DEV_NOTE「全站 ISR」。
export async function generateStaticParams() {
  return [];
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const author = await getUserBySlug(slug);

  if (!author) {
    notFound();
  }

  const { posts, total, totalPages } = await getPosts({
    author: author.id,
    perPage: POSTS_PER_PAGE,
    page: 1,
    withTotal: true,
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
