import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPosts,
  getPost,
  getPostById,
  createPost,
  getPostsByCategory,
  getPostsByTag,
  __resetPostCountCache,
} from '../../src/lib/wordpress/posts';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Mock Cloudflare Env
const env = {
  WP_USERNAME: 'test_user',
  WP_APP_PASSWORD: 'test_password',
  WORDPRESS_API_URL: 'https://mock-wp.com/wp-json/wp/v2',
  CF_ACCESS_CLIENT_ID: 'mock_id',
  CF_ACCESS_CLIENT_SECRET: 'mock_secret',
} as any;

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(),
}));

describe('WordPress Posts Module', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    __resetPostCountCache();
    (getCloudflareContext as any).mockResolvedValue({
      env,
    });

    global.fetch = vi.fn();
  });

  describe('getPosts', () => {
    it('should fetch posts with correct parameters', async () => {
      const mockPosts = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, title: { rendered: 'Test Post' } }));
      const mockResponse = {
        ok: true,
        json: async () => mockPosts,
        headers: {
          get: (key: string) => {
            if (key === 'X-WP-Total') return '10';
            if (key === 'X-WP-TotalPages') return '2';
            return null;
          },
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await getPosts({ page: 1, perPage: 5 });

      expect(getCloudflareContext).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock-wp.com/wp-json/wp/v2/posts?_embed=true&per_page=5',
        expect.objectContaining({
          headers: expect.objectContaining({
            'CF-Access-Client-Id': 'mock_id',
          }),
        }),
      );
      expect(result).toEqual({ posts: mockPosts, total: 10, totalPages: 2 });
    });

    it('should handle search and categories', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      });

      await getPosts({ search: 'query', categories: [1, 2] });

      const url = (global.fetch as any).mock.calls[0][0];
      expect(url).toContain('search=query');
      expect(url).toContain('categories=1%2C2');
    });

    it('should respect embed parameter', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      });

      await getPosts({ embed: false });

      const url = (global.fetch as any).mock.calls[0][0];
      expect(url).not.toContain('_embed=true');

      await getPosts({ embed: true });
      const url2 = (global.fetch as any).mock.calls[1][0];
      expect(url2).toContain('_embed=true');
    });

    it('should respect fields parameter', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      });

      await getPosts({ fields: ['id', 'slug'] });

      const url = (global.fetch as any).mock.calls[0][0];
      expect(url).toContain('_fields=id%2Cslug');
    });

    it('should join slug list into the slug query param', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      });

      await getPosts({ slug: ['a', 'b', 'c'] });

      const url = (global.fetch as any).mock.calls[0][0];
      expect(url).toContain('slug=a%2Cb%2Cc');
    });

    it('should default perPage to slug count when perPage is not explicit', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      });

      await getPosts({ slug: ['a', 'b', 'c'] });

      const url = (global.fetch as any).mock.calls[0][0];
      expect(url).toContain('per_page=3');
    });

    it('should cap the slug-derived perPage default at 100', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      });

      const slugs = Array.from({ length: 150 }, (_, i) => `slug-${i}`);
      await getPosts({ slug: slugs });

      const url = (global.fetch as any).mock.calls[0][0];
      expect(url).toContain('per_page=100');
    });

    it('should let an explicit perPage take priority over the slug count default', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
        headers: { get: () => '0' },
      });

      await getPosts({ slug: ['a', 'b', 'c'], perPage: 5 });

      const url = (global.fetch as any).mock.calls[0][0];
      expect(url).toContain('per_page=5');
    });

    // Issue #13：线上 WP 的 X-WP-Total 恒等于本页条数，page>=2 会被 400 拒绝
    it('should paginate with offset instead of page', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => Array.from({ length: 20 }, (_, i) => ({ id: i })),
        headers: { get: (key: string) => (key === 'X-WP-Total' ? '800' : '40') },
      });

      const result = await getPosts({ page: 3, perPage: 20, embed: false });

      const url = (global.fetch as any).mock.calls[0][0];
      expect(url).toContain('offset=40');
      expect(url).not.toContain('page=3');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.total).toBe(800);
      expect(result.totalPages).toBe(40);
    });

    const brokenPage = (n: number) => ({
      ok: true,
      json: async () => Array.from({ length: n }, (_, i) => ({ id: i })),
      headers: { get: (key: string) => (key === 'X-WP-Total' ? String(n) : '1') },
    });

    it('should count real total when withTotal is set and X-WP-Total only reflects the current page', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce(brokenPage(20)) // 列表页本身
        .mockResolvedValueOnce(brokenPage(100)) // 计数扫描 offset=0
        .mockResolvedValueOnce(brokenPage(57)); // 计数扫描 offset=100，未满即结束

      const result = await getPosts({ perPage: 20, embed: false, withTotal: true });

      const calls = (global.fetch as any).mock.calls.map((c: any[]) => c[0]);
      expect(calls).toHaveLength(3);
      expect(calls[1]).toContain('_fields=id');
      expect(calls[1]).toContain('per_page=100');
      expect(calls[1]).not.toContain('offset=');
      expect(calls[2]).toContain('offset=100');
      expect(result.total).toBe(157);
      expect(result.totalPages).toBe(8);
    });

    it('should derive total from a partial last page without extra requests', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => Array.from({ length: 7 }, (_, i) => ({ id: i })),
        headers: { get: () => '7' },
      });

      const result = await getPosts({ page: 8, perPage: 20, embed: false, withTotal: true });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.total).toBe(147);
      expect(result.totalPages).toBe(8);
    });

    it('should keep filters when counting', async () => {
      (global.fetch as any).mockResolvedValueOnce(brokenPage(50)).mockResolvedValueOnce(brokenPage(83));

      const result = await getPosts({ categories: [9], perPage: 50, withTotal: true });

      expect((global.fetch as any).mock.calls[1][0]).toContain('categories=9');
      expect(result.total).toBe(83);
      expect(result.totalPages).toBe(2);
    });

    // 构建超时回归：文章详情页的相关文章（满载 + header 失真）不能触发计数
    it('should make exactly one request for a post-detail style call without withTotal', async () => {
      (global.fetch as any).mockResolvedValue(brokenPage(6));

      const byTags = await getPosts({ tags: [1, 2, 3], perPage: 6, embed: true });
      const byCats = await getPosts({ categories: [4], perPage: 6, embed: true });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      for (const call of (global.fetch as any).mock.calls) {
        expect(call[0]).not.toContain('_fields=id');
      }
      expect(byTags.posts).toHaveLength(6);
      expect(byTags.total).toBe(6);
      expect(byCats.totalPages).toBe(1);
    });

    it('should never count via getPostsByCategory / getPostsByTag unless withTotal is passed', async () => {
      (global.fetch as any).mockResolvedValue(brokenPage(3));

      await getPostsByCategory(4, 1, 3);
      await getPostsByTag(5, 1, 3);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should cache the count per filter across calls and pages', async () => {
      (global.fetch as any).mockImplementation(async (url: string) => {
        if (url.includes('_fields=id')) {
          return brokenPage(url.includes('offset=') ? 30 : 100); // 总数 130
        }
        return brokenPage(20);
      });

      const p1 = await getPosts({ perPage: 20, embed: false, withTotal: true });
      const p2 = await getPosts({ page: 2, perPage: 20, embed: false, withTotal: true });
      const p3 = await getPosts({ page: 3, perPage: 20, embed: false, withTotal: true });

      const scans = (global.fetch as any).mock.calls.filter((c: any[]) => c[0].includes('_fields=id'));
      expect(scans).toHaveLength(2); // 只数一次（两次扫描请求）
      expect((global.fetch as any).mock.calls).toHaveLength(5);
      expect([p1.total, p2.total, p3.total]).toEqual([130, 130, 130]);
      expect(p3.totalPages).toBe(7);

      // 不同过滤条件各自计数
      await getPosts({ categories: [9], perPage: 20, embed: false, withTotal: true });
      const scansAfter = (global.fetch as any).mock.calls.filter((c: any[]) => c[0].includes('_fields=id'));
      expect(scansAfter).toHaveLength(4);
      expect(scansAfter[2][0]).toContain('categories=9');
    });

    it('should share one in-flight count between concurrent callers', async () => {
      (global.fetch as any).mockImplementation(async (url: string) =>
        url.includes('_fields=id') ? brokenPage(42) : brokenPage(20),
      );

      const results = await Promise.all(
        [1, 2, 3, 4].map((page) => getPosts({ page, perPage: 20, embed: false, withTotal: true })),
      );

      const scans = (global.fetch as any).mock.calls.filter((c: any[]) => c[0].includes('_fields=id'));
      expect(scans).toHaveLength(1);
      // 第 4 页 offset=60 已取到 80 篇，总数至少为已加载数
      expect(results.map((r) => r.total)).toEqual([42, 42, 60, 80]);
    });

    // 回归：越界空页曾把 offset 当成总数下限，/posts/page/999 → 998 → … 无限重定向
    it('should not treat an out-of-range empty page as existing', async () => {
      (global.fetch as any).mockImplementation(async (url: string) => {
        if (url.includes('_fields=id')) {
          return brokenPage(url.includes('offset=') ? 30 : 100); // 真实总数 130
        }
        return brokenPage(0);
      });

      const withTotal = await getPosts({ page: 999, perPage: 20, embed: false, withTotal: true });
      expect(withTotal.posts).toHaveLength(0);
      expect(withTotal.total).toBe(130);
      expect(withTotal.totalPages).toBe(7);

      const fetchesBefore = (global.fetch as any).mock.calls.length;
      const plain = await getPosts({ page: 999, perPage: 20, embed: false });
      expect((global.fetch as any).mock.calls.length - fetchesBefore).toBe(1);
      expect(plain.totalPages).toBe(0);
    });

    it('should not cache a failed count', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce(brokenPage(20))
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce(brokenPage(20))
        .mockResolvedValueOnce(brokenPage(55));

      await expect(getPosts({ perPage: 20, embed: false, withTotal: true })).rejects.toThrow('network');
      const result = await getPosts({ perPage: 20, embed: false, withTotal: true });

      expect(result.total).toBe(55);
    });

    it('should return an empty result without fetching when slug is an empty array', async () => {
      const result = await getPosts({ slug: [] });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result).toEqual({ posts: [], total: 0, totalPages: 0 });
    });
  });

  describe('getPost', () => {
    it('should fetch a single post by slug', async () => {
      const mockPost = { id: 1, slug: 'hello-world' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [mockPost],
      });

      const result = await getPost('hello-world');

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/posts?slug=hello-world'), expect.anything());
      expect(result).toEqual(mockPost);
    });

    it('should return null if not found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const result = await getPost('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getPostById', () => {
    it('should fetch a single post by id', async () => {
      const mockPost = { id: 42, slug: 'hello-world' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPost,
      });

      const result = await getPostById(42);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock-wp.com/wp-json/wp/v2/posts/42?_embed=true',
        expect.objectContaining({
          headers: expect.objectContaining({
            'CF-Access-Client-Id': 'mock_id',
          }),
        }),
      );
      expect(result).toEqual(mockPost);
    });

    it('should return null on 404', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await getPostById(404);
      expect(result).toBeNull();
    });
  });

  describe('createPost', () => {
    it('should send POST request with correct headers', async () => {
      const mockPost = { id: 1, title: { rendered: 'New Post' } };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPost,
      });

      const postData = { title: 'New Post', content: 'Content' };
      const result = await createPost(env, postData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock-wp.com/wp-json/wp/v2/posts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Basic'),
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(postData),
        }),
      );
      expect(result).toEqual(mockPost);
    });
  });
});
