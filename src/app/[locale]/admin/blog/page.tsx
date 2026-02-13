import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon } from 'lucide-react';
import { NotionSyncButton } from '@/components/admin/NotionSyncButton';
import { routing } from '@/i18n/routing';
import { listBackupPosts } from '@/lib/notion-post-backup';

const PAGE_SIZE = 12;

interface BlogAdminPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

function parsePageParam(page: string | string[] | undefined): number {
  const rawPage = Array.isArray(page) ? page[0] : page;
  if (!rawPage) {
    return 1;
  }

  const parsedPage = Number.parseInt(rawPage, 10);
  if (Number.isNaN(parsedPage) || parsedPage < 1) {
    return 1;
  }

  return parsedPage;
}

function getLocalePrefix(locale: string): string {
  if (locale === routing.defaultLocale) {
    return '';
  }
  return `/${locale}`;
}

function getAdminBlogBasePath(locale: string): string {
  return `${getLocalePrefix(locale)}/admin/blog`;
}

function buildPaginationHref(basePath: string, page: number): string {
  if (page <= 1) {
    return basePath;
  }
  return `${basePath}?page=${page}`;
}

function buildPostPreviewHref(locale: string, slug: string): string {
  return `${getLocalePrefix(locale)}/posts/${slug}`;
}

function formatDateTime(date: Date | null, locale: string): string {
  if (!date) {
    return '未发布';
  }

  const formatter = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return formatter.format(date);
}

function getVisibleItems(items: string[], maxCount: number): { visible: string[]; hiddenCount: number } {
  if (items.length <= maxCount) {
    return {
      visible: items,
      hiddenCount: 0,
    };
  }

  return {
    visible: items.slice(0, maxCount),
    hiddenCount: items.length - maxCount,
  };
}

export default async function BlogAdminPage({ params, searchParams }: BlogAdminPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const requestedPage = parsePageParam(query.page);
  const result = await listBackupPosts({
    page: requestedPage,
    pageSize: PAGE_SIZE,
  });
  const basePath = getAdminBlogBasePath(locale);
  const previousPageHref = buildPaginationHref(basePath, result.page - 1);
  const nextPageHref = buildPaginationHref(basePath, result.page + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Blog Management</h2>
          <p className="text-sm text-zinc-500">展示 D1 备份文章，可预览和分页浏览（不提供编辑）。</p>
        </div>
        <div className="flex gap-2">
          <NotionSyncButton />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500">
          当前共有 <span className="font-medium text-zinc-700 dark:text-zinc-100">{result.total}</span> 篇备份文章， 第{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-100">{result.page}</span> /{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-100">{result.totalPages}</span> 页， 每页{' '}
          {result.pageSize} 条。
        </p>
      </div>

      {result.posts.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-500 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          尚无备份文章。点击右上角同步按钮后，这里会显示从 Notion 同步到 D1 的结果。
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {result.posts.map((post) => {
              const visibleCategories = getVisibleItems(post.categories, 4);
              const visibleTags = getVisibleItems(post.tags, 4);

              return (
                <article
                  key={post.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{post.title}</h3>
                    {post.slug ? (
                      <Link
                        href={buildPostPreviewHref(locale, post.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        预览
                        <ExternalLinkIcon size={12} />
                      </Link>
                    ) : (
                      <span className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                        无预览
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        post.needsSyncToWordPress
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}
                    >
                      {post.needsSyncToWordPress ? '待同步 WP' : '已同步 WP'}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {post.status}
                    </span>
                  </div>

                  <dl className="mt-3 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0 font-medium text-zinc-700 dark:text-zinc-100">Slug</dt>
                      <dd className="line-clamp-1 text-right">{post.slug || '（空）'}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0 font-medium text-zinc-700 dark:text-zinc-100">Notion 更新</dt>
                      <dd className="text-right">{formatDateTime(post.lastUpdateTime, locale)}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0 font-medium text-zinc-700 dark:text-zinc-100">WP 发布时间</dt>
                      <dd className="text-right">{formatDateTime(post.publishedAt, locale)}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 space-y-2">
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-100">分类</p>
                      <div className="flex flex-wrap gap-1">
                        {post.categories.length > 0 ? (
                          <>
                            {visibleCategories.visible.map((category) => (
                              <span
                                key={`${post.id}-${category}`}
                                className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                              >
                                {category}
                              </span>
                            ))}
                            {visibleCategories.hiddenCount > 0 && (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                +{visibleCategories.hiddenCount}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">无分类</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-100">标签</p>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.length > 0 ? (
                          <>
                            {visibleTags.visible.map((tag) => (
                              <span
                                key={`${post.id}-${tag}`}
                                className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {visibleTags.hiddenCount > 0 && (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                +{visibleTags.hiddenCount}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">无标签</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <details className="mt-3 rounded-md border border-zinc-200 px-2.5 py-2 dark:border-zinc-700">
                    <summary className="cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      HTML 预览
                    </summary>
                    <div
                      className="prose prose-sm mt-2 max-h-44 max-w-none overflow-auto rounded-md border border-zinc-200 p-2 text-xs dark:prose-invert dark:border-zinc-700"
                      dangerouslySetInnerHTML={{ __html: post.content || '<p>暂无内容</p>' }}
                    />
                  </details>
                </article>
              );
            })}
          </div>

          {result.totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-center gap-2">
              {result.page > 1 ? (
                <Link
                  href={previousPageHref}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <ChevronLeftIcon size={16} />
                  上一页
                </Link>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 dark:text-zinc-500">
                  <ChevronLeftIcon size={16} />
                  上一页
                </span>
              )}

              <span className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300">
                {result.page} / {result.totalPages}
              </span>

              {result.page < result.totalPages ? (
                <Link
                  href={nextPageHref}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  下一页
                  <ChevronRightIcon size={16} />
                </Link>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 dark:text-zinc-500">
                  下一页
                  <ChevronRightIcon size={16} />
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
