import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CalendarIcon, ClockIcon } from 'lucide-react';
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
            // 从链接提取本地 slug
            const localSlug = post.slug;

            return (
              <li key={post.id}>
                <Link
                  href={`/posts/${localSlug}`}
                  className="group block p-4 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] hover:border-[var(--accent)]/30 transition-all card-hover"
                >
                  <h2 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-2">
                    {title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon size={14} />
                      {dateFormatted}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon size={14} />
                      {readingTime} 分钟
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {posts.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">该分类暂无文章</div>}
      </div>
    </div>
  );
}
