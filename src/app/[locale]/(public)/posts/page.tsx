import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { PostSummaryItem } from '@/components/posts/post-summary-item';
import { PostList } from '@/components/posts/post-list';
import { getPosts, getCategories, calculateReadingTime, formatDate, stripHtml } from '@/lib/wordpress';

const POSTS_PER_PAGE = 20;

export const metadata: Metadata = {
  title: '文章归档',
  description: '山维空间所有技术文章和生活记录的归档列表',
};

export default async function ArchivePage() {
  const { posts, total, totalPages } = await getPosts({ perPage: POSTS_PER_PAGE });
  const categories = await getCategories();

  return <PostList posts={posts} total={total} totalPages={totalPages} currentPage={1} categories={categories} />;
}

