import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/sync-notion/route';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockFetchReadyPosts = vi.fn();
const mockUpdateNotionPostStatus = vi.fn();
const mockGetPost = vi.fn();
const mockCreatePost = vi.fn();
const mockUpdatePost = vi.fn();
const mockProcessContentImages = vi.fn();
const mockGetOrCreateCategory = vi.fn();
const mockGetOrCreateTag = vi.fn();
const mockUpsertNotionPostsToBackup = vi.fn();
const mockGetBackupPostsPendingSync = vi.fn();
const mockMarkBackupPostPublished = vi.fn();

vi.mock('@/lib/notion', () => ({
  fetchReadyPosts: (...args: unknown[]) => mockFetchReadyPosts(...args),
  updateNotionPostStatus: (...args: unknown[]) => mockUpdateNotionPostStatus(...args),
}));

vi.mock('@/lib/notion-post-backup', () => ({
  upsertNotionPostsToBackup: (...args: unknown[]) => mockUpsertNotionPostsToBackup(...args),
  getBackupPostsPendingSync: (...args: unknown[]) => mockGetBackupPostsPendingSync(...args),
  markBackupPostPublished: (...args: unknown[]) => mockMarkBackupPostPublished(...args),
}));

vi.mock('@/lib/wordpress', () => ({
  getPost: (...args: unknown[]) => mockGetPost(...args),
  createPost: (...args: unknown[]) => mockCreatePost(...args),
  updatePost: (...args: unknown[]) => mockUpdatePost(...args),
  getOrCreateCategory: (...args: unknown[]) => mockGetOrCreateCategory(...args),
  getOrCreateTag: (...args: unknown[]) => mockGetOrCreateTag(...args),
  verifyAuth: vi.fn().mockResolvedValue({ success: true, user: { name: 'Test', roles: ['admin'] } }),
}));

vi.mock('@/lib/content-processor', () => ({
  processContentImages: (...args: unknown[]) => mockProcessContentImages(...args),
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: async () => ({
    env: { CRON_SECRET: 'secret123' },
  }),
}));

describe('Sync Notion Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODEJS_ENV = 'production'; // Simulate prod by default to test auth

    mockFetchReadyPosts.mockResolvedValue([]);
    mockUpsertNotionPostsToBackup.mockResolvedValue(0);
    mockGetBackupPostsPendingSync.mockResolvedValue([]);
    mockProcessContentImages.mockImplementation((env: unknown, html: string) => Promise.resolve(`${html}_processed`));
  });

  it('should return 401 if key is missing or invalid', async () => {
    const req = new NextRequest('http://localhost/api/sync-notion?key=wrong');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should bypass auth in development', async () => {
    process.env.NODEJS_ENV = 'development';
    const req = new NextRequest('http://localhost/api/sync-notion');

    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('should backup Notion posts to D1 first, then sync pending backup posts to WordPress', async () => {
    const req = new NextRequest('http://localhost/api/sync-notion?key=secret123');

    const notionPosts = [
      {
        id: 'p1',
        title: 'P1',
        slug: 'p1',
        content: 'content',
        categories: ['Cat1'],
        tags: ['Tag1'],
        lastEditedTime: '2025-02-01T00:00:00.000Z',
      },
    ];
    mockFetchReadyPosts.mockResolvedValue(notionPosts);

    const backupPendingPosts = [
      {
        id: 'p1',
        title: 'P1',
        slug: 'p1',
        content: 'content',
        categories: ['Cat1'],
        tags: ['Tag1'],
        date: '2025-02-01',
      },
      {
        id: 'p2',
        title: 'P2',
        slug: 'p2',
        content: 'content2',
        categories: [],
        tags: [],
        date: '2025-02-02',
      },
    ];
    mockGetBackupPostsPendingSync.mockResolvedValue(backupPendingPosts);

    mockGetOrCreateCategory.mockResolvedValue({ id: 10, name: 'Cat1' });
    mockGetOrCreateTag.mockResolvedValue({ id: 20, name: 'Tag1' });

    mockGetPost.mockResolvedValueOnce({ id: 101 });
    mockGetPost.mockResolvedValueOnce(null);
    mockCreatePost.mockResolvedValue({ id: 102 });

    const res = await GET(req);
    const json = (await res.json()) as { success: boolean };

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    expect(mockFetchReadyPosts).toHaveBeenCalled();
    expect(mockUpsertNotionPostsToBackup).toHaveBeenCalledWith(notionPosts);
    expect(mockGetBackupPostsPendingSync).toHaveBeenCalledTimes(1);

    expect(mockProcessContentImages).toHaveBeenCalledTimes(2);
    expect(mockGetOrCreateCategory).toHaveBeenCalledWith(expect.anything(), 'Cat1');
    expect(mockGetOrCreateTag).toHaveBeenCalledWith(expect.anything(), 'Tag1');

    expect(mockUpdatePost).toHaveBeenCalledWith(
      expect.anything(),
      101,
      expect.objectContaining({
        title: 'P1',
        content: 'content_processed',
        categories: [10],
        tags: [20],
      }),
    );

    expect(mockCreatePost).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'P2',
        content: 'content2_processed',
        categories: [],
        tags: [],
      }),
    );

    expect(mockMarkBackupPostPublished).toHaveBeenCalledTimes(2);
    expect(mockMarkBackupPostPublished).toHaveBeenCalledWith('p1');
    expect(mockMarkBackupPostPublished).toHaveBeenCalledWith('p2');
    expect(mockUpdateNotionPostStatus).toHaveBeenCalledTimes(2);
  });

  it('should handle errors gracefully', async () => {
    const req = new NextRequest('http://localhost/api/sync-notion?key=secret123');
    mockFetchReadyPosts.mockRejectedValue(new Error('Notion Down'));

    const res = await GET(req);
    const json = (await res.json()) as { success: boolean; error: string };

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Notion Down');
  });

  it('should treat create failure as idempotent success when post appears by slug after failure', async () => {
    const req = new NextRequest('http://localhost/api/sync-notion?key=secret123');
    const notionPosts = [
      { id: 'p9', title: 'Retry Post', slug: 'retry-post', lastEditedTime: '2025-01-01T00:00:00.000Z' },
    ];
    const backupPendingPosts = [
      { id: 'p9', title: 'Retry Post', slug: 'retry-post', content: 'c', categories: [], tags: [] },
    ];

    mockFetchReadyPosts.mockResolvedValue(notionPosts);
    mockGetBackupPostsPendingSync.mockResolvedValue(backupPendingPosts);
    mockGetPost.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 999, slug: 'retry-post' });
    mockCreatePost.mockRejectedValueOnce(new Error('ECONNRESET'));

    const res = await GET(req);
    const json = (await res.json()) as { success: boolean };

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockCreatePost).toHaveBeenCalledTimes(1);
    expect(mockMarkBackupPostPublished).toHaveBeenCalledWith('p9');
    expect(mockUpdateNotionPostStatus).toHaveBeenCalledWith(expect.anything(), 'p9', 'Published');
  });

  it('should skip posts without slugs', async () => {
    const req = new NextRequest('http://localhost/api/sync-notion?key=secret123');
    const notionPosts = [{ id: 'p1', title: 'No Slug', slug: '', lastEditedTime: '2025-01-01T00:00:00.000Z' }];
    const backupPendingPosts = [{ id: 'p1', title: 'No Slug', slug: '' }];

    mockFetchReadyPosts.mockResolvedValue(notionPosts);
    mockGetBackupPostsPendingSync.mockResolvedValue(backupPendingPosts);

    const res = await GET(req);
    const json = (await res.json()) as { success: boolean };

    expect(json.success).toBe(true);
    expect(mockProcessContentImages).not.toHaveBeenCalled();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });
});
