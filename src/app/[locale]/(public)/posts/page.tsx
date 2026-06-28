import { Metadata } from 'next';
import { PostList } from '@/components/posts/post-list';
import TagCloud from '@/components/home/TagCloud';
import { getPosts, getCategories } from '@/lib/wordpress';
import { SITE_URL } from '@/lib/constants';

const POSTS_PER_PAGE = 20;

export const metadata: Metadata = {
  title: '技术洞察',
  description: 'Meathill LLC 的技术文章：Cloudflare 全栈、AI 应用与计费、跨端开发的实践与踩坑笔记。',
  alternates: {
    canonical: `${SITE_URL}/posts`,
    languages: {
      zh: `${SITE_URL}/posts`,
      en: `${SITE_URL}/en/posts`,
    },
  },
  openGraph: {
    title: '技术洞察',
    description: 'Meathill LLC 的技术文章：Cloudflare 全栈、AI 应用与计费、跨端开发的实践与踩坑笔记。',
    url: `${SITE_URL}/posts`,
  },
};

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
