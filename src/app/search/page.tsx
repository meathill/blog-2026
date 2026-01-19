import { Metadata } from 'next';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, TagIcon, SearchIcon } from 'lucide-react';
import { getPosts, getCategories, calculateReadingTime, formatDate, stripHtml } from '@/lib/wordpress';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;

  if (q) {
    return {
      title: `搜索: ${q}`,
      description: `山维空间搜索结果 - ${q}`,
    };
  }

  return {
    title: '搜索文章',
    description: '在山维空间搜索技术文章和内容',
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  let posts: any[] = [];
  let total = 0;

  if (query) {
    const result = await getPosts({ search: query, perPage: 50 });
    posts = result.posts;
    total = result.total;
  }

  const categories = await getCategories();
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Search Header */}
        <header className="mb-12">
          <h1 className="text-responsive-title mb-6">
            <span className="text-gradient">搜索文章</span>
          </h1>

          {/* Search Form */}
          <form action="/search" method="GET" className="relative">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="输入关键词搜索..."
              className="w-full px-5 py-4 pl-12 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
              autoFocus={!query}
            />
            <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-dark)] transition-colors"
            >
              搜索
            </button>
          </form>
        </header>

        {/* Search Results */}
        {query && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-[var(--text-secondary)]">
                找到 <span className="font-semibold text-[var(--text-primary)]">{total}</span> 篇相关文章
              </p>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[var(--text-muted)] text-lg">没有找到相关文章</p>
                <p className="text-[var(--text-muted)] mt-2">尝试使用其他关键词搜索</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {posts.map((post) => {
                  const title = stripHtml(post.title.rendered);
                  const excerpt = stripHtml(post.excerpt.rendered).slice(0, 150);
                  const date = formatDate(post.date);
                  const readingTime = calculateReadingTime(post.content.rendered);
                  const categoryName = post.categories?.[0] ? categoryMap.get(post.categories[0]) : undefined;

                  return (
                    <li key={post.id}>
                      <Link
                        href={`/posts/${post.slug}`}
                        className="group block p-5 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] hover:border-[var(--accent)]/30 transition-all card-hover"
                      >
                        {/* Title */}
                        <h3 className="font-semibold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-2">
                          {title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-[var(--text-secondary)] text-sm mb-3 line-clamp-2">{excerpt}...</p>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon size={12} />
                            {date}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon size={12} />
                            {readingTime}分钟
                          </span>
                          {categoryName && (
                            <span className="inline-flex items-center gap-1">
                              <TagIcon size={12} />
                              {categoryName}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Initial State - No Query */}
        {!query && (
          <div className="text-center py-16">
            <SearchIcon size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
            <p className="text-[var(--text-muted)] text-lg">输入关键词开始搜索</p>
          </div>
        )}
      </div>
    </div>
  );
}
