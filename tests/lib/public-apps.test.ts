import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetDb = vi.fn();
const mockUnstableCache = vi.fn();

vi.mock('@/lib/db', () => ({
  getDb: (...args: unknown[]) => mockGetDb(...args),
}));

vi.mock('next/cache', () => ({
  unstable_cache: (...args: unknown[]) => mockUnstableCache(...args),
}));

import { getCachedFeaturedApps, getFeaturedAppsTag } from '@/lib/public-apps';

describe('public-apps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnstableCache.mockImplementation((fn: () => Promise<unknown>) => fn);
  });

  it('getCachedFeaturedApps: 应注册 locale 维度缓存并合并翻译与 tags', async () => {
    const appRows = [
      {
        apps: {
          id: 'app-1',
          slug: 'demo-app',
          name: 'Demo App',
          description: 'base description',
          content: 'base content',
          icon: 'https://blog.meathill.com/demo.png',
          url: 'https://example.com',
          repoUrl: 'https://github.com/example/demo-app',
          status: 'published' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: null,
        },
        app_translations: {
          id: 'translation-1',
          appId: 'app-1',
          locale: 'en',
          name: 'Localized Demo App',
          description: 'localized description',
          content: 'localized content',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];
    const tagRows = [
      {
        appId: 'app-1',
        id: 'tag-1',
        name: 'Productivity',
        slug: 'productivity',
      },
    ];

    const appLimit = vi.fn().mockResolvedValue(appRows);
    const appOrderBy = vi.fn().mockReturnValue({ limit: appLimit });
    const appWhere = vi.fn().mockReturnValue({ orderBy: appOrderBy });
    const appLeftJoin = vi.fn().mockReturnValue({ where: appWhere });
    const appFrom = vi.fn().mockReturnValue({ leftJoin: appLeftJoin });

    const tagOrderBy = vi.fn().mockResolvedValue(tagRows);
    const tagWhere = vi.fn().mockReturnValue({ orderBy: tagOrderBy });
    const tagInnerJoin = vi.fn().mockReturnValue({ where: tagWhere });
    const tagFrom = vi.fn().mockReturnValue({ innerJoin: tagInnerJoin });

    const db = {
      select: vi.fn().mockReturnValueOnce({ from: appFrom }).mockReturnValueOnce({ from: tagFrom }),
    };
    mockGetDb.mockResolvedValue(db);

    const result = await getCachedFeaturedApps('en');

    expect(result).toEqual([
      {
        app: expect.objectContaining({
          id: 'app-1',
          name: 'Localized Demo App',
          description: 'localized description',
          content: 'localized content',
        }),
        tags: [{ id: 'tag-1', name: 'Productivity', slug: 'productivity' }],
      },
    ]);
    expect(mockUnstableCache).toHaveBeenCalledWith(expect.any(Function), ['featured-apps', 'en'], {
      revalidate: 900,
      tags: ['home:featured-apps:en'],
    });
    expect(getFeaturedAppsTag('en')).toBe('home:featured-apps:en');
  });
});
