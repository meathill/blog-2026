import { describe, expect, it } from 'vitest';
import {
  BLOG_SYNC_TOLERANCE_MS,
  buildBlogSlug,
  hasMeaningfulBlogBlocks,
  parseBlogStringListInput,
  parseStoredStringList,
  shouldSyncBlogPostToWordPress,
} from '@/lib/blog-post';

describe('blog-post', () => {
  describe('parseStoredStringList', () => {
    it('应该解析已存储的 JSON 字符串数组', () => {
      expect(parseStoredStringList('["技术","前端"]')).toEqual(['技术', '前端']);
    });

    it('应该在非法 JSON 时返回空数组', () => {
      expect(parseStoredStringList('{ invalid json }')).toEqual([]);
    });

    it('应该过滤空字符串和非字符串成员', () => {
      expect(parseStoredStringList('["react","",1,null,"nextjs"]')).toEqual(['react', 'nextjs']);
    });
  });

  describe('parseBlogStringListInput', () => {
    it('应该按逗号和换行拆分并去重', () => {
      expect(parseBlogStringListInput('技术, 前端\n技术, block editor')).toEqual(['技术', '前端', 'block editor']);
    });

    it('空输入应该返回空数组', () => {
      expect(parseBlogStringListInput('')).toEqual([]);
      expect(parseBlogStringListInput(null)).toEqual([]);
    });
  });

  describe('buildBlogSlug', () => {
    it('应该优先使用手动输入的 slug', () => {
      expect(buildBlogSlug('忽略标题', 'custom_slug')).toBe('custom-slug');
    });

    it('应该在没有手动输入时根据标题生成 slug', () => {
      expect(buildBlogSlug('BlockNote 集成实战')).toBe('blocknote');
    });

    it('无法生成 slug 时应该抛错', () => {
      expect(() => buildBlogSlug('!!!')).toThrow('标题无法自动生成 slug');
    });
  });

  describe('shouldSyncBlogPostToWordPress', () => {
    it('未发布文章不应标记为待同步', () => {
      expect(shouldSyncBlogPostToWordPress('draft', new Date(), null)).toBe(false);
    });

    it('已发布但未同步的文章应标记为待同步', () => {
      expect(shouldSyncBlogPostToWordPress('published', new Date(), null)).toBe(true);
    });

    it('更新时间超过容忍窗口后应标记为待同步', () => {
      const updatedAt = new Date('2026-03-15T12:10:00.000Z');
      const syncedAt = new Date(updatedAt.getTime() - BLOG_SYNC_TOLERANCE_MS - 1);

      expect(shouldSyncBlogPostToWordPress('published', updatedAt, syncedAt)).toBe(true);
    });

    it('更新时间仍在容忍窗口内时不应重复同步', () => {
      const updatedAt = new Date('2026-03-15T12:10:00.000Z');
      const syncedAt = new Date(updatedAt.getTime() - BLOG_SYNC_TOLERANCE_MS + 1);

      expect(shouldSyncBlogPostToWordPress('published', updatedAt, syncedAt)).toBe(false);
    });
  });

  describe('hasMeaningfulBlogBlocks', () => {
    it('纯空段落不应视为有效正文', () => {
      expect(hasMeaningfulBlogBlocks([{ type: 'paragraph', content: '' }])).toBe(false);
    });

    it('包含文本内容时应视为有效正文', () => {
      expect(
        hasMeaningfulBlogBlocks([
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'BlockNote 正文', styles: {} }],
          },
        ]),
      ).toBe(true);
    });

    it('图片块即使没有文本也应视为有效正文', () => {
      expect(
        hasMeaningfulBlogBlocks([
          {
            type: 'image',
            props: {
              url: 'https://example.com/cover.jpg',
            },
          },
        ]),
      ).toBe(true);
    });
  });
});
