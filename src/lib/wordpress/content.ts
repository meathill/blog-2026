import slugify from 'slugify';

// 已下线的子域名：正文里指向它们的链接一律解开只留文字（Ahrefs：HTTP 内链 + robots.txt 超时）
const DEAD_SUBDOMAINS = 'qiniu|serial|demo|works|minesweeper';

// 与正文内既有可用图片一致的 Cloudflare Image Resizing 前缀；
// blog.meathill.com/wp-content 不对公网直接提供文件，必须走此管线
const IMAGE_PROXY_PREFIX = '/cdn-cgi/image/fit=scale-down,format=auto,width=1200,quality=65';

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

export function processContent(html: string): string {
  return (
    stripDeadLinks(html.replace(/href="https?:\/\/blog\.meathill\.com\/[^"]*?(#[^"]+)"/g, 'href="$1"'))
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
      .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/g, (match) => match.replace(/<br\s*\/?>/gi, '\n'))
      .replace(/<h([2-4])([^>]*)>(.*?)<\/h[2-4]>/g, (match, level, attrs, content) => {
        // Check if id already exists
        if (attrs.includes('id=')) {
          return match;
        }

        // Generate id from content
        // 1. Remove HTML tags from content
        const text = content.replace(/<[^>]*>/g, '').trim();
        // 2. Generate safe id
        const id = slugify(text, { lower: true, remove: /[^一-龥a-zA-Z0-9\s-_]/g });

        return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
      })
  );
}
