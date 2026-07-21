import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getPosts, getCategories, getUserBySlug } from '@/lib/wordpress';
import { PostList } from '@/components/posts/post-list';
import { SITE_URL } from '@/lib/constants';

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
    },
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
