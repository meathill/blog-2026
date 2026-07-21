import { Metadata } from 'next';
import { SearchIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { SearchResultsClient } from '@/components/search/search-results-client';
import { SITE_URL } from '@/lib/constants';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  if (q) {
    const zhUrl = `${SITE_URL}/search?q=${encodeURIComponent(q)}`;
    const enUrl = `${SITE_URL}/en/search?q=${encodeURIComponent(q)}`;
    const canonical = locale === 'en' ? enUrl : zhUrl;
    const title = t('search_query_title', { query: q });
    const description = t('search_query_description', { query: q });
    return {
      title,
      description,
      robots: { index: false, follow: true },
      alternates: {
        canonical,
        languages: {
          zh: zhUrl,
          en: enUrl,
        },
      },
      openGraph: {
        title,
        description,
        url: canonical,
      },
    };
  }

  const zhUrl = `${SITE_URL}/search`;
  const enUrl = `${SITE_URL}/en/search`;
  const canonical = locale === 'en' ? enUrl : zhUrl;
  return {
    title: t('search_title'),
    description: t('search_description'),
    robots: { index: false, follow: true },
    alternates: {
      canonical,
      languages: {
        zh: zhUrl,
        en: enUrl,
      },
    },
    openGraph: {
      title: t('search_title'),
      description: t('search_description'),
      url: canonical,
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
