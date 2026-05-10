import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, PenSquareIcon } from 'lucide-react';
import { listBlogPosts } from '@/actions/blog';
import { BlogStatusBadge, BlogWordPressSyncBadge } from '@/components/admin/BlogStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { routing } from '@/i18n/routing';

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
  const result = await listBlogPosts({
    page: requestedPage,
    pageSize: PAGE_SIZE,
  });

  const previousPageHref = buildPaginationHref(locale, result.page - 1);
  const nextPageHref = buildPaginationHref(locale, result.page + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">博客写作台</h1>
        </div>
        <Button render={<Link href={`${getLocalePrefix(locale)}/admin/blog/new`} />}>
          <PenSquareIcon className="size-4" />
          新建文章
        </Button>
      </div>

      {result.posts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>还没有本地文章</CardTitle>
            <CardDescription>从右上角开始新建。第一次保存后就会生成可持续编辑的本地草稿。</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="rounded-xl border border-border/80 bg-card shadow-xs/5 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题 / 状态</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>分类 / 标签</TableHead>
                <TableHead>最后编辑</TableHead>
                <TableHead>WP 同步信息</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{post.title}</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <BlogStatusBadge status={post.status} />
                        <BlogWordPressSyncBadge
                          status={post.status}
                          needsSyncToWordPress={post.needsSyncToWordPress}
                          hasWordPressSync={post.wpSyncedAt !== null}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{post.slug}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {post.categories.map((category) => (
                        <Badge
                          key={`${post.id}-category-${category}`}
                          variant="info"
                          className="text-[10px] px-1 py-0 h-4"
                        >
                          {category}
                        </Badge>
                      ))}
                      {post.tags.map((tag) => (
                        <Badge key={`${post.id}-tag-${tag}`} variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(post.updatedAt, locale)}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>
                        <span className="opacity-70">时间:</span> {formatDateTime(post.wpSyncedAt, locale)}
                      </div>
                      <div>
                        <span className="opacity-70">ID:</span> {post.wpPostId ?? '尚未生成'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {post.wpSyncedAt && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="预览公开页"
                          render={
                            <Link href={buildPublicPreviewHref(locale, post.slug)} target="_blank" rel="noreferrer" />
                          }
                        >
                          <ExternalLinkIcon className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`${getLocalePrefix(locale)}/admin/blog/${post.id}`} />}
                      >
                        编辑
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </div>
  );
}
