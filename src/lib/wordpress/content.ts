import slugify from 'slugify';
import { parseCategorySlug } from '@/lib/category-slug';
import { TECH_SECTION_SLUGS } from '@/lib/tech-sections';

// 已下线的子域名：正文里指向它们的链接一律解开只留文字（Ahrefs：HTTP 内链 + robots.txt 超时）
const DEAD_SUBDOMAINS = 'qiniu|serial|demo|works|minesweeper';

// 与正文内既有可用图片一致的 Cloudflare Image Resizing 前缀；
// blog.meathill.com/wp-content 不对公网直接提供文件，必须走此管线
const IMAGE_PROXY_PREFIX = '/cdn-cgi/image/fit=scale-down,format=auto,width=1200,quality=65';

// 与 middleware TOP_LEVEL_ROUTES 保持一致。不要从 middleware-helpers 引入：
// 那个模块会拖进 next-intl，content 单测会挂。
const TOP_LEVEL_ROUTES = new Set([
  'about',
  'app',
  'skills',
  'solutions',
  'posts',
  'category',
  'tag',
  'login',
  'search',
  'api',
  '_next',
  'admin',
  'tech',
]);

const TECH_SECTIONS = new Set<string>(TECH_SECTION_SLUGS);

// 静态资源前缀：不是会 301 的旧文章路径，重写会把图片管线指错
const ASSET_PREFIXES = new Set(['cdn-cgi', 'wp-content', 'wp-admin', 'wp-json', 'wp-includes', 'feed', '_next']);

/** 解开 href 匹配 pattern 的 <a>，保留内部内容（文字或缩略图） */
function unwrapLinks(html: string, hrefPattern: string): string {
  const re = new RegExp(`<a\\s[^>]*href="${hrefPattern}"[^>]*>([\\s\\S]*?)</a>`, 'gi');
  return html.replace(re, '$1');
}

/** 死链解链：旧附件页、已死子域名、wp-admin、blog 子域的媒体直链 */
function stripDeadLinks(html: string): string {
  let result = html;
  result = unwrapLinks(result, 'https?://blog\\.meathill\\.com/[^"]*\\.html/attachment/[^"]*');
  result = unwrapLinks(result, `https?://(?:${DEAD_SUBDOMAINS})\\.meathill\\.com[^"]*`);
  result = unwrapLinks(result, '[^"]*/wp-admin/[^"]*');
  result = unwrapLinks(result, 'https?://blog\\.meathill\\.com/wp-content/[^"]*');
  return result;
}

/**
 * 正文里的 H1 降为 H2。文章模板自己渲染标题 H1，正文再出现 H1 就是多个 H1
 * （Bing issue #15）。只降一级，不把 H2 再往下推——issue 要求的是「# 降为 H2」，
 * 没有现成的全级 heading-shift。`<pre>` 里的字面量不动。
 */
export function demoteBodyH1(html: string): string {
  const parts = html.split(/(<pre\b[^>]*>[\s\S]*?<\/pre>)/gi);
  return parts.map((part) => (/^<pre\b/i.test(part) ? part : part.replace(/<(\/?)h1\b/gi, '<$1h2'))).join('');
}

function addHeadingIds(html: string): string {
  return html.replace(/<h([2-4])([^>]*)>(.*?)<\/h[2-4]>/g, (match, level, attrs, content) => {
    if (attrs.includes('id=')) {
      return match;
    }
    const text = content.replace(/<[^>]*>/g, '').trim();
    const id = slugify(text, { lower: true, remove: /[^一-龥a-zA-Z0-9\s-_]/g });
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
  });
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function readAttr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  if (!match) return null;
  return (match[1] ?? match[2] ?? '').replace(/\s+/g, ' ').trim();
}

function setImageAlt(img: string, alt: string): string {
  const value = alt.trim();
  if (!value || readAttr(img, 'alt')) return img;
  const escaped = escapeAttr(value);
  if (/\balt\s*=/i.test(img)) {
    return img.replace(/\balt\s*=\s*(?:"[^"]*"|'[^']*')/i, `alt="${escaped}"`);
  }
  return img.replace(/<img\b/i, `<img alt="${escaped}"`);
}

/**
 * 图片缺 alt（或 alt 为空）时：优先用 figcaption / img title 作为图注，
 * 否则用 fallback（文章标题）。已有非空 alt 不动。
 */
export function withImageAltFallback(html: string, fallback: string): string {
  const fill = (chunk: string, caption: string) =>
    chunk.replace(/<img\b[^>]*>/gi, (img) => setImageAlt(img, readAttr(img, 'title') || caption || fallback));

  const withFigures = html.replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, (figure) => {
    const raw = figure.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] ?? '';
    const caption = raw
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return fill(figure, caption);
  });
  return fill(withFigures, '');
}

function legacyContentTarget(segments: string[]): string {
  // /foo/page/1 属于已关闭的 #13（分页 404 / canonical），这里不改写。
  const { pageNum, categoryPath } = parseCategorySlug(segments);
  const hasExplicitPage = segments.length >= 2 && segments[segments.length - 2] === 'page';
  if (hasExplicitPage && pageNum === 1) {
    return `/${segments.join('/')}`;
  }
  if (pageNum > 1 && categoryPath.length > 0) {
    return `/category/${segments.join('/')}`;
  }
  return `/posts/${segments.join('/')}`;
}

/** 把会 301 的站内路径改成 middleware 最终落到的地址（能确定的部分）。 */
function rewriteSitePath(pathname: string): string {
  if (pathname === '/zh') return '/';
  if (pathname.startsWith('/zh/')) {
    return rewriteSitePath(pathname.slice(3) || '/');
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'en') {
    const rest = `/${segments.slice(1).join('/')}` || '/';
    const rewritten = rewriteSitePath(rest === '/' ? '/' : rest);
    if (rewritten.startsWith('http')) return rewritten;
    return rewritten === '/' ? '/en' : `/en${rewritten.startsWith('/') ? rewritten : `/${rewritten}`}`;
  }

  if (pathname === '/sponsors') {
    return 'https://github.com/sponsors/meathill';
  }

  let path = pathname;
  const isAmp = /\/amp\/?$/.test(path);
  const isHtml = path.endsWith('.html') || path.includes('.html/');
  if (isAmp || isHtml) {
    let clean = path
      .replace(/^\//, '')
      .replace(/\/amp\/?$/, '')
      .replace('.html', '')
      .replace(/\/+$/, '');
    if (!/^(?:posts|category|tag)(?:\/|$)/.test(clean)) {
      clean = clean ? `posts/${clean}` : 'posts';
    }
    path = `/${clean}`;
  }

  const parts = path.split('/').filter(Boolean);
  const root = parts[0];
  if (!root) return '/';
  if (ASSET_PREFIXES.has(root)) return path;

  if (root === 'tags' && parts.length >= 2) {
    return `/tag/${parts.slice(1).join('/')}`;
  }
  if (root === 'page' && parts.length >= 2) {
    // /page/1 会再被 middleware 送到 /posts/page/1 然后 301 到 /posts（#13），不在这里重做。
    if (parts.length === 2 && parts[1] === '1') return path;
    return `/posts/${parts.join('/')}`;
  }
  if (root === 'author' && parts.length === 4 && parts[2] === 'page') {
    return `/posts/author/${parts[1]}/page/${parts[3]}`;
  }
  if (root === 'tech') {
    const isRoot = parts.length === 1;
    const isSection = parts.length === 2 && TECH_SECTIONS.has(parts[1]);
    if (isRoot || isSection) return path;
    return legacyContentTarget(parts);
  }
  if (!TOP_LEVEL_ROUTES.has(root)) {
    // 带扩展名的静态文件不是旧文章路径
    if (
      /\.[a-z0-9]{2,5}$/i.test(root) ||
      parts.some((part) => /\.[a-z0-9]{2,5}$/i.test(part) && !part.endsWith('.html'))
    ) {
      return path;
    }
    return legacyContentTarget(parts);
  }
  return path;
}

function rewriteHref(href: string): string {
  if (
    !href ||
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('javascript:')
  ) {
    return href;
  }

  const cut = href.search(/[?#]/);
  let path = cut === -1 ? href : href.slice(0, cut);
  const suffix = cut === -1 ? '' : href.slice(cut);

  const www = path.match(/^https?:\/\/www\.meathill\.com(\/.*)?$/i);
  if (www) {
    path = www[1] && www[1] !== '' ? www[1] : '/';
  }

  const blog = path.match(/^https?:\/\/blog\.meathill\.com\/(.*)$/i);
  if (blog) {
    const rest = blog[1].replace(/\/+$/, '');
    if (/^wp-(?:content|admin|json|includes)(?:\/|$)/i.test(rest)) {
      return href;
    }
    if (!rest) return `/${suffix}`;
    path = rest.startsWith('/') ? rest : `/${rest}`;
    if (!/^\/(?:posts|category|tag)(?:\/|$)/.test(path)) {
      path = `/posts${path}`;
    }
  }

  if (!path.startsWith('/')) {
    return href;
  }

  // 已经是 apex 的绝对地址（https://meathill.com/...）上面没改；www 与 blog 已变成 path。
  const rewritten = rewriteSitePath(path);
  return `${rewritten}${suffix}`;
}

/** 正文内链不要再指向会 301 的 URL（www、旧 blog 永久链接、/tags、.html、非顶层旧路径）。 */
export function rewriteInternalRedirectHrefs(html: string): string {
  return html.replace(/href="([^"]*)"/g, (_match, href: string) => `href="${rewriteHref(href)}"`);
}

export function processContent(html: string, options?: { imageAlt?: string }): string {
  let result = stripDeadLinks(html.replace(/href="https?:\/\/blog\.meathill\.com\/[^"]*?(#[^"]+)"/g, 'href="$1"'))
    .replace(/href="https?:\/\/blog\.meathill\.com\/([^"#]+)\.html"/g, 'href="/posts/$1"')
    // 剩余 http 内链升级 https（Ahrefs：HTTPS 页面含 HTTP 内链）
    .replace(/href="http:\/\/(?:www\.)?meathill\.com/g, 'href="https://meathill.com')
    .replace(/href="http:\/\/(blog|hsm|i)\.meathill\.com/g, 'href="https://$1.meathill.com')
    // 缺协议的裸域名链接（如 href="segmentfault.com"）会被当相对路径解析成 404，补上 https
    .replace(
      /href="(?!https?:|\/|#|mailto:|tel:)((?:[a-z0-9-]+\.)+(?!html\b)[a-z]{2,}(?:\/[^"]*)?)"/gi,
      'href="https://$1"',
    )
    // wp-content 图片统一走 Image Resizing 管线（meathill.com/wp-content 被 WAF 403）
    .replace(
      /src="(?:https?:\/\/(?:blog\.|www\.)?meathill\.com)?\/wp-content\/uploads\/([^"]+)"/g,
      `src="${IMAGE_PROXY_PREFIX}/https://blog.meathill.com/wp-content/uploads/$1"`,
    )
    // <a href> 指向 uploads 的下载/原图链接：meathill.com/wp-content 同样被 WAF 403
    // （Ahrefs issue #11：list.png、msvcr100.dll、MG_87421.jpg 三个 403），
    // 改指到边缘放行的 blog 源站（/wp-content/uploads 例外不过 301），保留下载能力。
    // 注意：blog.meathill.com/wp-content 的 href 仍按旧策略解链，此处只处理主站与站内相对路径。
    .replace(
      /href="(?:https?:\/\/(?:www\.)?meathill\.com)?\/wp-content\/uploads\/([^"]+)"/g,
      'href="https://blog.meathill.com/wp-content/uploads/$1"',
    )
    // BlockNote 把 code block 里的换行序列化成 <br>，导致 <pre> 里看不到换行，
    // highlight.js 走 textContent 时也会丢行。统一替回 \n。
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/g, (match) => match.replace(/<br\s*\/?>/gi, '\n'));

  // 先降 H1，再给 H2–H4 补 id，这样降级后的标题仍能进目录。
  result = addHeadingIds(demoteBodyH1(result));
  result = rewriteInternalRedirectHrefs(result);
  if (options?.imageAlt) {
    result = withImageAltFallback(result, options.imageAlt);
  }
  return result;
}
