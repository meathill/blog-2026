import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apps } from '@/db/schema';

const mockGetDb = vi.fn();
const mockGetSession = vi.fn();
const mockHeaders = vi.fn();
const mockRevalidatePath = vi.fn();
const mockRevalidateTag = vi.fn();
const mockRedirect = vi.fn();
const mockBuildAppSlug = vi.fn();
const mockUpdateAppTags = vi.fn();

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
}));

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

vi.mock('@/lib/app-slug', () => ({
  buildAppSlug: (...args: unknown[]) => mockBuildAppSlug(...args),
}));

vi.mock('@/actions/tags', () => ({
  updateAppTags: (...args: unknown[]) => mockUpdateAppTags(...args),
}));

import { createApp, deleteApp, updateApp } from '@/actions/apps';

function buildFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) => {
    formData.set(key, value);
  });
  return formData;
}

describe('apps actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockBuildAppSlug.mockReturnValue('generated-slug');
  });

  it('createApp: 未登录时应抛出 Unauthorized', async () => {
    mockGetSession.mockResolvedValue(null);
    const formData = buildFormData({ name: 'Test App' });

    await expect(createApp(formData)).rejects.toThrow('Unauthorized');
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('createApp: 应写入数据库、生成 slug、同步 tag 并触发刷新/跳转', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('app-uuid');

    const insertValues = vi.fn().mockResolvedValue(undefined);
    const db = {
      insert: vi.fn().mockReturnValue({
        values: insertValues,
      }),
    };
    mockGetDb.mockResolvedValue(db);

    const formData = buildFormData({
      name: 'My App',
      description: 'desc',
      content: 'content',
      url: 'https://example.com',
      repoUrl: 'https://github.com/example/app',
      icon: 'icon',
      status: '',
      slug: '',
      tagIds: 'tag-a,,tag-b',
    });

    await createApp(formData);

    expect(db.insert).toHaveBeenCalledWith(apps);
    expect(mockBuildAppSlug).toHaveBeenCalledWith('My App');
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'app-uuid',
        name: 'My App',
        slug: 'generated-slug',
        status: 'draft',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
    expect(mockUpdateAppTags).toHaveBeenCalledWith('app-uuid', ['tag-a', 'tag-b']);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:zh', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:en', 'max');
    expect(mockRedirect).toHaveBeenCalledWith('/admin');
  });

  it('updateApp: 应更新数据库并刷新关联页面', async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    const db = {
      update: vi.fn().mockReturnValue({ set }),
    };
    mockGetDb.mockResolvedValue(db);

    const formData = buildFormData({
      name: 'Updated App',
      description: 'new desc',
      content: 'new content',
      url: 'https://example.com/new',
      repoUrl: 'https://github.com/example/new',
      icon: 'new-icon',
      status: 'published',
      slug: 'updated-app',
      tagIds: 'tag-a,tag-a,tag-b',
    });

    await updateApp('app-1', formData);

    expect(db.update).toHaveBeenCalledWith(apps);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated App',
        slug: 'updated-app',
        status: 'published',
        updatedAt: expect.any(Date),
      }),
    );
    expect(where).toHaveBeenCalledTimes(1);
    expect(mockUpdateAppTags).toHaveBeenCalledWith('app-1', ['tag-a', 'tag-a', 'tag-b']);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/app/updated-app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en/app/updated-app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:zh', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:en', 'max');
    expect(mockRedirect).toHaveBeenCalledWith('/admin');
  });

  it('deleteApp: 应删除记录并刷新列表页', async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const db = {
      delete: vi.fn().mockReturnValue({ where }),
    };
    mockGetDb.mockResolvedValue(db);

    await deleteApp('app-1');

    expect(db.delete).toHaveBeenCalledWith(apps);
    expect(where).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:zh', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:en', 'max');
  });
});
