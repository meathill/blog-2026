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
      const mockPosts = [{ id: 1, title: { rendered: 'Test Post' } }];
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
        'https://mock-wp.com/wp-json/wp/v2/posts?_embed=true&per_page=5&page=1',
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
