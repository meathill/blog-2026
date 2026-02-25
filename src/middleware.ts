import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { TOP_LEVEL_ROUTES, getLocaleAndContent } from '@/lib/middleware-helpers';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Handle ?attachment_id=X -> redirect to actual media URL
  const attachmentId = searchParams.get('attachment_id');
  if (attachmentId && pathname === '/') {
    try {
      const apiUrl = process.env.WORDPRESS_API_URL || 'https://blog.meathill.com/wp-json/wp/v2';
      const res = await fetch(`${apiUrl}/media/${attachmentId}`);
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

  // Redirect legacy .html to canonical URL
  if (pathname.endsWith('.html')) {
    const { locale, content } = getLocaleAndContent(pathname);
    const cleanPath = content.replace('.html', '');
    const finalPath = cleanPath.startsWith('posts/') ? cleanPath : `posts/${cleanPath}`;

    const url = req.nextUrl.clone();
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    url.pathname = `${prefix}/${finalPath}`;
    return NextResponse.redirect(url);
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

  // Redirect /tags/xxx -> /tag/xxx
  if (rootSegment === 'tags' && contentSegments.length >= 2) {
    const locale = isLocale ? segments[0] : routing.defaultLocale;
    const pathContent = contentSegments.slice(1).join('/');
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/tag/${pathContent}`;
    return NextResponse.redirect(url);
  }

  // Redirect /page/xxx -> /posts/page/xxx
  if (rootSegment === 'page' && contentSegments.length >= 2) {
    const locale = isLocale ? segments[0] : routing.defaultLocale;
    const pathContent = contentSegments.join('/');
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/posts/${pathContent}`;
    return NextResponse.redirect(url);
  }

  // Return 410 Gone for single-segment unknown paths (e.g. /img_0226, old WP attachment pages)
  if (rootSegment && !TOP_LEVEL_ROUTES.includes(rootSegment) && contentSegments.length === 1) {
    return new NextResponse('Gone', { status: 410 });
  }

  if (rootSegment && !TOP_LEVEL_ROUTES.includes(rootSegment) && contentSegments.length >= 2) {
    const locale = isLocale ? segments[0] : routing.defaultLocale;
    const pathContent = contentSegments.join('/');

    const url = req.nextUrl.clone();
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    url.pathname = `${prefix}/posts/${pathContent}`;
    return NextResponse.redirect(url);
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
