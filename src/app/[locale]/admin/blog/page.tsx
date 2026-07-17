import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, PenSquareIcon, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { deleteBlogPost, listBlogPosts } from '@/actions/blog';
import { BlogStatusBadge, BlogWordPressSyncBadge } from '@/components/admin/BlogStatusBadge';
import DeleteBlogPostButton from '@/components/admin/DeleteBlogPostButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { routing } from '@/i18n/routing';

const PAGE_SIZE = 12;

interface BlogAdminPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
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

function parseSearchParam(search: string | string[] | undefined): string | undefined {
  const rawSearch = Array.isArray(search) ? search[0] : search;
  const trimmed = rawSearch?.trim();

  return trimmed ? trimmed : undefined;
}

function getLocalePrefix(locale: string): string {
  if (locale === routing.defaultLocale) {
    return '';
  }

  return `/${locale}`;
}

function buildPaginationHref(locale: string, page: number, search?: string): string {
  const basePath = `${getLocalePrefix(locale)}/admin/blog`;
  const params = new URLSearchParams();

  if (page > 1) {
    params.set('page', String(page));
  }
  if (search) {
    params.set('q', search);
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function buildPublicPreviewHref(locale: string, slug: string): string {
  return `${getLocalePrefix(locale)}/posts/${slug}`;
}

function buildBlogEditHref(locale: string, id: string): string {
  return `${getLocalePrefix(locale)}/admin/blog/${id}`;
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
  const search = parseSearchParam(query.q);
  const result = await listBlogPosts({
    page: requestedPage,
    pageSize: PAGE_SIZE,
    search,
  });

  const previousPageHref = buildPaginationHref(locale, result.page - 1, search);
  const nextPageHref = buildPaginationHref(locale, result.page + 1, search);
  const clearSearchHref = buildPaginationHref(locale, 1);

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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <form method="GET" className="flex items-center gap-2">
          <InputGroup className="w-full sm:w-72">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput type="search" name="q" placeholder="搜索标题 / Slug / 摘要" defaultValue={search ?? ''} />
          </InputGroup>
          <Button type="submit" variant="outline">
            搜索
          </Button>
        </form>
        {search && result.posts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            找到 {result.total} 条与「{search}」相关的结果
          </p>
        )}
      </div>

      {result.posts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{search ? `没有找到匹配「${search}」的文章` : '还没有本地文章'}</CardTitle>
            <CardDescription>
              {search ? (
                <>
                  试试其他关键词，或者{' '}
                  <Link href={clearSearchHref} className="underline underline-offset-4 hover:text-foreground">
                    清除搜索条件
                  </Link>
                  查看全部文章。
                </>
              ) : (
                '从右上角开始新建。第一次保存后就会生成可持续编辑的本地草稿。'
              )}
            </CardDescription>
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
                      <Link
                        href={buildBlogEditHref(locale, post.id)}
                        className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {post.title}
                      </Link>
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
                      <DeleteBlogPostButton
                        action={deleteBlogPost.bind(null, post.id)}
                        hasWordPressSync={post.wpSyncedAt !== null}
                        postTitle={post.title}
                      />
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
