import { describe, it, expect, vi, beforeEach } from 'vitest';
import sitemap from '@/app/sitemap';

// Mock dependencies
const mockGetCloudflareContext = vi.fn();
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => mockGetCloudflareContext(),
}));

const mockGetPosts = vi.fn();
const mockGetCategories = vi.fn();
const mockGetTags = vi.fn();
vi.mock('@/lib/wordpress', () => ({
  getPosts: (...args: any[]) => mockGetPosts(...args),
  getCategories: (...args: any[]) => mockGetCategories(...args),
  getTags: (...args: any[]) => mockGetTags(...args),
}));

const mockGetDb = vi.fn();
vi.mock('@/lib/db', () => ({
  getDb: () => mockGetDb(),
}));

vi.mock('@/db/schema', () => ({
  apps: { status: 'status', slug: 'slug', updatedAt: 'updatedAt' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

describe('Sitemap Generator', () => {
  const SITE_URL = 'https://example.com';

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetCloudflareContext.mockResolvedValue({
      env: {
        NEXT_PUBLIC_SITE_URL: SITE_URL,
      },
    });

    // Default successful mocks
    // Default successful mocks
    mockGetPosts.mockImplementation((params) => {
      const page = params?.page || 1;
      if (page === 1) {
        return Promise.resolve({
          posts: [
            { slug: 'post-1', date: '2023-01-01', categories: [101] },
            { slug: 'post-2', date: '2023-01-02', categories: [101] },
          ],
          total: 4,
          totalPages: 2,
        });
      }
      if (page === 2) {
        return Promise.resolve({
          posts: [
            { slug: 'post-2', date: '2023-01-02', categories: [101] }, // Duplicate
            { slug: 'post-3', date: '2023-01-03', categories: [101] },
          ],
          total: 4,
          totalPages: 2,
        });
      }
      return Promise.resolve({ posts: [], total: 4, totalPages: 2 });
    });

    mockGetCategories.mockResolvedValue([
      { id: 101, slug: 'cat-1', count: 5 },
      { id: 102, slug: 'cat-2', count: 0 }, // Should be filtered out
    ]);

    mockGetTags.mockResolvedValue([
      { id: 201, slug: 'tag-1', count: 10 },
      { id: 202, slug: 'tag-2', count: 0 }, // Should be filtered out
    ]);

    mockGetDb.mockResolvedValue({
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([{ slug: 'app-1', updatedAt: new Date('2023-01-03') }]),
        }),
      }),
    });
  });

  it('should generate sitemap with static pages, posts, categories, tags, and apps', async () => {
    const result = await sitemap();

    // Check static pages
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: SITE_URL }),
        expect.objectContaining({ url: `${SITE_URL}/posts` }),
      ]),
    );

    // Check posts
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: `${SITE_URL}/posts/cat-1/post-1`,
          alternates: {
            languages: {
              zh: `${SITE_URL}/posts/cat-1/post-1`,
              en: `${SITE_URL}/en/posts/cat-1/post-1`,
            },
          },
        }),
        expect.objectContaining({ url: `${SITE_URL}/posts/cat-1/post-2` }),
        expect.objectContaining({ url: `${SITE_URL}/posts/cat-1/post-3` }),
      ]),
    );
    // Should NOT contain post-4 (removed from mock)
    const post4 = result.find((item) => item.url.includes('/posts/cat-1/post-4'));
    expect(post4).toBeUndefined();
    // Validate count: static(4) + posts(3) + category(1) + tag(1) + app(1) = 10
    expect(result.length).toBe(10);

    // Check categories
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: `${SITE_URL}/category/cat-1`,
          alternates: {
            languages: {
              zh: `${SITE_URL}/category/cat-1`,
              en: `${SITE_URL}/en/category/cat-1`,
            },
          },
        }),
      ]),
    );
    // Empty category should assume filtered (checking logic implicitly by absence or length)
    // But arrayContaining doesn't check absence. Let's check length approx or specific absence.
    const cat2 = result.find((item) => item.url === `${SITE_URL}/category/cat-2`);
    expect(cat2).toBeUndefined();

    // Check tags
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: `${SITE_URL}/tag/tag-1`,
          alternates: {
            languages: {
              zh: `${SITE_URL}/tag/tag-1`,
              en: `${SITE_URL}/en/tag/tag-1`,
            },
          },
        }),
      ]),
    );
    const tag2 = result.find((item) => item.url === `${SITE_URL}/tag/tag-2`);
    expect(tag2).toBeUndefined();

    // Check apps
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ url: `${SITE_URL}/app/app-1` })]));
  });

  it('should handle WordPress API errors gracefully (getPosts failure)', async () => {
    mockGetPosts.mockRejectedValue(new Error('WP Down'));

    const result = await sitemap();

    // Key assertion: Should not throw, should return static pages + apps + categories + tags
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ url: SITE_URL })]));
    // Should NOT have posts
    const anyPost = result.find((item) => item.url.includes('/posts/post-1'));
    expect(anyPost).toBeUndefined();
    // Should have categories (since that didn't fail)
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ url: `${SITE_URL}/category/cat-1` })]));
  });

  it('should handle WordPress API errors gracefully (getCategories failure)', async () => {
    mockGetCategories.mockRejectedValue(new Error('WP Down'));

    const result = await sitemap();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: SITE_URL }),
        expect.objectContaining({ url: `${SITE_URL}/posts/uncategorized/post-1` }),
      ]),
    );
    // Should NOT have categories
    const anyCat = result.find((item) => item.url.includes('/category/'));
    expect(anyCat).toBeUndefined();
  });

  it('should handle WordPress API errors gracefully (getTags failure)', async () => {
    mockGetTags.mockRejectedValue(new Error('WP Down'));

    const result = await sitemap();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: SITE_URL }),
        expect.objectContaining({ url: `${SITE_URL}/posts/cat-1/post-1` }),
        expect.objectContaining({ url: `${SITE_URL}/category/cat-1` }),
      ]),
    );
    // Should NOT have tags
    const anyTag = result.find((item) => item.url.includes('/tag/'));
    expect(anyTag).toBeUndefined();
  });

  it('should handle DB errors gracefully', async () => {
    mockGetDb.mockRejectedValue(new Error('DB Error'));

    const result = await sitemap();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: SITE_URL }),
        expect.objectContaining({ url: `${SITE_URL}/posts/cat-1/post-1` }),
      ]),
    );
    // Should NOT have apps
    const anyApp = result.find((item) => item.url.includes('/app/'));
    expect(anyApp).toBeUndefined();
  });

  it('should handle TOTAL failure gracefully', async () => {
    mockGetPosts.mockRejectedValue(new Error('Fail'));
    mockGetCategories.mockRejectedValue(new Error('Fail'));
    mockGetTags.mockRejectedValue(new Error('Fail'));
    mockGetDb.mockRejectedValue(new Error('Fail'));

    const result = await sitemap();

    // Should distinctively return just static pages
    expect(result.length).toBe(4); // 4 static pages defined in sitemap.ts
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ url: SITE_URL })]));
  });
});
