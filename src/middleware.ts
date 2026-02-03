import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Handle `.html` suffix -> Redirect to stripped version under /posts/
  if (pathname.endsWith('.html')) {
    let newPath = pathname.replace('.html', '');

    // Check if we need to add /posts/ prefix
    // Assuming structure: /en/tech/article.html -> /en/posts/tech/article
    // OR /tech/article.html -> /en/posts/tech/article (intlMiddleware handles locale addition usually, but here we redirect)

    // We need to be careful about locale.
    // Use regex to decompose:
    // ^/([a-z]{2})/(.*)$ or ^/(.*)$

    const localeMatch = pathname.match(/^\/(en|zh)\/(.*)$/);
    let locale = routing.defaultLocale;
    let pathContent = newPath;

    if (localeMatch) {
      locale = localeMatch[1];
      pathContent = localeMatch[2].replace('.html', ''); // remove html from content part
    } else {
      // No locale in path, might be at root.
      // But wait, if matches /tech/article.html, logic below handles it
      pathContent = newPath.startsWith('/') ? newPath.slice(1) : newPath;
    }

    // Check if pathContent already has 'posts/' (unlikely for legacy)
    if (!pathContent.startsWith('posts/')) {
      pathContent = `posts/${pathContent}`;
    }

    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/${pathContent}`;
    return NextResponse.redirect(url);
  }

  // 2. Handle legacy `/[category]/[slug]` (no html, but missing /posts/)?
  // Current requirement 1: "Support /{category}/{post_slug}".
  // If we want to support it *without* redirecting to /posts/, we need rewrites or catch-all.
  // BUT we advised user to use /posts/ and they approved.
  // So we should redirect `/{category}/{slug}` to `/posts/{category}/{slug}`.

  // How to distinguish `/{category}/{slug}` from valid routes like `/about` or `/apps`?
  // Valid top-level routes: /about, /app, /posts, /category, /tags, /login, /search.
  // We can check against a blocklist of known top-level routes.
  // If request is `/tech/article` and `tech` is NOT in blocklist, assume it is a blog post legacy link -> redirect to `/posts/tech/article`.

  const knownRoutes = ['about', 'app', 'posts', 'category', 'tags', 'login', 'search', 'api', '_next'];
  // We strictly check the first segment.
  const segments = pathname.split('/').filter(Boolean);
  // [locale, segment1, ...] or [segment1, ...]

  let firstSegment = segments[0];
  let isLocale = routing.locales.includes(firstSegment as any);

  if (isLocale) {
    firstSegment = segments[1];
  }

  // If firstSegment exists and is NOT known route, redirect to /posts/...
  // Be careful with static files if matcher allows them. (Matcher should block most).
  // Also check if it looks like a post path (has 2nd segment?).
  // Legacy paths: /tech/how-to-find... (2 segments).
  // Category path: /tech (1 segment) -> We decided to keep as category? Or redirect to /posts/tech?
  // User asked for "Support /{category}/{post_slug}", then agreed to "/posts/{category}/{post_slug}".
  // So `/{category}/{post_slug}` should redirect.
  // What about `/{category}`? User didn't specify. Implicitly maybe specific category page?
  // Current app has `/category/[slug]`.
  // So `/tech` likely 404s currently? No, `/category/tech` exists.
  // If user visits `/tech`, should we redirect to `/category/tech` or `/posts/tech`?
  // Assume: redirect to `/category/tech` if single segment? Or Just leave 404?
  // Safest: ONLY redirect if it looks like `/{category}/{slug}` (2+ segments).

  if (firstSegment && !knownRoutes.includes(firstSegment)) {
    // Check depth.
    // If locale is present, length >= 3 (locale, cat, slug)
    // If no locale, length >= 2 (cat, slug)
    const contentSegments = isLocale ? segments.slice(1) : segments;

    if (contentSegments.length >= 2) {
      // Assume it is a post. Redirect to /posts/...
      // Preserve locale if present.

      const url = req.nextUrl.clone();
      // If no locale in path, we rely on next-intl or explicit default.
      // Best to just insert 'posts/' after locale if present, or at start.

      if (isLocale) {
        // /en/tech/foo -> /en/posts/tech/foo
        // segments: [en, tech, foo]
        // desired: /en/posts/tech/foo
        const locale = segments[0];
        const rest = segments.slice(1).join('/');
        url.pathname = `/${locale}/posts/${rest}`;
      } else {
        // /tech/foo -> /posts/tech/foo (Next-intl will then add locale if needed)
        url.pathname = `/posts/${pathname.startsWith('/') ? pathname.slice(1) : pathname}`;
      }

      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(zh|en)/:path*', '/((?!api|_next|.*\\.(?:png|jpg|jpeg|svg|css|js|ico|webp|json|woff|woff2|ttf|zip|gz)$).*)'],
};
