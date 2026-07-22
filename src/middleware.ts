import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { TOP_LEVEL_ROUTES, getLocaleAndContent } from '@/lib/middleware-helpers';
import { parseCategorySlug } from '@/lib/category-slug';
import { getWordPressAccessHeaders, getWordPressApiUrl } from '@/lib/wordpress/access';

const intlMiddleware = createMiddleware(routing);

function getLocalePrefix(locale: string) {
  return locale === routing.defaultLocale ? '' : `/${locale}`;
}

function buildLegacyRedirectUrl(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  return url;
}

export default async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Handle ?attachment_id=X -> redirect to actual media URL
  const attachmentId = searchParams.get('attachment_id');
  if (attachmentId && pathname === '/') {
    try {
      const apiUrl = getWordPressApiUrl();
      const res = await fetch(`${apiUrl}/media/${attachmentId}`, {
        headers: getWordPressAccessHeaders(),
      });
      if (res.ok) {
        const media: { source_url?: string } = await res.json();
        if (media.source_url) {
          return NextResponse.redirect(media.source_url, 301);
        }
      }
    } catch {
      // 记录错误或进行默认处理（返回404）
    }
    // API查不到或出错了，返回 404
    return new NextResponse('Not Found', { status: 404 });
  }

  // Handle legacy AMP and .html paths
  const isAmp = pathname.endsWith('/amp') || pathname.endsWith('/amp/');
  const isHtml = pathname.endsWith('.html') || pathname.includes('.html/');
  if (isAmp || isHtml) {
    const { locale, content } = getLocaleAndContent(pathname);
    const cleanPath = content.replace(/\/amp\/?$/, '').replace('.html', '');
    const finalPath =
      cleanPath.startsWith('posts/') || cleanPath.startsWith('category/') || cleanPath.startsWith('tag/')
        ? cleanPath
        : `posts/${cleanPath}`;
    const prefix = getLocalePrefix(locale);
    return NextResponse.redirect(buildLegacyRedirectUrl(req, `${prefix}/${finalPath}`), 301);
  }

  // Rewrite [...something]/feed -> /feed/[...something]
  // Because our Next.js API catch-all is at /feed/[[...path]], we intercept the old structure here.
  // Note: we use rewrite here instead of redirect so the user URL remains /tag/fathers-day/feed intact.
  if (pathname.endsWith('/feed')) {
    const feedSegments = pathname.split('/').filter(Boolean);
    // Remove 'feed' from the end
    feedSegments.pop();

    const url = req.nextUrl.clone();
    // Build the proxy URL: /feed/tag/fathers-day
    url.pathname = `/feed/${feedSegments.join('/')}`;
    return NextResponse.rewrite(url);
  }

  // Redirect legacy paths (e.g. /tech/article -> /posts/tech/article)
  const segments = pathname.split('/').filter(Boolean);
  const isLocale = routing.locales.includes(segments[0] as any);
  const contentSegments = isLocale ? segments.slice(1) : segments;
  const rootSegment = contentSegments[0];
  const locale = isLocale ? (segments[0] as (typeof routing.locales)[number]) : routing.defaultLocale;
  const prefix = getLocalePrefix(locale);

  if (rootSegment === 'sponsors' && contentSegments.length === 1) {
    return NextResponse.redirect('https://github.com/sponsors/meathill', 301);
  }

  if (rootSegment === 'author' && contentSegments.length === 4 && contentSegments[2] === 'page') {
    return NextResponse.redirect(
      buildLegacyRedirectUrl(req, `${prefix}/posts/author/${contentSegments[1]}/page/${contentSegments[3]}`),
      301,
    );
  }

  // Redirect /tags/xxx -> /tag/xxx
  if (rootSegment === 'tags' && contentSegments.length >= 2) {
    const pathContent = contentSegments.slice(1).join('/');
    return NextResponse.redirect(buildLegacyRedirectUrl(req, `/${locale}/tag/${pathContent}`), 301);
  }

  // Redirect /page/xxx -> /posts/page/xxx
  if (rootSegment === 'page' && contentSegments.length >= 2) {
    const pathContent = contentSegments.join('/');
    return NextResponse.redirect(buildLegacyRedirectUrl(req, `${prefix}/posts/${pathContent}`), 301);
  }

  // Handle non-top-level routes (e.g. legacy WP paths)
  if (rootSegment && !TOP_LEVEL_ROUTES.includes(rootSegment)) {
    const { pageNum } = parseCategorySlug(contentSegments);
    const pathContent = contentSegments.join('/');
    const url = buildLegacyRedirectUrl(req, pathname);

    // 分页形态（/js/page/2）仍视作分类归档；其余（含单段旧 slug，如 /img_0224）
    // 一律交给 /posts/[...slug] 解析——未命中文章时该页会回退到分类/附件（见对应 page.tsx），
    // 避免把附件 slug 误跳到不存在的 /category/{slug}
    if (pageNum > 1) {
      url.pathname = `${prefix}/category/${pathContent}`;
    } else {
      url.pathname = `${prefix}/posts/${pathContent}`;
    }
    return NextResponse.redirect(url, 301);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    '/',
    '/(zh|en)/:path*',
    '/((?!api|_next|_vercel|feed|.*\\/feed|.*\\.(?:png|jpg|jpeg|gif|svg|css|js|ico|webp|webm|json|xml|txt|woff|woff2|ttf|eot|otf|map|zip|gz)$).*)',
  ],
};
