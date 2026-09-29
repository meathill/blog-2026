import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRevalidatePath = vi.fn();
const mockRevalidateTag = vi.fn();
const mockPurge = vi.fn();
const mockSync = vi.fn();
const mockWaitUntil = vi.fn();
const mockEdgePurge = vi.fn();

vi.mock('@/lib/auth', () => ({
  getAuth: () => ({ api: { getSession: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }) } }),
}));
vi.mock('next/headers', () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn().mockImplementation(async () => ({ env: {}, ctx: { waitUntil: mockWaitUntil } })),
}));
vi.mock('@/lib/blog-ai', () => ({ generateBlogMetadataSuggestion: vi.fn() }));
vi.mock('@/lib/blog-content', () => ({
  buildBlogContentSnapshot: () => ({ blocksJson: '[]', markdown: '', html: '<p>hi</p>' }),
}));
vi.mock('@/lib/blog-storage', () => ({
  createBlogPostRecord: vi.fn(),
  deleteBlogPostRecord: vi.fn(),
  getBlogPostRecord: vi.fn().mockResolvedValue({ id: 'post-1', slug: 'hello', publishedAt: null }),
  listBlogPostRecords: vi.fn(),
  markBlogPostPublished: vi.fn(),
  updateBlogPostRecord: vi.fn(),
}));
vi.mock('@/lib/blog-sync', () => ({ syncBlogPostToWordPress: (...args: unknown[]) => mockSync(...args) }));
vi.mock('@/lib/cloudflare-purge', () => ({ purgeCloudflareCache: (...args: unknown[]) => mockPurge(...args) }));
vi.mock('@/lib/workers-cache', () => ({
  EDGE_PURGE_DELAY_MS: 3000,
  purgeEdgeHtmlCache: (...args: unknown[]) => mockEdgePurge(...args),
}));
vi.mock('@/lib/og/post-image', () => ({ regeneratePostOg: vi.fn().mockResolvedValue(undefined) }));

import { publishBlogPost } from '@/actions/blog';
import { WP_CACHE_TAG } from '@/lib/cache-config';

describe('publishBlogPost 缓存失效（Issue #14）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSync.mockResolvedValue({ wpPostId: 42 });
    mockPurge.mockResolvedValue({ success: true });
  });

  it('发布（含改文）后立即失效 WP 数据 tag，公开页不等 86400s TTL', async () => {
    const formData = new FormData();
    formData.set('id', 'post-1');
    formData.set('title', 'Hello');
    formData.set('slug', 'hello');

    await publishBlogPost(formData);

    expect(mockRevalidateTag).toHaveBeenCalledWith(WP_CACHE_TAG, { expire: 0 });
    // 先清边缘 wp-json 缓存，再失效 ISR，否则重渲染可能拿到旧的 wp-json
    expect(mockPurge.mock.invocationCallOrder[0]).toBeLessThan(mockRevalidateTag.mock.invocationCallOrder[0]);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
  });

  it('发布后在 waitUntil 里延迟按 tag 清除 Workers Cache 整页缓存', async () => {
    mockEdgePurge.mockResolvedValue(true);
    const formData = new FormData();
    formData.set('title', 'Hello');

    await publishBlogPost(formData);

    expect(mockEdgePurge).toHaveBeenCalledWith(expect.objectContaining({ waitUntil: mockWaitUntil }), 3000);
    expect(mockEdgePurge.mock.invocationCallOrder[0]).toBeGreaterThan(mockRevalidateTag.mock.invocationCallOrder[0]);
    expect(mockWaitUntil).toHaveBeenCalled();
  });
});
