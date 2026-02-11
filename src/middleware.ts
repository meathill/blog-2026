import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const TOP_LEVEL_ROUTES = ['about', 'app', 'posts', 'category', 'tag', 'login', 'search', 'api', '_next', 'admin'];

function getLocaleAndContent(pathname: string) {
  const match = pathname.match(/^\/(en|zh)\/(.*)$/);
  if (match) {
    return {
      locale: match[1] as (typeof routing.locales)[number],
      content: match[2],
    };
  }
  return {
    locale: routing.defaultLocale,
    content: pathname.startsWith('/') ? pathname.slice(1) : pathname,
  };
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect legacy .html to canonical URL
  if (pathname.endsWith('.html')) {
    const { locale, content } = getLocaleAndContent(pathname);
    const cleanPath = content.replace('.html', '');
    const finalPath = cleanPath.startsWith('posts/') ? cleanPath : `posts/${cleanPath}`;

    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/${finalPath}`;
    return NextResponse.redirect(url);
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

  if (rootSegment && !TOP_LEVEL_ROUTES.includes(rootSegment) && contentSegments.length >= 2) {
    const locale = isLocale ? segments[0] : routing.defaultLocale;
    const pathContent = contentSegments.join('/');

    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/posts/${pathContent}`;
    return NextResponse.redirect(url);
  }


  return intlMiddleware(req);
}

export const config = {
  matcher: [
    '/',
    '/(zh|en)/:path*',
    '/((?!api|_next|.*\\.(?:png|jpg|jpeg|svg|css|js|ico|webp|json|xml|woff|woff2|ttf|zip|gz)$).*)',
  ],
};
