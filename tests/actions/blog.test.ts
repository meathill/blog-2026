import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blogPosts } from '@/db/schema';

const mockGetDb = vi.fn();
const mockGetSession = vi.fn();
const mockHeaders = vi.fn();
const mockRevalidatePath = vi.fn();

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
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(),
}));

vi.mock('@/lib/blog-ai', () => ({
  generateBlogMetadataSuggestion: vi.fn(),
}));

vi.mock('@/lib/blog-content', () => ({
  buildBlogContentSnapshot: vi.fn(),
}));

vi.mock('@/lib/blog-sync', () => ({
  syncBlogPostToWordPress: vi.fn(),
}));

vi.mock('@/lib/cloudflare-purge', () => ({
  purgeCloudflareCache: vi.fn(),
}));

import { deleteBlogPost } from '@/actions/blog';

describe('blog actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('deleteBlogPost: 未登录时应抛出 Unauthorized', async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(deleteBlogPost('post-1')).rejects.toThrow('Unauthorized');
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it('deleteBlogPost: 应删除本地文章并刷新后台列表', async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const db = {
      delete: vi.fn().mockReturnValue({ where }),
    };
    mockGetDb.mockResolvedValue(db);

    await deleteBlogPost('post-1');

    expect(db.delete).toHaveBeenCalledWith(blogPosts);
    expect(where).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/blog');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/blog/new');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/blog/post-1');
  });
});
