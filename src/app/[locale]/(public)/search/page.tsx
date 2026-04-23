import { Metadata } from 'next';
import { SearchIcon } from 'lucide-react';
import { SearchResultsClient } from '@/components/search/search-results-client';
import { SITE_URL } from '@/lib/constants';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const canonicalUrl = `${SITE_URL}/search`;

  if (q) {
    const url = `${canonicalUrl}?q=${encodeURIComponent(q)}`;
    return {
      title: `搜索: ${q}`,
      description: `山维空间搜索结果 - ${q}`,
      alternates: {
        canonical: url,
        languages: {
          zh: url,
          en: `${SITE_URL}/en/search?q=${encodeURIComponent(q)}`,
        },
      },
      openGraph: {
        title: `搜索: ${q}`,
        description: `山维空间搜索结果 - ${q}`,
        url,
      },
    };
  }

  return {
    title: '搜索文章',
    description: '在山维空间搜索技术文章和内容',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        zh: canonicalUrl,
        en: `${SITE_URL}/en/search`,
      },
    },
    openGraph: {
      title: '搜索文章',
      description: '在山维空间搜索技术文章和内容',
      url: canonicalUrl,
    },
  };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { q } = await searchParams;
  const query = q?.trim() || '';

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

        {/* Search Results (client-side via mui-search) */}
        {query ? (
          <SearchResultsClient query={query} locale={locale} />
        ) : (
          <div className="text-center py-16">
            <SearchIcon size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
            <p className="text-[var(--text-muted)] text-lg">输入关键词开始搜索</p>
          </div>
        )}
      </div>
    </div>
  );
}
