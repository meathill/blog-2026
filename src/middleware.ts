import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { TOP_LEVEL_ROUTES, getLocaleAndContent } from '@/lib/middleware-helpers';
import { parseCategorySlug } from '@/lib/category-slug';
import { getWordPressAccessHeaders, getWordPressApiUrl } from '@/lib/wordpress/access';
import { isTechSectionSlug } from '@/lib/tech-sections';

const intlMiddleware = createMiddleware(routing);

// Issue #11：已删除的旧内容。WP 里对应 post 已不存在（线上实测均为 404），
// 此处在通用 legacy 301 之前拦截，避免产生 301→404 的 broken redirect 链：
// - 有明确存活继任页的 → 301 到继任 canonical（保留外链权重，Ahrefs 两类报错同清）；
// - 无对等继任的（gitbook 旧文、img_* 附件残留 slug）→ 直接 410 Gone，
//   告诉爬虫是刻意删除而非故障。/en 前缀与 /posts/ 单段形态由 prefix 逻辑统一覆盖。
const LEGACY_REDIRECT_MAP: Record<string, string> = {
  'honey-moon-in-phu-guoc-vietenam': 'posts/travel/second-time-to-phu-quoc-island',
  'posts/honey-moon-in-phu-guoc-vietenam': 'posts/travel/second-time-to-phu-quoc-island',
  'internet/wp/wordpressmysql8': 'posts/serverside/setting-lnmp-on-ubuntu-16-04',
  'posts/internet/wp/wordpressmysql8': 'posts/serverside/setting-lnmp-on-ubuntu-16-04',
};

// 精确匹配即 410 的旧 slug（无存活继任页）
const GONE_SLUGS = new Set(['gitbook-webpack-for-multi-pages', 'posts/gitbook-webpack-for-multi-pages']);

// 旧站附件残留 slug（img_0215~img_0227 等）：媒体库已无对应 media，
// posts/[...slug] 的 getMediaBySlug 回退必然落空，直接 410 不再 301 转一圈。
const GONE_ATTACHMENT_PATTERN = /^img_\d+$/i;

function resolveDeletedLegacy(contentSegments: string[]): 'gone' | string | null {
  const normalized = contentSegments
    .join('/')
    .replace(/\.html$/, '')
    .toLowerCase();
  if (LEGACY_REDIRECT_MAP[normalized]) {
    return LEGACY_REDIRECT_MAP[normalized];
  }
  if (GONE_SLUGS.has(normalized)) {
    return 'gone';
  }
  const last = contentSegments[contentSegments.length - 1];
  if (
    GONE_ATTACHMENT_PATTERN.test(last) &&
    (contentSegments.length === 1 || (contentSegments.length === 2 && contentSegments[0].toLowerCase() === 'posts'))
  ) {
    return 'gone';
  }
  return null;
}

function getLocalePrefix(locale: string) {
  return locale === routing.defaultLocale ? '' : `/${locale}`;
}

function buildLegacyRedirectUrl(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  return url;
}

// 分页形态（/js/page/2）仍视作分类归档；其余（含单段旧 slug，如 /img_0224）
// 一律交给 /posts/[...slug] 解析——未命中文章时该页会回退到分类/附件（见对应 page.tsx），
// 避免把附件 slug 误跳到不存在的 /category/{slug}
function redirectLegacyContentPath(req: NextRequest, prefix: string, contentSegments: string[]) {
  const { pageNum } = parseCategorySlug(contentSegments);
  const pathContent = contentSegments.join('/');
  const url = buildLegacyRedirectUrl(req, req.nextUrl.pathname);

  if (pageNum > 1) {
    url.pathname = `${prefix}/category/${pathContent}`;
  } else {
    url.pathname = `${prefix}/posts/${pathContent}`;
  }
  return NextResponse.redirect(url, 301);
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

  // Issue #11 已删除旧内容：先于 .html/legacy 通用分支拦截，
  // 否则会 301 到 /posts/... 再 404，形成 broken redirect。
  {
    const { locale: legacyLocale, content: legacyContent } = getLocaleAndContent(pathname);
    const legacySegments = legacyContent.split('/').filter(Boolean);
    const resolved = resolveDeletedLegacy(legacySegments);
    if (resolved === 'gone') {
      return new NextResponse('Gone', { status: 410 });
    }
    if (resolved) {
      return NextResponse.redirect(buildLegacyRedirectUrl(req, `${getLocalePrefix(legacyLocale)}/${resolved}`), 301);
    }
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

  // `tech` 既是产品栏目根路径（/tech、/tech/{compare|platforms|stacks|guides}），
  // 又是 WP 现存分类，旧文章链接 /tech/{slug} 必须保留 legacy 301。
  // 因此单独特判：非「根路径」也非「恰好两段的合法子栏目」时，按通用 legacy 逻辑处理。
  if (rootSegment === 'tech') {
    const isTechRoot = contentSegments.length === 1;
    const isTechSection = contentSegments.length === 2 && isTechSectionSlug(contentSegments[1]);
    if (!isTechRoot && !isTechSection) {
      return redirectLegacyContentPath(req, prefix, contentSegments);
    }
  }

  // Handle non-top-level routes (e.g. legacy WP paths)
  if (rootSegment && !TOP_LEVEL_ROUTES.includes(rootSegment)) {
    return redirectLegacyContentPath(req, prefix, contentSegments);
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
