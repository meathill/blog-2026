import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/search'],
      },
      // Ahrefs Site Audit 免费版每月约 1 万 crawl credits（每月 20 日重置），
      // 而 tag 页有 3000+ 且全部 noindex（by design），白白烧掉三分之一额度。
      // 免费版 UI 没有 exclude patterns，只能在 robots.txt 里对其 UA 单独禁爬；
      // 通配组不加此规则，Google 仍可正常爬到 tag 页上的 noindex。
      {
        userAgent: 'AhrefsSiteAudit',
        allow: '/',
        disallow: ['/api/', '/_next/', '/search', '/tag/', '/en/tag/'],
      },
    ],
    sitemap: 'https://meathill.com/sitemap.xml',
  };
}
