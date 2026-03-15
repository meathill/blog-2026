import { describe, expect, it } from 'vitest';
import { getInitialBlogBlocks, parseBlogBlocksJson } from '@/lib/blog-blocks';
import { DEFAULT_BLOG_BLOCKS } from '@/lib/blog-post';

describe('blog-blocks', () => {
  describe('parseBlogBlocksJson', () => {
    it('应该解析合法的 block JSON', () => {
      const value = JSON.stringify([{ type: 'paragraph', content: 'hello' }]);
      expect(parseBlogBlocksJson(value)).toEqual([{ type: 'paragraph', content: 'hello' }]);
    });

    it('空字符串应该报错', () => {
      expect(() => parseBlogBlocksJson('')).toThrow('正文内容不能为空。');
    });

    it('不是数组的 JSON 应该报错', () => {
      expect(() => parseBlogBlocksJson('{"type":"paragraph"}')).toThrow('正文内容格式无效。');
    });

    it('非法 JSON 应该报错', () => {
      expect(() => parseBlogBlocksJson('{')).toThrow('正文内容不是合法的 Block JSON。');
    });
  });

  describe('getInitialBlogBlocks', () => {
    it('空值时应该返回默认 block', () => {
      expect(getInitialBlogBlocks('')).toEqual(DEFAULT_BLOG_BLOCKS);
    });

    it('非法 JSON 时应该回退到默认 block', () => {
      expect(getInitialBlogBlocks('{')).toEqual(DEFAULT_BLOG_BLOCKS);
    });

    it('空数组时应该回退到默认 block', () => {
      expect(getInitialBlogBlocks('[]')).toEqual(DEFAULT_BLOG_BLOCKS);
    });

    it('合法数组时应该返回原始 block', () => {
      const value = JSON.stringify([{ type: 'heading', content: '标题' }]);
      expect(getInitialBlogBlocks(value)).toEqual([{ type: 'heading', content: '标题' }]);
    });
  });
});
