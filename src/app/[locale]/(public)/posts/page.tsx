import { Metadata } from 'next';
import { PostList } from '@/components/posts/post-list';
import { getPosts, getCategories } from '@/lib/wordpress';
import { SITE_URL } from '@/lib/constants';

const POSTS_PER_PAGE = 20;

export const metadata: Metadata = {
  title: '文章归档',
  description: '山维空间所有技术文章和生活记录的归档列表',
  alternates: {
    canonical: `${SITE_URL}/posts`,
    languages: {
      zh: `${SITE_URL}/posts`,
      en: `${SITE_URL}/en/posts`,
    },
  },
};

export default async function ArchivePage() {
  const { posts, total, totalPages } = await getPosts({ perPage: POSTS_PER_PAGE });
  const categories = await getCategories();

  return <PostList posts={posts} total={total} totalPages={totalPages} currentPage={1} categories={categories} />;
}

