import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncBlogPostToWordPress } from '@/lib/blog-sync';
import type { BlogPostRecord } from '@/lib/blog-post';

const mockVerifyAuth = vi.fn();
const mockGetOrCreateCategory = vi.fn();
const mockGetOrCreateTag = vi.fn();
const mockCreatePost = vi.fn();
const mockGetPost = vi.fn();
const mockGetPostById = vi.fn();
const mockUpdatePost = vi.fn();

vi.mock('@/lib/wordpress', () => ({
  verifyAuth: (...args: unknown[]) => mockVerifyAuth(...args),
  getOrCreateCategory: (...args: unknown[]) => mockGetOrCreateCategory(...args),
  getOrCreateTag: (...args: unknown[]) => mockGetOrCreateTag(...args),
  createPost: (...args: unknown[]) => mockCreatePost(...args),
  getPost: (...args: unknown[]) => mockGetPost(...args),
  getPostById: (...args: unknown[]) => mockGetPostById(...args),
  updatePost: (...args: unknown[]) => mockUpdatePost(...args),
}));

vi.mock('@/lib/content-processor', () => ({
  downloadAndUploadImage: vi.fn().mockResolvedValue(null),
}));

const mockEnv = {} as CloudflareEnv;

function buildMockPost(overrides: Partial<BlogPostRecord> = {}): BlogPostRecord {
  return {
    id: 'test-id',
    title: 'Test Post',
    slug: 'test-post',
    excerpt: 'Test excerpt',
    status: 'published',
    coverImage: '',
    categories: ['tech'],
    tags: ['react', 'nextjs'],
    blocksJson: '[]',
    markdown: '# Test',
    html: '<h1>Test</h1>',
    wpPostId: null,
    wpSyncedAt: null,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('blog-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAuth.mockResolvedValue({ success: true });
    mockGetOrCreateCategory.mockImplementation((_env: unknown, name: string) =>
      Promise.resolve({ id: name.length, name, slug: name }),
    );
    mockGetOrCreateTag.mockImplementation((_env: unknown, name: string) =>
      Promise.resolve({ id: name.length, name, slug: name }),
    );
    mockCreatePost.mockResolvedValue({ id: 42 });
    mockGetPost.mockResolvedValue(null);
    mockGetPostById.mockResolvedValue(null);
  });

  describe('syncBlogPostToWordPress - 空标签过滤', () => {
    it('应该跳过空字符串标签，不调用 getOrCreateTag', async () => {
      const post = buildMockPost({ tags: ['react', '', 'nextjs'] });
      await syncBlogPostToWordPress(mockEnv, post);

      expect(mockGetOrCreateTag).toHaveBeenCalledTimes(2);
      expect(mockGetOrCreateTag).toHaveBeenCalledWith(mockEnv, 'react');
      expect(mockGetOrCreateTag).toHaveBeenCalledWith(mockEnv, 'nextjs');
    });

    it('应该跳过纯空格标签', async () => {
      const post = buildMockPost({ tags: ['react', '   ', '\t'] });
      await syncBlogPostToWordPress(mockEnv, post);

      expect(mockGetOrCreateTag).toHaveBeenCalledTimes(1);
      expect(mockGetOrCreateTag).toHaveBeenCalledWith(mockEnv, 'react');
    });

    it('标签全部为空时不应调用 getOrCreateTag', async () => {
      const post = buildMockPost({ tags: ['', ' ', '  '] });
      await syncBlogPostToWordPress(mockEnv, post);

      expect(mockGetOrCreateTag).not.toHaveBeenCalled();
    });

    it('应该正常同步有效标签并返回 ID', async () => {
      mockGetOrCreateTag
        .mockResolvedValueOnce({ id: 10, name: 'react', slug: 'react' })
        .mockResolvedValueOnce({ id: 20, name: 'nextjs', slug: 'nextjs' });

      const post = buildMockPost({ tags: ['react', 'nextjs'] });
      await syncBlogPostToWordPress(mockEnv, post);

      expect(mockCreatePost).toHaveBeenCalledWith(
        mockEnv,
        expect.objectContaining({ tags: [10, 20] }),
      );
    });
  });

  describe('syncBlogPostToWordPress - 空分类过滤', () => {
    it('应该跳过空字符串分类，不调用 getOrCreateCategory', async () => {
      const post = buildMockPost({ categories: ['tech', '', 'blog'] });
      await syncBlogPostToWordPress(mockEnv, post);

      expect(mockGetOrCreateCategory).toHaveBeenCalledTimes(2);
      expect(mockGetOrCreateCategory).toHaveBeenCalledWith(mockEnv, 'tech');
      expect(mockGetOrCreateCategory).toHaveBeenCalledWith(mockEnv, 'blog');
    });

    it('应该跳过纯空格分类', async () => {
      const post = buildMockPost({ categories: ['tech', '   '] });
      await syncBlogPostToWordPress(mockEnv, post);

      expect(mockGetOrCreateCategory).toHaveBeenCalledTimes(1);
      expect(mockGetOrCreateCategory).toHaveBeenCalledWith(mockEnv, 'tech');
    });
  });
});
