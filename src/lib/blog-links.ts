export const DOFOLLOW_MARKER = '__dofollow';

const DOFOLLOW_REGEX = /(?:[#&]__dofollow\b|__dofollow$)/i;

export interface ParsedLink {
  cleanUrl: string;
  isNofollow: boolean;
  isInternal: boolean;
}

/**
 * 判断链接是否为内部/本站链接
 */
export function isInternalLink(href: string): boolean {
  if (!href) return true;
  const trimmed = href.trim();
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('javascript:')
  ) {
    return true;
  }

  try {
    const url = new URL(trimmed, 'https://meathill.com');
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === 'meathill.com' ||
      hostname.endsWith('.meathill.com') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1'
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * 剥离 URL 中的内部 dofollow 标记，恢复干净的目标 URL
 */
export function cleanLinkUrl(url: string): string {
  if (!url) return '';
  return url
    .replace(/[#&]__dofollow\b/gi, '')
    .replace(/__dofollow$/gi, '')
    .replace(/[?#]$/, '');
}

/**
 * 解析链接的目标 URL 及其 SEO 属性
 * 规则：
 * - 站内链接：自动保持 dofollow（isNofollow = false）
 * - 外部链接：默认 isNofollow = true；若包含 __dofollow 标记，则认定为交换友链（isNofollow = false）
 */
export function parseLinkUrl(rawUrl: string): ParsedLink {
  const hasMarker = DOFOLLOW_REGEX.test(rawUrl);
  const cleanUrl = cleanLinkUrl(rawUrl);
  const isInternal = isInternalLink(cleanUrl);

  return {
    cleanUrl,
    isInternal,
    isNofollow: !isInternal && !hasMarker,
  };
}

/**
 * 根据 cleanUrl 和 isNofollow 状态编码为存储 URL
 */
export function encodeLinkUrl(cleanUrl: string, isNofollow: boolean): string {
  const cleaned = cleanLinkUrl(cleanUrl);
  if (!cleaned) return '';

  const isInternal = isInternalLink(cleaned);
  // 站内链接或保持 nofollow 的外链不需要额外标记
  if (isInternal || isNofollow) {
    return cleaned;
  }

  // 外链交换友链（取消 nofollow / 即 dofollow）
  if (cleaned.includes('#')) {
    return `${cleaned}&${DOFOLLOW_MARKER}`;
  }
  return `${cleaned}#${DOFOLLOW_MARKER}`;
}

/**
 * 清除文本中的 dofollow 标记（用于 Markdown 或文本输出）
 */
export function stripDofollowMarkers(text: string): string {
  if (!text) return '';
  return text.replace(/([#&])__dofollow\b/gi, '').replace(/__dofollow\b/gi, '');
}

/**
 * 清洗并规范化 HTML 字符串中的 <a> 链接：
 * 1. 剥离 URL 中的 dofollow 内部标记
 * 2. 外部链接默认补上 target="_blank"
 * 3. 默认补上 rel="noopener"
 * 4. 外部链接若 isNofollow 为 true，rel 补上 "nofollow"；若为 false（友链），确保绝不出现 "nofollow"
 * 5. 内部链接确保不含 "nofollow"
 */
export function processBlogHtmlLinks(html: string): string {
  if (!html) return '';

  return html.replace(/<a\b([^>]*)>/gi, (fullMatch, rawAttrs: string) => {
    // 匹配 href
    const hrefMatch = rawAttrs.match(/\bhref=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!hrefMatch) {
      return fullMatch;
    }

    const rawHref = hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? '';
    const { cleanUrl, isInternal, isNofollow } = parseLinkUrl(rawHref);

    // 匹配已有的 target
    const targetMatch = rawAttrs.match(/\btarget=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const existingTarget = targetMatch ? (targetMatch[1] ?? targetMatch[2] ?? targetMatch[3] ?? '') : null;

    // 匹配已有的 rel
    const relMatch = rawAttrs.match(/\brel=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const existingRel = relMatch ? (relMatch[1] ?? relMatch[2] ?? relMatch[3] ?? '') : '';

    const relTokens = new Set<string>(existingRel.toLowerCase().split(/\s+/).filter(Boolean));

    // 移除 TiPTap 默认的 noreferrer，保证友链可带 referrer 传递权重
    relTokens.delete('noreferrer');

    let targetToSet = existingTarget;

    if (isInternal) {
      // 内链绝不使用 nofollow
      relTokens.delete('nofollow');
      // 如果内链有 target="_blank"，补充 noopener
      if (existingTarget === '_blank') {
        relTokens.add('noopener');
      }
    } else {
      // 外链必须在新窗口打开
      if (!targetToSet) {
        targetToSet = '_blank';
      }
      // 默认带上 noopener
      relTokens.add('noopener');

      if (isNofollow) {
        relTokens.add('nofollow');
      } else {
        relTokens.delete('nofollow');
      }
    }

    // 重构 attrs
    let newAttrs = rawAttrs.replace(/\bhref=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, `href="${cleanUrl}"`).trim();

    // 更新或新增 target
    if (targetToSet) {
      if (targetMatch) {
        newAttrs = newAttrs.replace(/\btarget=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, `target="${targetToSet}"`);
      } else {
        newAttrs += ` target="${targetToSet}"`;
      }
    }

    // 更新或新增 rel
    const finalRel = Array.from(relTokens).join(' ');
    if (finalRel) {
      if (relMatch) {
        newAttrs = newAttrs.replace(/\brel=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, `rel="${finalRel}"`);
      } else {
        newAttrs += ` rel="${finalRel}"`;
      }
    } else if (relMatch) {
      newAttrs = newAttrs.replace(/\brel=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '').trim();
    }

    return `<a ${newAttrs.replace(/\s+/g, ' ').trim()}>`;
  });
}
