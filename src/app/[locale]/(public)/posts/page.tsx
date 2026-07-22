import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PostList } from '@/components/posts/post-list';
import TagCloud from '@/components/home/TagCloud';
import { getPosts, getCategories } from '@/lib/wordpress';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';

const POSTS_PER_PAGE = 20;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const zhUrl = `${SITE_URL}/posts`;
  const enUrl = `${SITE_URL}/en/posts`;
  const canonical = locale === 'en' ? enUrl : zhUrl;

  return {
    title: t('posts_title'),
    description: t('posts_description'),
    alternates: {
      canonical,
      languages: {
        zh: zhUrl,
        en: enUrl,
      },
    },
    openGraph: {
      title: t('posts_title'),
      description: t('posts_description'),
      url: canonical,
      type: 'website',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function ArchivePage() {
  const { posts, total, totalPages } = await getPosts({ perPage: POSTS_PER_PAGE });
  const categories = await getCategories();

  return (
    <PostList
      posts={posts}
      total={total}
      totalPages={totalPages}
      currentPage={1}
      categories={categories}
      topSlot={<TagCloud />}
    />
  );
}
