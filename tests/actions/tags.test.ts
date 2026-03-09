import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appTags, tags } from '@/db/schema';

const mockGetDb = vi.fn();
const mockGetSession = vi.fn();
const mockHeaders = vi.fn();
const mockRevalidatePath = vi.fn();
const mockRevalidateTag = vi.fn();

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

import { createTag, deleteTag, getTags, updateAppTags } from '@/actions/tags';

function buildFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) => {
    formData.set(key, value);
  });
  return formData;
}

describe('tags actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('getTags: 应按 name 排序查询', async () => {
    const expected = [{ id: 't-1', name: 'React', slug: 'react' }];
    const orderBy = vi.fn().mockResolvedValue(expected);
    const from = vi.fn().mockReturnValue({ orderBy });
    const db = {
      select: vi.fn().mockReturnValue({ from }),
    };
    mockGetDb.mockResolvedValue(db);

    const result = await getTags();

    expect(result).toEqual(expected);
    expect(db.select).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith(tags);
    expect(orderBy).toHaveBeenCalledTimes(1);
  });

  it('createTag: 未登录时应抛出 Unauthorized', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(createTag(buildFormData({ name: 'React' }))).rejects.toThrow('Unauthorized');
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('createTag: 缺少 name 时应抛错', async () => {
    await expect(createTag(buildFormData({ name: '   ' }))).rejects.toThrow('Tag name is required');
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('createTag: 应标准化 slug、写入数据库并返回结果', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('tag-uuid');

    const insertValues = vi.fn().mockResolvedValue(undefined);
    const db = {
      insert: vi.fn().mockReturnValue({
        values: insertValues,
      }),
    };
    mockGetDb.mockResolvedValue(db);

    const result = await createTag(buildFormData({ name: '  Vue.js 教程  ' }));

    expect(db.insert).toHaveBeenCalledWith(tags);
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tag-uuid',
        name: 'Vue.js 教程',
        slug: 'vue-js-教程',
        createdAt: expect.any(Date),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
    expect(result).toEqual({
      id: 'tag-uuid',
      name: 'Vue.js 教程',
      slug: 'vue-js-教程',
    });
  });

  it('deleteTag: 应先删关联再删 tag', async () => {
    const whereAppTags = vi.fn().mockResolvedValue(undefined);
    const whereTags = vi.fn().mockResolvedValue(undefined);
    const db = {
      delete: vi.fn().mockReturnValueOnce({ where: whereAppTags }).mockReturnValueOnce({ where: whereTags }),
    };
    mockGetDb.mockResolvedValue(db);

    await deleteTag('tag-1');

    expect(db.delete).toHaveBeenNthCalledWith(1, appTags);
    expect(db.delete).toHaveBeenNthCalledWith(2, tags);
    expect(whereAppTags).toHaveBeenCalledTimes(1);
    expect(whereTags).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:zh', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:en', 'max');
  });

  it('updateAppTags: 未登录时应抛出 Unauthorized', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(updateAppTags('app-1', ['t1'])).rejects.toThrow('Unauthorized');
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('updateAppTags: 应替换全部关系并去重插入', async () => {
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockResolvedValue(undefined);
    const db = {
      delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      insert: vi.fn().mockReturnValue({ values: insertValues }),
    };
    mockGetDb.mockResolvedValue(db);

    await updateAppTags('app-1', ['tag-a', 'tag-a', 'tag-b']);

    expect(db.delete).toHaveBeenCalledWith(appTags);
    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledWith(appTags);
    expect(insertValues).toHaveBeenCalledWith([
      { appId: 'app-1', tagId: 'tag-a' },
      { appId: 'app-1', tagId: 'tag-b' },
    ]);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:zh', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:en', 'max');
  });

  it('updateAppTags: tagIds 为空时仅清空旧关系，不执行插入', async () => {
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const db = {
      delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      insert: vi.fn(),
    };
    mockGetDb.mockResolvedValue(db);

    await updateAppTags('app-1', []);

    expect(db.delete).toHaveBeenCalledWith(appTags);
    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(db.insert).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en/app');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:zh', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:featured-apps:en', 'max');
  });
});
