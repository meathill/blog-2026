import { Metadata } from 'next';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, TagIcon } from 'lucide-react';
import { getPosts, getCategories, calculateReadingTime, formatDate, stripHtml } from '@/lib/wordpress';

export const metadata: Metadata = {
  title: '文章归档',
  description: '山维空间所有技术文章和生活记录的归档列表',
};

export default async function ArchivePage() {
  const { posts, total } = await getPosts({ perPage: 50 });
  const categories = await getCategories();

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
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-responsive-title mb-4">
            <span className="text-gradient">文章归档</span>
          </h1>
          <p className="text-[var(--text-secondary)]">共 {total} 篇文章，持续更新中...</p>
        </header>

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
                {postsByYear[year].map((post) => {
                  const title = stripHtml(post.title.rendered);
                  const date = formatDate(post.date);
                  const readingTime = calculateReadingTime(post.content.rendered);
                  const categoryName = post.categories?.[0] ? categoryMap.get(post.categories[0]) : undefined;

                  return (
                    <li key={post.id}>
                      <Link
                        href={`/posts/${post.slug}`}
                        className="group block p-4 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] hover:border-[var(--accent)]/30 transition-all card-hover"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          {/* Date */}
                          <div className="flex items-center gap-1 text-sm text-[var(--text-muted)] sm:w-24 flex-shrink-0">
                            <CalendarIcon size={14} />
                            {date.slice(5)}
                          </div>

                          {/* Title */}
                          <h3 className="flex-1 font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                            {title}
                          </h3>

                          {/* Meta */}
                          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                            {categoryName && (
                              <span className="inline-flex items-center gap-1">
                                <TagIcon size={12} />
                                {categoryName}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <ClockIcon size={12} />
                              {readingTime}分钟
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
