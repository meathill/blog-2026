import { describe, it, expect, vi, beforeEach } from 'vitest';
import sitemap from '@/app/sitemap';

// Mock dependencies
const mockGetCloudflareContext = vi.fn();
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => mockGetCloudflareContext(),
}));

const mockGetPosts = vi.fn();
const mockGetCategories = vi.fn();
vi.mock('@/lib/wordpress', () => ({
  getPosts: () => mockGetPosts(),
  getCategories: () => mockGetCategories(),
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
    mockGetPosts.mockResolvedValue({
      posts: [
        { slug: 'post-1', date: '2023-01-01' },
        { slug: 'post-2', date: '2023-01-02' },
      ],
    });

    mockGetCategories.mockResolvedValue([
      { slug: 'cat-1', count: 5 },
      { slug: 'cat-2', count: 0 }, // Should be filtered out
    ]);

    mockGetDb.mockResolvedValue({
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([{ slug: 'app-1', updatedAt: new Date('2023-01-03') }]),
        }),
      }),
    });
  });

  it('should generate sitemap with static pages, posts, categories, and apps', async () => {
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
        expect.objectContaining({ url: `${SITE_URL}/posts/post-1` }),
        expect.objectContaining({ url: `${SITE_URL}/posts/post-2` }),
      ]),
    );

    // Check categories
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ url: `${SITE_URL}/category/cat-1` })]));
    // Empty category should assume filtered (checking logic implicitly by absence or length)
    // But arrayContaining doesn't check absence. Let's check length approx or specific absence.
    const cat2 = result.find((item) => item.url === `${SITE_URL}/category/cat-2`);
    expect(cat2).toBeUndefined();

    // Check apps
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ url: `${SITE_URL}/app/app-1` })]));
  });

  it('should handle WordPress API errors gracefully (getPosts failure)', async () => {
    mockGetPosts.mockRejectedValue(new Error('WP Down'));

    const result = await sitemap();

    // Key assertion: Should not throw, should return static pages + apps + categories
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
        expect.objectContaining({ url: `${SITE_URL}/posts/post-1` }),
      ]),
    );
    // Should NOT have categories
    const anyCat = result.find((item) => item.url.includes('/category/'));
    expect(anyCat).toBeUndefined();
  });

  it('should handle DB errors gracefully', async () => {
    mockGetDb.mockRejectedValue(new Error('DB Error'));

    const result = await sitemap();

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: SITE_URL }),
        expect.objectContaining({ url: `${SITE_URL}/posts/post-1` }),
      ]),
    );
    // Should NOT have apps
    const anyApp = result.find((item) => item.url.includes('/app/'));
    expect(anyApp).toBeUndefined();
  });

  it('should handle TOTAL failure gracefully', async () => {
    mockGetPosts.mockRejectedValue(new Error('Fail'));
    mockGetCategories.mockRejectedValue(new Error('Fail'));
    mockGetDb.mockRejectedValue(new Error('Fail'));

    const result = await sitemap();

    // Should distinctively return just static pages
    expect(result.length).toBe(4); // 4 static pages defined in sitemap.ts
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ url: SITE_URL })]));
  });
});
