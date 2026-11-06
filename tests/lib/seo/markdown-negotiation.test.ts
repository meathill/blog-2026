import { describe, expect, it, vi } from 'vitest';
import { isMarkdownAccepted, isNegotiableContentPath, resolvePathMarkdown } from '@/lib/seo/markdown-negotiation';

vi.mock('@/lib/wordpress', async () => {
  return {
    getPost: vi.fn(async (slug: string) => {
      if (slug === 'valid-post') {
        return {
          id: 1,
          slug: 'valid-post',
          date: '2026-05-01T12:00:00',
          title: { rendered: '测试文章标题' },
          content: { rendered: '<p>这是测试正文内容。</p>' },
        };
      }
      return null;
    }),
    stripHtml: (str: string) => str.replace(/<[^>]*>?/gm, ''),
  };
});

describe('seo/markdown-negotiation', () => {
  describe('isMarkdownAccepted', () => {
    it('当 Accept 包含 text/markdown 时返回 true', () => {
      expect(isMarkdownAccepted('text/markdown')).toBe(true);
      expect(isMarkdownAccepted('text/markdown, text/html;q=0.9')).toBe(true);
      expect(isMarkdownAccepted('TEXT/MARKDOWN')).toBe(true);
    });

    it('当 Accept 为常规浏览器请求或空时返回 false', () => {
      expect(isMarkdownAccepted('text/html,application/xhtml+xml,application/xml;q=0.9')).toBe(false);
      expect(isMarkdownAccepted(undefined)).toBe(false);
      expect(isMarkdownAccepted(null)).toBe(false);
      expect(isMarkdownAccepted('')).toBe(false);
    });
  });

  describe('isNegotiableContentPath', () => {
    it('命中文章详情路径', () => {
      expect(isNegotiableContentPath('/posts/tech/valid-post')).toBe(true);
      expect(isNegotiableContentPath('/posts/valid-post')).toBe(true);
      expect(isNegotiableContentPath('/en/posts/valid-post')).toBe(true);
    });

    it('排除文章分页与作者等非单篇正文页', () => {
      expect(isNegotiableContentPath('/posts/page/2')).toBe(false);
      expect(isNegotiableContentPath('/posts/author/meathill')).toBe(false);
    });

    it('命中首页、工具说明、方案与技能详情页', () => {
      expect(isNegotiableContentPath('/')).toBe(true);
      expect(isNegotiableContentPath('/en')).toBe(true);
      expect(isNegotiableContentPath('/cloudflare-billing-helper')).toBe(true);
      expect(isNegotiableContentPath('/en/cloudflare-billing-helper')).toBe(true);
      expect(isNegotiableContentPath('/solutions/ai-integration')).toBe(true);
      expect(isNegotiableContentPath('/skills/claude-skill')).toBe(true);
    });

    it('常规列表或普通功能页不属于协商路径', () => {
      expect(isNegotiableContentPath('/about')).toBe(false);
      expect(isNegotiableContentPath('/category/tech')).toBe(false);
    });
  });

  describe('resolvePathMarkdown', () => {
    it('成功解析首页为 Markdown 文本', async () => {
      const markdown = await resolvePathMarkdown('/');
      expect(markdown).not.toBeNull();
      expect(markdown).toContain('# Meathill Studio');
      expect(markdown).toContain('cloudflare-billing-helper');
    });
    it('成功解析文章为 Markdown 文本', async () => {
      const markdown = await resolvePathMarkdown('/posts/tech/valid-post');
      expect(markdown).not.toBeNull();
      expect(markdown).toContain('# 测试文章标题');
      expect(markdown).toContain('发布日期: 2026-05-01');
      expect(markdown).toContain('这是测试正文内容。');
    });

    it('文章不存在时返回 null', async () => {
      const markdown = await resolvePathMarkdown('/posts/tech/not-found-slug');
      expect(markdown).toBeNull();
    });

    it('成功解析工具说明页 /cloudflare-billing-helper', async () => {
      const markdown = await resolvePathMarkdown('/cloudflare-billing-helper');
      expect(markdown).not.toBeNull();
      expect(markdown).toContain('# Cloudflare 账单');
      expect(markdown).toContain('核心能力');
      expect(markdown).toContain('常见问题');
      expect(markdown).toContain(
        'https://chromewebstore.google.com/detail/cloudflare-billing-helper/lhaplnigoplpfnlbpiohjofgmieihdgd',
      );
      expect(markdown).toContain('https://github.com/meathill/cloudflare-billing-helper');
      expect(markdown).not.toContain('cloudflare-billing-helper-0.2.0-chrome.zip');
    });
  });
});
