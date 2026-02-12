import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { PostListItem } from '@/components/posts/post-list-item';
import {
  getCategoryBySlug,
  getPostsByCategory,
  calculateReadingTime,
  formatDate,
  stripHtml,
  WPCategory,
} from '@/lib/wordpress';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: '分类未找到',
    };
  }

  return {
    title: `${category.name} - 文章分类`,
    description: `查看 ${category.name} 分类下的所有文章`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const posts = await getPostsByCategory(category.id, 1, 50);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8"
        >
          <ArrowLeftIcon size={16} />
          返回文章列表
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-responsive-title mb-4">
            <span className="text-gradient">{category.name}</span>
          </h1>
          <p className="text-[var(--text-secondary)]">共 {category.count} 篇文章</p>
        </header>

        {/* Posts List */}
        <ul className="space-y-4">
          {posts.map((post) => {
            const title = stripHtml(post.title.rendered);
            const readingTime = calculateReadingTime(post.content.rendered);
            const dateFormatted = formatDate(post.date);

            return (
              <PostListItem
                key={post.id}
                href={`/posts/${post.slug}`}
                title={title}
                dateText={dateFormatted}
                readingTimeText={`${readingTime} 分钟`}
              />
            );
          })}
        </ul>

        {posts.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">该分类暂无文章</div>}
      </div>
    </div>
  );
}
