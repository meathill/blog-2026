import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WPPost } from '@/lib/wordpress';

const mockGetPostById = vi.fn();
const mockGetPosts = vi.fn();
const mockGetCategories = vi.fn();
const mockGetTags = vi.fn();

vi.mock('@/lib/wordpress', () => ({
  getPostById: (...args: unknown[]) => mockGetPostById(...args),
  getPosts: (...args: unknown[]) => mockGetPosts(...args),
  getCategories: (...args: unknown[]) => mockGetCategories(...args),
  getTags: (...args: unknown[]) => mockGetTags(...args),
  stripHtml: (html: string) => html.replace(/<[^>]*>/g, ''),
  buildPostDescription: (post: WPPost) => post.excerpt.rendered.replace(/<[^>]*>/g, ''),
}));

const mockCreateImportedBlogPostRecord = vi.fn();
const mockGetBlogPostIdByWpPostId = vi.fn();
const mockGetExistingWpPostIds = vi.fn();

vi.mock('@/lib/blog-storage', () => ({
  createImportedBlogPostRecord: (...args: unknown[]) => mockCreateImportedBlogPostRecord(...args),
  getBlogPostIdByWpPostId: (...args: unknown[]) => mockGetBlogPostIdByWpPostId(...args),
  getExistingWpPostIds: (...args: unknown[]) => mockGetExistingWpPostIds(...args),
}));

const mockBuildDraftContentFromMarkdown = vi.fn();

vi.mock('@/lib/mcp/blog-draft', () => ({
  buildDraftContentFromMarkdown: (...args: unknown[]) => mockBuildDraftContentFromMarkdown(...args),
}));

const { importBlogPostFromWordPress, searchWordPressPostsNotInD1 } = await import('@/lib/blog-import');

function buildMockWPPost(overrides: Partial<WPPost> = {}): WPPost {
  return {
    id: 123,
    date: '2026-01-01T00:00:00',
    modified: '2026-01-01T00:00:00',
    slug: 'old-post',
    title: { rendered: '老文章标题' },
    excerpt: { rendered: '<p>摘要</p>' },
    content: { rendered: '<p>正文内容</p>' },
    categories: [],
    tags: [],
    featured_media: 0,
    ...overrides,
  };
}

describe('blog-import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBlogPostIdByWpPostId.mockResolvedValue(null);
    mockGetCategories.mockResolvedValue([]);
    mockGetTags.mockResolvedValue([]);
    mockBuildDraftContentFromMarkdown.mockResolvedValue({ blocksJson: '[]', markdown: '正文内容' });
    mockCreateImportedBlogPostRecord.mockResolvedValue({ id: 'new-id', slug: 'old-post' });
  });

  describe('importBlogPostFromWordPress', () => {
    it('已经导入过时直接幂等返回，不重复导入', async () => {
      mockGetBlogPostIdByWpPostId.mockResolvedValue({ id: 'existing-id', slug: 'existing-slug' });

      const result = await importBlogPostFromWordPress(123);

      expect(result).toEqual({ id: 'existing-id', slug: 'existing-slug' });
      expect(mockGetPostById).not.toHaveBeenCalled();
      expect(mockCreateImportedBlogPostRecord).not.toHaveBeenCalled();
    });

    it('WordPress 文章不存在时抛出明确错误', async () => {
      mockGetPostById.mockResolvedValue(null);

      await expect(importBlogPostFromWordPress(999)).rejects.toThrow('WordPress 文章不存在或已删除。');
    });

    it('按权威 ID 数组解析分类/标签名，而不是信任 _embedded 的顺序', async () => {
      mockGetPostById.mockResolvedValue(buildMockWPPost({ categories: [3, 7], tags: [10] }));
      mockGetCategories.mockResolvedValue([
        { id: 3, name: 'Tech', slug: 'tech', count: 1 },
        { id: 9, name: 'X', slug: 'x', count: 1 },
      ]);
      mockGetTags.mockResolvedValue([{ id: 10, name: 'React', slug: 'react', count: 1 }]);

      await importBlogPostFromWordPress(123);

      expect(mockCreateImportedBlogPostRecord).toHaveBeenCalledWith(
        expect.objectContaining({ categories: ['Tech'], tags: ['React'] }),
      );
    });

    it('导入的文章 status 必须是 published，且写入 wpPostId/wpSyncedAt', async () => {
      mockGetPostById.mockResolvedValue(buildMockWPPost({ id: 456, slug: 'my-slug' }));

      await importBlogPostFromWordPress(456);

      expect(mockCreateImportedBlogPostRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          wpPostId: 456,
          wpSyncedAt: expect.any(Date),
          publishedAt: expect.any(Date),
        }),
      );
    });

    it('html 字段存 WordPress 原始 HTML，不是转换后再吐出来的版本', async () => {
      mockGetPostById.mockResolvedValue(
        buildMockWPPost({ content: { rendered: '<p>原始 <strong>HTML</strong></p>' } }),
      );

      await importBlogPostFromWordPress(123);

      expect(mockCreateImportedBlogPostRecord).toHaveBeenCalledWith(
        expect.objectContaining({ html: '<p>原始 <strong>HTML</strong></p>' }),
      );
    });

    it('封面图从 _embedded 的 featuredmedia 中取 source_url', async () => {
      mockGetPostById.mockResolvedValue(
        buildMockWPPost({
          _embedded: { 'wp:featuredmedia': [{ source_url: 'https://blog.meathill.com/cover.jpg' }] },
        }),
      );

      await importBlogPostFromWordPress(123);

      expect(mockCreateImportedBlogPostRecord).toHaveBeenCalledWith(
        expect.objectContaining({ coverImage: 'https://blog.meathill.com/cover.jpg' }),
      );
    });

    it('featuredmedia 缺失或形状异常时封面图为 null，不抛错', async () => {
      mockGetPostById.mockResolvedValue(buildMockWPPost({ _embedded: { 'wp:featuredmedia': [{}] as never } }));

      await importBlogPostFromWordPress(123);

      expect(mockCreateImportedBlogPostRecord).toHaveBeenCalledWith(expect.objectContaining({ coverImage: null }));
    });
  });

  describe('searchWordPressPostsNotInD1', () => {
    it('空搜索词直接短路返回 []，不调用 getPosts', async () => {
      const result = await searchWordPressPostsNotInD1('   ', 5);

      expect(result).toEqual([]);
      expect(mockGetPosts).not.toHaveBeenCalled();
    });

    it('过滤掉已经导入过的文章', async () => {
      mockGetPosts.mockResolvedValue({
        posts: [
          buildMockWPPost({ id: 1, title: { rendered: 'A' } }),
          buildMockWPPost({ id: 2, title: { rendered: 'B' } }),
          buildMockWPPost({ id: 3, title: { rendered: 'C' } }),
        ],
        total: 3,
        totalPages: 1,
      });
      mockGetExistingWpPostIds.mockResolvedValue(new Set([2]));

      const result = await searchWordPressPostsNotInD1('关键词', 5);

      expect(result.map((hit) => hit.wpPostId)).toEqual([1, 3]);
    });

    it('WordPress API 出错时返回 []，不往外抛', async () => {
      mockGetPosts.mockRejectedValue(new Error('network error'));

      const result = await searchWordPressPostsNotInD1('关键词', 5);

      expect(result).toEqual([]);
    });

    it('结果按 limit 裁剪', async () => {
      mockGetPosts.mockResolvedValue({
        posts: [buildMockWPPost({ id: 1 }), buildMockWPPost({ id: 2 }), buildMockWPPost({ id: 3 })],
        total: 3,
        totalPages: 1,
      });
      mockGetExistingWpPostIds.mockResolvedValue(new Set());

      const result = await searchWordPressPostsNotInD1('关键词', 2);

      expect(result).toHaveLength(2);
    });
  });
});
