import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { PostSummaryItem } from '@/components/posts/post-summary-item';
import { calculateReadingTime, formatDate, stripHtml } from '@/lib/wordpress';

export function PostList({
  posts,
  total,
  totalPages,
  currentPage,
  categories,
  basePath = '/posts',
  topSlot,
}: {
  posts: any[];
  total: number;
  totalPages: number;
  currentPage: number;
  categories: any[];
  basePath?: string;
  topSlot?: ReactNode;
}) {
  // 按年份分组
  const postsByYear: Record<string, typeof posts> = {};
  for (const post of posts) {
    const year = new Date(post.date).getFullYear().toString();
    if (!postsByYear[year]) {
      postsByYear[year] = [];
    }
    postsByYear[year].push(post);
  }

  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a));

  // 创建分类 ID 到名称的映射
  const categoryMap = new Map(categories.map((cat: any) => [cat.id, cat.name]));

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-responsive-title mb-4">
            <span className="text-gradient">文章归档</span>
          </h1>
          <p className="text-[var(--text-secondary)]">
            共 {total} 篇文章
            {totalPages > 1 && `，当前第 ${currentPage}/${totalPages} 页`}
          </p>
        </header>

        {topSlot}

        {/* Timeline */}
        <div className="space-y-12">
          {years.map((year) => (
            <section key={year}>
              {/* Year Header */}
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gradient">{year}</h2>
                <div className="flex-1 h-px bg-[var(--surface-border)]" />
                <span className="text-sm text-[var(--text-muted)]">{postsByYear[year].length} 篇</span>
              </div>

              {/* Posts List */}
              <ul className="space-y-4">
                {postsByYear[year].map((post: any) => {
                  const title = stripHtml(post.title.rendered);
                  const date = formatDate(post.date);
                  const readingTime = calculateReadingTime(post.content.rendered);
                  const categoryName = post.categories?.[0] ? categoryMap.get(post.categories[0]) : undefined;

                  return (
                    <PostSummaryItem
                      key={post.id}
                      href={`/posts/${post.slug}`}
                      title={title}
                      dateText={date.slice(5)}
                      readingTimeText={`${readingTime}分钟`}
                      categoryText={categoryName}
                      variant="timeline"
                    />
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-12 flex items-center justify-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={currentPage === 2 ? basePath : `${basePath}/page/${currentPage - 1}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/30 transition-all"
              >
                <ChevronLeftIcon size={16} />
                上一页
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] cursor-not-allowed">
                <ChevronLeftIcon size={16} />
                上一页
              </span>
            )}

            <span className="px-4 py-2 text-sm text-[var(--text-secondary)]">
              {currentPage} / {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={`${basePath}/page/${currentPage + 1}`}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/30 transition-all"
              >
                下一页
                <ChevronRightIcon size={16} />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] cursor-not-allowed">
                下一页
                <ChevronRightIcon size={16} />
              </span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
