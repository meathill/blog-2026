import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, PenSquareIcon } from 'lucide-react';
import { listBlogPosts } from '@/actions/blog';
import { BlogStatusBadge, BlogWordPressSyncBadge } from '@/components/admin/BlogStatusBadge';
import { NotionSyncButton } from '@/components/admin/NotionSyncButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

function buildPaginationHref(locale: string, page: number): string {
  const basePath = `${getLocalePrefix(locale)}/admin/blog`;
  if (page <= 1) {
    return basePath;
  }

  return `${basePath}?page=${page}`;
}

function buildPublicPreviewHref(locale: string, slug: string): string {
  return `${getLocalePrefix(locale)}/posts/${slug}`;
}

function formatDateTime(date: Date | null, locale: string): string {
  if (!date) {
    return '未同步';
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

export default async function BlogAdminPage({ params, searchParams }: BlogAdminPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const requestedPage = parsePageParam(query.page);
  const [result, legacyResult] = await Promise.all([
    listBlogPosts({
      page: requestedPage,
      pageSize: PAGE_SIZE,
    }),
    listBackupPosts({
      page: 1,
      pageSize: 5,
    }),
  ]);

  const previousPageHref = buildPaginationHref(locale, result.page - 1);
  const nextPageHref = buildPaginationHref(locale, result.page + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">博客写作台</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            现在开始在站内直接写博客。正文以 Block JSON 作为主数据保存，发布时再同步到
            WordPress，公开站点继续沿用现有读取链路。
          </p>
        </div>
        <Button render={<Link href={`${getLocalePrefix(locale)}/admin/blog/new`} />}>
          <PenSquareIcon className="size-4" />
          新建文章
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>本地文章库</CardTitle>
          <CardDescription>
            当前共有 {result.total} 篇站内文章，第 {result.page} / {result.totalPages} 页，每页 {result.pageSize} 条。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <div className="rounded-2xl bg-secondary/60 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Block Source</div>
              <div className="mt-2 text-foreground">Block JSON + Markdown / HTML 快照</div>
            </div>
            <div className="rounded-2xl bg-secondary/60 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Publish Flow</div>
              <div className="mt-2 text-foreground">保存进 D1，发布时同步 WordPress</div>
            </div>
            <div className="rounded-2xl bg-secondary/60 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Legacy</div>
              <div className="mt-2 text-foreground">Notion 备份链路继续保留，但降级为遗留工具</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {result.posts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>还没有本地文章</CardTitle>
            <CardDescription>从右上角开始新建。第一次保存后就会生成可持续编辑的本地草稿。</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {result.posts.map((post) => (
            <article key={post.id} className="rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-xs/5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <BlogStatusBadge status={post.status} />
                    <BlogWordPressSyncBadge
                      status={post.status}
                      needsSyncToWordPress={post.needsSyncToWordPress}
                      hasWordPressSync={post.wpSyncedAt !== null}
                    />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">{post.title}</h2>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {post.excerpt || '暂无摘要。正文内容已保存在本地，可继续编辑或发布到 WordPress。'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`${getLocalePrefix(locale)}/admin/blog/${post.id}`} />}
                >
                  编辑
                </Button>
              </div>

              <dl className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                  <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Slug</dt>
                  <dd className="mt-1 font-medium text-foreground">{post.slug}</dd>
                </div>
                <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                  <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">最后编辑</dt>
                  <dd className="mt-1 font-medium text-foreground">{formatDateTime(post.updatedAt, locale)}</dd>
                </div>
                <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                  <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">WP 同步时间</dt>
                  <dd className="mt-1 font-medium text-foreground">{formatDateTime(post.wpSyncedAt, locale)}</dd>
                </div>
                <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                  <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground/80">WordPress ID</dt>
                  <dd className="mt-1 font-medium text-foreground">{post.wpPostId ?? '尚未生成'}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                {post.categories.map((category) => (
                  <Badge key={`${post.id}-category-${category}`} variant="info">
                    {category}
                  </Badge>
                ))}
                {post.tags.map((tag) => (
                  <Badge key={`${post.id}-tag-${tag}`} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {post.wpSyncedAt && (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={buildPublicPreviewHref(locale, post.slug)} target="_blank" rel="noreferrer" />}
                  >
                    预览公开页
                    <ExternalLinkIcon className="size-4" />
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-xs/5">
          <Link
            href={previousPageHref}
            aria-disabled={result.page <= 1}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
              result.page <= 1 ? 'pointer-events-none text-muted-foreground/50' : 'text-foreground hover:bg-accent'
            }`}
          >
            <ChevronLeftIcon className="size-4" />
            上一页
          </Link>
          <span className="text-sm text-muted-foreground">
            第 {result.page} / {result.totalPages} 页
          </span>
          <Link
            href={nextPageHref}
            aria-disabled={result.page >= result.totalPages}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
              result.page >= result.totalPages
                ? 'pointer-events-none text-muted-foreground/50'
                : 'text-foreground hover:bg-accent'
            }`}
          >
            下一页
            <ChevronRightIcon className="size-4" />
          </Link>
        </div>
      )}

      <Card>
        <CardHeader className="sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>遗留同步工具</CardTitle>
            <CardDescription>
              仍可手动同步 Notion 备份到 WordPress。当前 D1 里共有 {legacyResult.total} 篇 Notion 备份，下面只展示最近 5
              条。
            </CardDescription>
          </div>
          <div className="pt-1">
            <NotionSyncButton />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {legacyResult.posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-col gap-2 rounded-2xl border border-border/70 px-4 py-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-medium text-foreground">{post.title}</div>
                <div className="mt-1">
                  {post.slug || '无 slug'} · Notion 更新 {formatDateTime(post.lastUpdateTime, locale)}
                </div>
              </div>
              <div className="text-xs">{post.needsSyncToWordPress ? '待同步到 WP' : '已同步到 WP'}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
