import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchReadyPosts } from '@/lib/notion';
import { Client } from '@notionhq/client';

// Mock dependencies
vi.mock('@notionhq/client', () => {
  return {
    Client: vi.fn(),
    isFullPage: vi.fn(),
  };
});
vi.mock('notion-to-md', () => {
  return {
    NotionToMarkdown: vi.fn().mockImplementation(function () {
      return {
        pageToMarkdown: vi.fn().mockResolvedValue([]),
        toMarkdownString: vi.fn().mockReturnValue({ parent: 'Mock Status Content' }),
      };
    }),
  };
});
vi.mock('marked', () => {
  return {
    marked: vi.fn().mockResolvedValue('<p>Mock Content</p>'),
  };
});

// Mock environment variables
const mockEnv = {
  NOTION_API_KEY: 'secret_123',
  NOTION_DATABASE_ID: 'db_123',
} as unknown as CloudflareEnv;

describe('fetchReadyPosts', () => {
  // let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // mockQuery = vi.fn();
    // Client mock for NotionToMarkdown
    (Client as unknown as any).mockImplementation(function () {
      return {
        // databases: { query: mockQuery }, // Not used by fetchReadyPosts
      };
    });

    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock notion page
  const createMockPage = (id: string, status: string, lastEdited: string, publishedAt?: string) => ({
    id,
    last_edited_time: lastEdited,
    properties: {
      'Doc name': { title: [{ plain_text: `Post ${id}` }] },
      Slug: { rich_text: [{ plain_text: `post-${id}` }] },
      Status: { status: { name: status } },
      published_at: publishedAt ? { date: { start: publishedAt } } : null,
    },
  });

  function mockFetchResponse(results: any[]) {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ results }),
    });
  }

  function getLastRequestBody(): Record<string, unknown> {
    const [, init] = (global.fetch as any).mock.calls.at(-1);
    return JSON.parse(init.body);
  }

  it('should sync "Ready" posts', async () => {
    mockFetchResponse([createMockPage('1', 'Ready', '2023-01-01T12:00:00Z')]);

    const posts = await fetchReadyPosts(mockEnv);
    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe('1');
    expect(posts[0].status).toBe('Ready');
  });

  it('should sync "Published" posts regardless of publish timestamp comparison', async () => {
    mockFetchResponse([createMockPage('1', 'Published', '2023-01-02T12:00:00Z', '2023-01-01T12:00:00Z')]);

    const posts = await fetchReadyPosts(mockEnv);
    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe('1');
  });

  it('should keep syncing "Published" posts even when edited time is same as published time', async () => {
    mockFetchResponse([createMockPage('1', 'Published', '2023-01-01T12:00:00Z', '2023-01-01T12:00:00Z')]);

    const posts = await fetchReadyPosts(mockEnv);
    expect(posts).toHaveLength(1);
  });

  it('should handle "published" (lowercase) status correctly', async () => {
    mockFetchResponse([createMockPage('1', 'published', '2023-01-01T12:00:00Z', '2023-01-01T12:00:00Z')]);

    const posts = await fetchReadyPosts(mockEnv);
    expect(posts).toHaveLength(1);
  });

  it('should sync "published" (lowercase) if modified later', async () => {
    mockFetchResponse([createMockPage('1', 'published', '2023-01-02T12:00:00Z', '2023-01-01T12:00:00Z')]);

    const posts = await fetchReadyPosts(mockEnv);
    expect(posts).toHaveLength(1);
  });

  it('should also sync draft posts into D1 backup', async () => {
    mockFetchResponse([createMockPage('1', 'Draft', '2023-01-02T12:00:00Z')]);

    const posts = await fetchReadyPosts(mockEnv);
    expect(posts).toHaveLength(1);
    expect(posts[0].status).toBe('Draft');
  });

  it('should query notion with sorts only and no status filter', async () => {
    mockFetchResponse([createMockPage('1', 'Ready', '2023-01-01T12:00:00Z')]);

    await fetchReadyPosts(mockEnv);
    expect(getLastRequestBody()).toEqual({
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    });
  });
});
