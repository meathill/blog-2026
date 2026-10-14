/** 浏览器缓存。边缘 TTL 看 Cloudflare-CDN-Cache-Control，不靠这条里的 s-maxage。 */
export const OG_CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

/** Workers Cache 优先读这个头。max-age 是边缘 TTL，响应返回给浏览器前会被 Cloudflare 去掉。 */
export const OG_EDGE_CACHE_CONTROL = 'max-age=86400, stale-while-revalidate=604800';

const NO_STORE = 'no-store';

export function ogImageHeaders(contentType: string, cacheable: boolean): Record<string, string> {
  if (!cacheable) {
    return {
      'Content-Type': contentType,
      'Cache-Control': NO_STORE,
      'Cloudflare-CDN-Cache-Control': NO_STORE,
    };
  }
  return {
    'Content-Type': contentType,
    'Cache-Control': OG_CACHE_CONTROL,
    'Cloudflare-CDN-Cache-Control': OG_EDGE_CACHE_CONTROL,
  };
}
