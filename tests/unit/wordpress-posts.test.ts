import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPosts, getPost, getPostById, createPost } from '../../src/lib/wordpress/posts';
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

    it('should count real total when X-WP-Total only reflects the current page', async () => {
      const page = (n: number) => ({
        ok: true,
        json: async () => Array.from({ length: n }, (_, i) => ({ id: i })),
        headers: { get: (key: string) => (key === 'X-WP-Total' ? String(n) : '1') },
      });
      (global.fetch as any)
        .mockResolvedValueOnce(page(20)) // 列表页本身
        .mockResolvedValueOnce(page(100)) // 计数扫描 offset=20
        .mockResolvedValueOnce(page(37)); // 计数扫描 offset=120，未满即结束

      const result = await getPosts({ perPage: 20, embed: false });

      const calls = (global.fetch as any).mock.calls.map((c: any[]) => c[0]);
      expect(calls[1]).toContain('_fields=id');
      expect(calls[1]).toContain('per_page=100');
      expect(calls[1]).toContain('offset=20');
      expect(calls[2]).toContain('offset=120');
      expect(result.total).toBe(157);
      expect(result.totalPages).toBe(8);
    });

    it('should derive total from a partial last page without extra requests', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => Array.from({ length: 7 }, (_, i) => ({ id: i })),
        headers: { get: () => '7' },
      });

      const result = await getPosts({ page: 8, perPage: 20, embed: false });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result.total).toBe(147);
      expect(result.totalPages).toBe(8);
    });

    it('should keep filters when counting', async () => {
      const page = (n: number) => ({
        ok: true,
        json: async () => Array.from({ length: n }, (_, i) => ({ id: i })),
        headers: { get: (key: string) => (key === 'X-WP-Total' ? String(n) : '1') },
      });
      (global.fetch as any).mockResolvedValueOnce(page(50)).mockResolvedValueOnce(page(33));

      const result = await getPosts({ categories: [9], perPage: 50 });

      expect((global.fetch as any).mock.calls[1][0]).toContain('categories=9');
      expect(result.total).toBe(83);
      expect(result.totalPages).toBe(2);
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
