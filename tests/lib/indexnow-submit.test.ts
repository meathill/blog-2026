import { describe, it, expect } from 'vitest';
import { chunkArray, deriveEnPostsUrls, parseSitemapUrls, toAbsoluteUrl } from '../../scripts/indexnow-submit';

const SITEMAP_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<url>
<loc>https://meathill.com/posts/next-js/recent-post</loc>
<lastmod>2026-07-20T00:00:00.000Z</lastmod>
<xhtml:link rel="alternate" hreflang="zh" href="https://meathill.com/posts/next-js/recent-post"/>
</url>
<url>
<loc>https://meathill.com/posts/infra/old-post</loc>
<lastmod>2026-01-01T00:00:00.000Z</lastmod>
</url>
<url>
<loc>https://meathill.com/search?q=a&amp;b=c</loc>
<lastmod>2026-07-20T00:00:00.000Z</lastmod>
</url>
<url>
<loc>https://meathill.com/no-lastmod</loc>
</url>
</urlset>`;

describe('indexnow-submit', () => {
  describe('parseSitemapUrls', () => {
    it('只保留 lastmod 晚于 cutoff 的 URL，无 lastmod 跳过', () => {
      const cutoff = Date.parse('2026-07-01T00:00:00.000Z');
      const urls = parseSitemapUrls(SITEMAP_FIXTURE, cutoff);
      expect(urls).toContain('https://meathill.com/posts/next-js/recent-post');
      expect(urls).not.toContain('https://meathill.com/posts/infra/old-post');
      expect(urls).not.toContain('https://meathill.com/no-lastmod');
    });

    it('解码 XML 实体', () => {
      const cutoff = Date.parse('2026-07-01T00:00:00.000Z');
      const urls = parseSitemapUrls(SITEMAP_FIXTURE, cutoff);
      expect(urls).toContain('https://meathill.com/search?q=a&b=c');
    });

    it('cutoff 为 0 时返回全量 URL（包含无 lastmod 的条目）', () => {
      expect(parseSitemapUrls(SITEMAP_FIXTURE, 0)).toHaveLength(4);
    });
  });

  describe('deriveEnPostsUrls', () => {
    it('为包含 /posts/ 的 URL 衍生出 /en/posts/ 对应条目', () => {
      const input = ['https://meathill.com/posts/tech/foo', 'https://meathill.com/about'];
      const output = deriveEnPostsUrls(input);
      expect(output).toContain('https://meathill.com/posts/tech/foo');
      expect(output).toContain('https://meathill.com/en/posts/tech/foo');
      expect(output).toContain('https://meathill.com/about');
      expect(output).toHaveLength(3);
    });
  });

  describe('chunkArray', () => {
    it('按给定批次大小切片', () => {
      const list = [1, 2, 3, 4, 5];
      expect(chunkArray(list, 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('toAbsoluteUrl', () => {
    it('路径补站点前缀，绝对 URL 原样返回', () => {
      expect(toAbsoluteUrl('/posts/next-js/foo')).toBe('https://meathill.com/posts/next-js/foo');
      expect(toAbsoluteUrl('https://meathill.com/bar')).toBe('https://meathill.com/bar');
    });

    it('无法识别的输入抛错', () => {
      expect(() => toAbsoluteUrl('posts/foo')).toThrow();
    });
  });
});
