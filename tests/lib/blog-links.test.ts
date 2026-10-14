import { describe, expect, it } from 'vitest';
import {
  cleanLinkUrl,
  encodeLinkUrl,
  isInternalLink,
  parseLinkUrl,
  processBlogHtmlLinks,
  stripDofollowMarkers,
} from '@/lib/blog-links';

describe('blog-links 工具函数', () => {
  describe('isInternalLink', () => {
    it('正确识别站内相对路径与锚点', () => {
      expect(isInternalLink('/')).toBe(true);
      expect(isInternalLink('/posts/hello-world')).toBe(true);
      expect(isInternalLink('#section-1')).toBe(true);
      expect(isInternalLink('mailto:meathill@example.com')).toBe(true);
      expect(isInternalLink('tel:12345678')).toBe(true);
    });

    it('正确识别我站官方域名与本地开发环境', () => {
      expect(isInternalLink('https://meathill.com/posts/abc')).toBe(true);
      expect(isInternalLink('http://blog.meathill.com/tech')).toBe(true);
      expect(isInternalLink('https://demo.meathill.com/')).toBe(true);
      expect(isInternalLink('http://localhost:3000/admin')).toBe(true);
      expect(isInternalLink('http://127.0.0.1:8080/test')).toBe(true);
    });

    it('正确识别外部链接', () => {
      expect(isInternalLink('https://github.com/meathill')).toBe(false);
      expect(isInternalLink('https://google.com')).toBe(false);
      expect(isInternalLink('https://partner-site.org/friendly-link')).toBe(false);
    });
  });

  describe('parseLinkUrl 与 cleanLinkUrl', () => {
    it('外部普通链接默认标记为 nofollow', () => {
      const parsed = parseLinkUrl('https://example.com/cool-tool');
      expect(parsed.isInternal).toBe(false);
      expect(parsed.isNofollow).toBe(true);
      expect(parsed.cleanUrl).toBe('https://example.com/cool-tool');
      expect(cleanLinkUrl('https://example.com/cool-tool')).toBe('https://example.com/cool-tool');
    });

    it('带有 dofollow 标记的外链被识别为交换链接 (dofollow)', () => {
      const urlWithHash = 'https://friend.com/blog#__dofollow';
      const parsed = parseLinkUrl(urlWithHash);
      expect(parsed.isInternal).toBe(false);
      expect(parsed.isNofollow).toBe(false);
      expect(parsed.cleanUrl).toBe('https://friend.com/blog');
      expect(cleanLinkUrl(urlWithHash)).toBe('https://friend.com/blog');
    });

    it('带有 query/hash 混用情况下的 dofollow 标记解析', () => {
      const urlWithAnchor = 'https://friend.com/blog#section&__dofollow';
      const parsed = parseLinkUrl(urlWithAnchor);
      expect(parsed.isNofollow).toBe(false);
      expect(parsed.cleanUrl).toBe('https://friend.com/blog#section');
    });

    it('站内链接即使带 marker 也是 dofollow', () => {
      const parsed = parseLinkUrl('/posts/my-post#__dofollow');
      expect(parsed.isInternal).toBe(true);
      expect(parsed.isNofollow).toBe(false);
      expect(parsed.cleanUrl).toBe('/posts/my-post');
    });
  });

  describe('encodeLinkUrl', () => {
    it('站内链接不添加任何标记', () => {
      expect(encodeLinkUrl('/posts/abc', false)).toBe('/posts/abc');
      expect(encodeLinkUrl('https://meathill.com/about', false)).toBe('https://meathill.com/about');
    });

    it('外部链接如果是 nofollow，保持干净 URL', () => {
      expect(encodeLinkUrl('https://github.com/meathill', true)).toBe('https://github.com/meathill');
    });

    it('外部链接如果取消 nofollow (交换友链)，编码追加 dofollow 标记', () => {
      expect(encodeLinkUrl('https://friend-site.com', false)).toBe('https://friend-site.com#__dofollow');
      expect(encodeLinkUrl('https://friend-site.com#anchor', false)).toBe('https://friend-site.com#anchor&__dofollow');
    });

    it('重复编码不会产生重复 marker', () => {
      const encoded = encodeLinkUrl('https://friend-site.com#__dofollow', false);
      expect(encoded).toBe('https://friend-site.com#__dofollow');
    });
  });

  describe('stripDofollowMarkers', () => {
    it('剥离 Markdown 文本中的 marker', () => {
      const markdown =
        '欢迎访问 [友链博客](https://friend.com#__dofollow) 和 [锚点](https://friend.com#faq&__dofollow)。';
      expect(stripDofollowMarkers(markdown)).toBe(
        '欢迎访问 [友链博客](https://friend.com) 和 [锚点](https://friend.com#faq)。',
      );
    });
  });

  describe('processBlogHtmlLinks', () => {
    it('外部普通链接默认带 target="_blank" 和 rel="noopener nofollow"', () => {
      const html = '<p>请参考 <a href="https://example.com/docs">官方文档</a>。</p>';
      const result = processBlogHtmlLinks(html);
      expect(result).toBe(
        '<p>请参考 <a href="https://example.com/docs" target="_blank" rel="noopener nofollow">官方文档</a>。</p>',
      );
    });

    it('带有 dofollow 标记的交换链接剥离标记，输出 target="_blank" 和 rel="noopener"，绝不带 nofollow', () => {
      const html = '<p>特别鸣谢友链：<a href="https://friend.com/blog#__dofollow">好友博客</a>。</p>';
      const result = processBlogHtmlLinks(html);
      expect(result).toBe(
        '<p>特别鸣谢友链：<a href="https://friend.com/blog" target="_blank" rel="noopener">好友博客</a>。</p>',
      );
      expect(result).not.toContain('__dofollow');
      expect(result).not.toContain('nofollow');
    });

    it('站内链接不加 nofollow；若带 target="_blank" 补全 rel="noopener"', () => {
      const html =
        '<p><a href="/posts/hello">本站文章</a> 和 <a href="https://meathill.com/about" target="_blank">关于</a></p>';
      const result = processBlogHtmlLinks(html);
      expect(result).toContain('<a href="/posts/hello">本站文章</a>');
      expect(result).toContain('<a href="https://meathill.com/about" target="_blank" rel="noopener">关于</a>');
      expect(result).not.toContain('nofollow');
    });

    it('清洗 BlockNote 默认强加的 rel="noopener noreferrer nofollow"', () => {
      // 当 BlockNote 输出写死 nofollow 时，若 URL 带有 dofollow 标记，应正确清洗成 rel="noopener"
      const html =
        '<a href="https://friend.com#__dofollow" target="_blank" rel="noopener noreferrer nofollow">友链</a>';
      const result = processBlogHtmlLinks(html);
      expect(result).toBe('<a href="https://friend.com" target="_blank" rel="noopener">友链</a>');
    });
  });
});
