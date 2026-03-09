import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultNavigationItems } from '@/lib/navigation-config';

const mockGetDb = vi.fn();
const mockUnstableCache = vi.fn();

vi.mock('@/lib/db', () => ({
  getDb: (...args: unknown[]) => mockGetDb(...args),
}));

vi.mock('next/cache', () => ({
  unstable_cache: (...args: unknown[]) => mockUnstableCache(...args),
}));

import { getCachedHeaderNavigation, getNavigationTag, readNavigationConfig } from '@/lib/public-navigation';

describe('public-navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnstableCache.mockImplementation((fn: () => Promise<unknown>) => fn);
  });

  it('readNavigationConfig: 缺少配置时应回退默认导航', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      }),
    };
    mockGetDb.mockResolvedValue(db);

    const result = await readNavigationConfig('en');

    expect(result).toEqual({
      header: getDefaultNavigationItems('en', 'header'),
      footer: getDefaultNavigationItems('en', 'footer'),
    });
  });

  it('getCachedHeaderNavigation: 应注册 15 分钟缓存与 locale tag', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      }),
    };
    mockGetDb.mockResolvedValue(db);

    const items = await getCachedHeaderNavigation('en');

    expect(items).toEqual(getDefaultNavigationItems('en', 'header'));
    expect(mockUnstableCache).toHaveBeenCalledWith(expect.any(Function), ['navigation', 'en', 'header'], {
      revalidate: 900,
      tags: ['nav:en:header'],
    });
    expect(getNavigationTag('en', 'header')).toBe('nav:en:header');
  });
});
