const NON_PUBLIC_SLUGS = new Set(['null', 'undefined']);

/** 模板字符串会把 null 收成路径段 "null"（/tag/null、/posts/x/null）。这种值不能进链接。 */
export function isPublicSlug(slug: unknown): slug is string {
  if (typeof slug !== 'string') return false;
  const value = slug.trim();
  return value.length > 0 && !NON_PUBLIC_SLUGS.has(value);
}

export function decodePublicSlug(slug: unknown): string | null {
  if (!isPublicSlug(slug)) return null;
  try {
    const decoded = decodeURIComponent(slug);
    return isPublicSlug(decoded) ? decoded : null;
  } catch {
    return slug;
  }
}

export function rememberCategorySlug(map: Map<number, string>, id: number, slug: unknown): void {
  const decoded = decodePublicSlug(slug);
  if (decoded) {
    map.set(id, decoded);
  }
}

export function termPublicPath(kind: 'tag' | 'category', slug: unknown): string | null {
  const value = decodePublicSlug(slug);
  if (!value) return null;
  return `/${kind}/${value}`;
}

/** 搜索结果优先用索引里的规范文章路径，否则降级 /posts/{slug}。空 slug 不生成链接。 */
export function searchResultPath(url: string | undefined, slug: unknown): string | null {
  if (url) {
    try {
      const pathname = new URL(url, 'https://meathill.com').pathname.replace(/^\/en(?=\/)/, '');
      const segments = pathname.split('/').filter(Boolean);
      if (segments[0] === 'posts' && segments.length > 1 && segments.slice(1).every((part) => isPublicSlug(part))) {
        return pathname;
      }
    } catch {
      // 非法 url 落到 slug
    }
  }
  const value = decodePublicSlug(slug);
  if (!value) return null;
  return `/posts/${value}`;
}
