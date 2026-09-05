'use client';

import Link from 'next/link';
import { CalendarIcon, ClockIcon, TagIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { searchContent, trackClick, type MuiSearchResult } from '@/lib/mui-search/client';
import { formatDate } from '@/lib/wordpress';

interface Props {
  query: string;
  locale: string;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

interface State {
  status: Status;
  results: MuiSearchResult[];
  total: number;
  errorMessage?: string;
}

const INITIAL_STATE: State = { status: 'idle', results: [], total: 0 };

/** 优先用索引里的规范 url，否则降级 /posts/{slug}（页内会 301 补全分类）。 */
function getSearchResultHref(result: MuiSearchResult): string {
  if (result.url) {
    try {
      const pathname = new URL(result.url, 'https://meathill.com').pathname;
      const withoutLocale = pathname.replace(/^\/en(?=\/)/, '');
      if (withoutLocale.includes('/posts/')) {
        return withoutLocale;
      }
    } catch {
      // ignore invalid url
    }
  }
  return `/posts/${result.slug}`;
}

export function SearchResultsClient({ query, locale }: Props) {
  const [state, setState] = useState<State>(INITIAL_STATE);

  useEffect(() => {
    if (!query) {
      setState(INITIAL_STATE);
      return;
    }

    const controller = new AbortController();
    setState((previous) => ({ ...previous, status: 'loading' }));

    const targetLocale = locale === 'en' ? 'en' : 'zh';
    searchContent({ query, locale: targetLocale, limit: 10, signal: controller.signal })
      .then((response) => {
        setState({ status: 'done', results: response.results, total: response.total });
      })
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        setState({
          status: 'error',
          results: [],
          total: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      });

    return () => controller.abort();
  }, [query, locale]);

  if (state.status === 'loading') {
    return (
      <div className="space-y-8">
        <p className="text-[var(--text-secondary)]">搜索中...</p>
        <ul className="space-y-4">
          {[0, 1, 2].map((index) => (
            <li
              key={index}
              className="h-28 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 animate-pulse"
            />
          ))}
        </ul>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-4">
        <p className="text-red-400">搜索服务暂时不可用。</p>
        {state.errorMessage && <p className="text-[var(--text-muted)] text-sm">{state.errorMessage}</p>}
      </div>
    );
  }

  if (state.results.length === 0) {
    return (
      <div className="space-y-8">
        <p className="text-[var(--text-secondary)]">
          找到 <span className="font-semibold text-[var(--text-primary)]">0</span> 篇相关文章
        </p>
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)] text-lg">没有找到相关文章</p>
          <p className="text-[var(--text-muted)] mt-2">尝试使用其他关键词搜索</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-secondary)]">
          找到 <span className="font-semibold text-[var(--text-primary)]">{state.total}</span> 篇相关文章
        </p>
      </div>

      <ul className="space-y-4">
        {state.results.map((result) => (
          <SearchResultItem key={`${result.id}:${result.slug}`} query={query} result={result} />
        ))}
      </ul>
    </div>
  );
}

interface SearchResultItemProps {
  query: string;
  result: MuiSearchResult;
}

function SearchResultItem({ query, result }: SearchResultItemProps) {
  const dateText = result.publishedAt ? formatDate(result.publishedAt) : '';
  const readingTimeText = result.readingTimeMinutes ? `${result.readingTimeMinutes}分钟` : '';
  const categoryText = result.categoryName ?? undefined;

  function handleClick() {
    trackClick({
      query,
      contentId: result.id,
      contentTitle: result.title,
      locale: result.locale,
    });
  }

  return (
    <li>
      <Link
        prefetch={false}
        href={getSearchResultHref(result)}
        onClick={handleClick}
        className="group block rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 transition-all card-hover hover:border-[var(--accent)]/30"
      >
        <h3 className="mb-2 font-semibold text-[var(--text-primary)] text-lg transition-colors group-hover:text-[var(--accent)]">
          {result.title}
        </h3>
        {result.content && <p className="mb-3 line-clamp-2 text-[var(--text-secondary)] text-sm">{result.content}</p>}
        <div className="flex items-center gap-4 text-[var(--text-muted)] text-xs">
          {dateText && (
            <span className="inline-flex items-center gap-1">
              <CalendarIcon size={12} />
              {dateText}
            </span>
          )}
          {readingTimeText && (
            <span className="inline-flex items-center gap-1">
              <ClockIcon size={12} />
              {readingTimeText}
            </span>
          )}
          {categoryText && (
            <span className="inline-flex items-center gap-1">
              <TagIcon size={12} />
              {categoryText}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
