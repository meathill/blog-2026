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

vi.mock('@/lib/notion', () => ({
  fetchReadyPosts: (...args: any[]) => mockFetchReadyPosts(...args),
  updateNotionPostStatus: (...args: any[]) => mockUpdateNotionPostStatus(...args),
}));

vi.mock('@/lib/wordpress', () => ({
  getPost: (...args: any[]) => mockGetPost(...args),
  createPost: (...args: any[]) => mockCreatePost(...args),
  updatePost: (...args: any[]) => mockUpdatePost(...args),
}));

vi.mock('@/lib/content-processor', () => ({
  processContentImages: (...args: any[]) => mockProcessContentImages(...args),
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: async () => ({
    env: { CRON_SECRET: 'secret123' }
  }),
}));

describe('Sync Notion Route', () => {
  const env = { CRON_SECRET: 'secret123' };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODEJS_ENV = 'production'; // Simulate prod by default to test auth
  });

  it('should return 401 if key is missing or invalid', async () => {
    const req = new NextRequest('http://localhost/api/sync-notion?key=wrong');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should bypass auth in development', async () => {
    process.env.NODEJS_ENV = 'development';
    const req = new NextRequest('http://localhost/api/sync-notion');

    mockFetchReadyPosts.mockResolvedValue([]); // Setup minimal success

    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('should process ready posts', async () => {
    const req = new NextRequest('http://localhost/api/sync-notion?key=secret123');

    // Mock Data
    const posts = [
      { id: 'p1', title: 'P1', slug: 'p1', content: 'content' },
      { id: 'p2', title: 'P2', slug: 'p2', content: 'content' },
    ];
    mockFetchReadyPosts.mockResolvedValue(posts);
    mockProcessContentImages.mockImplementation((env, html) => Promise.resolve(html + '_processed'));

    // P1 exists -> Update
    mockGetPost.mockResolvedValueOnce({ id: 101 });
    // P2 new -> Create
    mockGetPost.mockResolvedValueOnce(null);

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);

    // Verify Process flow
    expect(mockFetchReadyPosts).toHaveBeenCalled();
    expect(mockProcessContentImages).toHaveBeenCalledTimes(2);

    // Verify P1 Update
    expect(mockUpdatePost).toHaveBeenCalledWith(expect.anything(), 101, expect.objectContaining({
      title: 'P1',
      content: 'content_processed'
    }));

    // Verify P2 Create
    expect(mockCreatePost).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      title: 'P2',
      content: 'content_processed'
    }));

    // Verify Notion Status Update
    expect(mockUpdateNotionPostStatus).toHaveBeenCalledTimes(2);
  });

  it('should handle errors gracefully', async () => {
    const req = new NextRequest('http://localhost/api/sync-notion?key=secret123');
    mockFetchReadyPosts.mockRejectedValue(new Error('Notion Down'));

    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Notion Down');
  });

  it('should skip posts without slugs', async () => {
    const req = new NextRequest('http://localhost/api/sync-notion?key=secret123');
    mockFetchReadyPosts.mockResolvedValue([{ id: 'p1', title: 'No Slug' }]); // No slug

    const res = await GET(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(mockProcessContentImages).not.toHaveBeenCalled();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });
});
