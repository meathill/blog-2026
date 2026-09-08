import { beforeEach, describe, expect, it, vi } from 'vitest';
import { navigationConfigs } from '@/db/schema';
import { formatNavigationConfigJson, getDefaultNavigationItems } from '@/lib/navigation-config';

const mockGetDb = vi.fn();
const mockGetSession = vi.fn();
const mockHeaders = vi.fn();
const mockRevalidatePath = vi.fn();
const mockRevalidateTag = vi.fn();
const mockRedirect = vi.fn();

vi.mock('@/lib/db', () => ({
  getDb: (...args: unknown[]) => mockGetDb(...args),
}));

vi.mock('@/lib/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  }),
}));

vi.mock('next/headers', () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

import {
  getFooterNavigation,
  getHeaderNavigation,
  getNavigationEditorData,
  resetNavigationConfig,
  saveNavigationConfig,
} from '@/actions/navigation';

function buildFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) => {
    formData.set(key, value);
  });
  return formData;
}

function mockSelectRow(row: unknown) {
  mockGetDb.mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(row),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  });
}

describe('navigation actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('getHeaderNavigation: 无自定义配置时返回默认 header', async () => {
    mockSelectRow(null);

    await expect(getHeaderNavigation('zh')).resolves.toEqual(getDefaultNavigationItems('zh', 'header'));
  });

  it('getFooterNavigation: 非法 locale 回退到 zh 默认 footer', async () => {
    mockSelectRow(null);

    await expect(getFooterNavigation('fr')).resolves.toEqual(getDefaultNavigationItems('zh', 'footer'));
  });

  it('getNavigationEditorData: 未登录时应抛出 Unauthorized', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(getNavigationEditorData('zh', 'header')).rejects.toThrow('Unauthorized');
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('getNavigationEditorData: 无行时返回默认值且无自定义标记', async () => {
    mockSelectRow(null);

    const data = await getNavigationEditorData('zh', 'header');

    expect(data).toEqual({
      locale: 'zh',
      section: 'header',
      hasCustomConfig: false,
      itemsJson: expect.any(String),
    });
  });

  it('getNavigationEditorData: 自定义行解析成功并标记 hasCustomConfig', async () => {
    mockSelectRow({
      locale: 'zh',
      items: JSON.stringify([{ href: '/custom', label: '自定义' }]),
    });

    const data = await getNavigationEditorData('zh', 'header');

    expect(data.hasCustomConfig).toBe(true);
    expect(data.itemsJson).toContain('/custom');
  });

  it('getNavigationEditorData: 脏数据回退默认值但保留自定义标记', async () => {
    mockSelectRow({ locale: 'zh', items: 'not-json{{{' });

    const data = await getNavigationEditorData('zh', 'footer');

    expect(data.hasCustomConfig).toBe(true);
    expect(data.itemsJson).toContain('/posts');
  });

  it('saveNavigationConfig: 未登录时应抛出 Unauthorized', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(saveNavigationConfig(buildFormData({}))).rejects.toThrow('Unauthorized');
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('saveNavigationConfig: 合法输入写入合并配置并跳转 saved', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoUpdate }),
    });
    mockGetDb.mockResolvedValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(null),
          }),
        }),
      }),
      insert,
    });

    await saveNavigationConfig(
      buildFormData({
        locale: 'en',
        section: 'footer',
        itemsJson: JSON.stringify([{ href: '/about', label: 'About' }]),
      }),
    );

    expect(insert).toHaveBeenCalledWith(navigationConfigs);
    expect(onConflictDoUpdate).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith('nav:en:footer', 'max');
    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('saved=1'));
  });

  it('saveNavigationConfig: 非法 JSON 跳转 error 而不写库', async () => {
    const db = { select: vi.fn() };
    mockGetDb.mockResolvedValue(db);

    await saveNavigationConfig(buildFormData({ locale: 'zh', section: 'header', itemsJson: 'broken{{{' }));

    expect(db.select).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('error='));
  });

  it('resetNavigationConfig: 重置为默认值并跳转 reset', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    mockSelectRow(null);
    const db = await mockGetDb();
    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoUpdate }),
    });

    await resetNavigationConfig(buildFormData({ locale: 'zh', section: 'header' }));

    expect(onConflictDoUpdate).toHaveBeenCalledWith(expect.objectContaining({ target: navigationConfigs.locale }));
    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('reset=1'));
  });

  it('resetNavigationConfig: 未登录时应抛出 Unauthorized', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(resetNavigationConfig(buildFormData({}))).rejects.toThrow('Unauthorized');
  });

  it('footer 归一化: 外部链接仅保留 href/label/external', async () => {
    mockSelectRow({
      locale: 'zh',
      items: formatNavigationConfigJson({
        header: getDefaultNavigationItems('zh', 'header'),
        footer: [{ href: 'https://example.com', label: '外链', external: true } as never],
      }),
    });

    const data = await getNavigationEditorData('zh', 'footer');

    expect(JSON.parse(data.itemsJson)).toEqual([{ href: 'https://example.com', label: '外链', external: true }]);
  });
});
