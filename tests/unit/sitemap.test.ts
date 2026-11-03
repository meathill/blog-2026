import { beforeEach, describe, expect, it, vi } from 'vitest';
import sitemap from '@/app/sitemap';

// Mock dependencies
const mockGetCloudflareContext = vi.fn();
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => mockGetCloudflareContext(),
}));

const mockGetPosts = vi.fn();
const mockGetCategories = vi.fn();
// 注意：标签页已从 sitemap 移除（issue #4 SEO 收口），不再 import getTags
vi.mock('@/lib/wordpress', () => ({
  getPosts: (...args: any[]) => mockGetPosts(...args),
  getCategories: (...args: any[]) => mockGetCategories(...args),
}));

const mockGetDb = vi.fn();
vi.mock('@/lib/db', () => ({
  getDb: () => mockGetDb(),
}));

vi.mock('@/db/schema', () => ({
  apps: { status: 'status', slug: 'slug', updatedAt: 'updatedAt' },
}));

vi.mock('@/lib/skills', () => ({
  getAllSkills: vi.fn().mockReturnValue([{ slug: 'react' }]),
}));

// unstable_cache 在 Next 运行时之外直接透传（缓存行为由 OpenNext 增量缓存负责）
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: any[]) => any) => fn,
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

describe('Sitemap Generator', () => {
  const SITE_URL = 'https://example.com';

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.NEXT_PUBLIC_SITE_URL = SITE_URL;

    mockGetCloudflareContext.mockResolvedValue({
      env: {
        NEXT_PUBLIC_SITE_URL: SITE_URL,
      },
    });

    mockGetPosts.mockImplementation((params) => {
      const page = params?.page || 1;
      if (page === 1) {
        return Promise.resolve({
          posts: [
            { slug: 'post-1', date: '2023-01-01', modified: '2023-02-01', categories: [101] },
            { slug: 'post-2', date: '2023-01-02', modified: '2023-01-02', categories: [101] },
          ],
          total: 4,
          totalPages: 2,
        });
      }
      if (page === 2) {
        return Promise.resolve({
          posts: [
            { slug: 'post-2', date: '2023-01-02', modified: '2023-01-02', categories: [101] }, // Duplicate
            { slug: 'post-3', date: '2023-01-03', modified: '2023-01-03', categories: [101] },
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

    mockGetDb.mockResolvedValue({
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([{ slug: 'app-1', updatedAt: new Date('2023-01-03') }]),
        }),
      }),
    });
  });

  it('should generate sitemap with static pages, posts, categories, and apps (no tag pages)', async () => {
    const result = await sitemap();

    // Check static pages
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: SITE_URL }),
        expect.objectContaining({ url: `${SITE_URL}/posts` }),
      ]),
    );

    // Check posts
    // Issue #19：无英文译文，文章条目不再声明 en alternate（/en/posts/* 已 301 归一）
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: `${SITE_URL}/posts/cat-1/post-1`,
          alternates: {
            languages: {
              zh: `${SITE_URL}/posts/cat-1/post-1`,
            },
          },
        }),
        expect.objectContaining({ url: `${SITE_URL}/posts/cat-1/post-2` }),
        expect.objectContaining({ url: `${SITE_URL}/posts/cat-1/post-3` }),
      ]),
    );

    // 博客内容（/en/posts、/en/category）条目不再输出（无 en 版，301 归一）
    const enPost = result.find((item) => item.url === `${SITE_URL}/en/posts/cat-1/post-1`);
    expect(enPost).toBeUndefined();
    const anyBlogEn = result.find(
      (item) => item.url.includes('/en/posts') || item.url.includes('/en/category'),
    );
    expect(anyBlogEn).toBeUndefined();
    // 其余 /en 页面（首页、friend 等）仍作为主条目出现
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: `${SITE_URL}/en` }),
      ]),
    );

    // post lastModified 使用 post.modified（新鲜度信号）
    const post1 = result.find((item) => item.url === `${SITE_URL}/posts/cat-1/post-1`);
    expect(post1?.lastModified).toEqual(new Date('2023-02-01'));

    // 静态 12 条中 /posts 无 en：11×2 + 1；文章 3 + 分类/应用/skill 各 2，其中分类无 en（博客内容）= 31
    expect(result.length).toBe(31);
    for (const path of ['/friend', '/en/friend']) {
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            url: `${SITE_URL}${path}`,
            alternates: {
              languages: {
                zh: `${SITE_URL}/friend`,
                en: `${SITE_URL}/en/friend`,
                'x-default': `${SITE_URL}/friend`,
              },
            },
          }),
        ]),
      );
    }

    // /tech 频道页应出现在 sitemap 中，带正确 zh/en alternates
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: `${SITE_URL}/tech`,
          alternates: {
            languages: {
              zh: `${SITE_URL}/tech`,
              en: `${SITE_URL}/en/tech`,
            },
          },
        }),
      ]),
    );

    // /tech/compare 子栏目应出现
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: `${SITE_URL}/tech/compare`,
          alternates: {
            languages: {
              zh: `${SITE_URL}/tech/compare`,
              en: `${SITE_URL}/en/tech/compare`,
            },
          },
        }),
      ]),
    );

    // /en/tech 应由 expandEnEntries 自动补出主条目
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ url: `${SITE_URL}/en/tech` })]));

    // Check categories（无 en 版，languages 只声明 zh）
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: `${SITE_URL}/category/cat-1`,
          alternates: {
            languages: {
              zh: `${SITE_URL}/category/cat-1`,
            },
          },
        }),
      ]),
    );
    const cat2 = result.find((item) => item.url === `${SITE_URL}/category/cat-2`);
    expect(cat2).toBeUndefined();

    // 标签页不应出现在 sitemap 中
    const anyTag = result.find((item) => item.url.includes('/tag/'));
    expect(anyTag).toBeUndefined();

    // Check apps
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ url: `${SITE_URL}/app/app-1` })]));
  });

  // Issue #13 构建超时回归：只有第一页需要准确总数，后续页不应再触发计数
  it('does not emit /tag/null, /category/null or /posts/*/null', async () => {
    mockGetCategories.mockResolvedValue([
      { id: 101, slug: 'cat-1', count: 5 },
      { id: 103, slug: null, count: 4 },
    ]);
    mockGetPosts.mockImplementation((params) => {
      const page = params?.page || 1;
      if (page === 1) {
        return Promise.resolve({
          posts: [
            { slug: 'post-1', date: '2023-01-01', modified: '2023-02-01', categories: [101] },
            { slug: null, date: '2023-01-02', modified: '2023-01-02', categories: [101] },
          ],
          total: 2,
          totalPages: 1,
        });
      }
      return Promise.resolve({ posts: [], total: 2, totalPages: 1 });
    });

    const result = await sitemap();
    expect(result.some((item) => item.url.includes('/null'))).toBe(false);
    expect(result.some((item) => item.url === `${SITE_URL}/posts/cat-1/post-1`)).toBe(true);
  });

  it('should request an accurate total only for the first posts page', async () => {
    await sitemap();

    const calls = mockGetPosts.mock.calls.map((c) => c[0]);
    expect(calls[0]).toEqual(expect.objectContaining({ perPage: 100, withTotal: true }));
    expect(calls.slice(1).every((params) => !params.withTotal)).toBe(true);
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
        expect.objectContaining({ url: `${SITE_URL}/posts/uncategorized/post-1` }),
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
    mockGetDb.mockRejectedValue(new Error('Fail'));

    const result = await sitemap();

    // Should distinctively return just static pages + mocked skills (which is 1 skill)
    // 静态 12 条（含友链）中 /posts 无 en，加 1 个 skill 的双语页面：11×2 + 1 + 1×2 = 25
    expect(result.length).toBe(25);
    expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ url: SITE_URL })]));
  });
});
