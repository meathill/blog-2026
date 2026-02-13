import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchReadyPosts } from '../../src/lib/notion';

// Mock Cloudflare Env
const env = {
  NOTION_API_KEY: 'mock-key',
  NOTION_DATABASE_ID: 'mock-db-id',
} as any;

// Mock NotionToMarkdown Class
vi.mock('notion-to-md', () => {
  return {
    NotionToMarkdown: class {
      constructor() {}
      pageToMarkdown() {
        return Promise.resolve([]);
      }
      toMarkdownString() {
        return { parent: 'Mock Content' };
      }
    },
  };
});

// Mock marked
vi.mock('marked', () => ({
  marked: vi.fn().mockResolvedValue('Mock HTML'),
}));

describe('fetchReadyPosts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('should include published and draft posts without status filtering', async () => {
    // Mock Notion Response
    const mockResponse = {
      results: [
        {
          id: 'page-1',
          last_edited_time: '2026-01-25T12:00:00Z',
          properties: {
            Name: { title: [{ plain_text: 'Test Post 1' }] },
            Slug: { rich_text: [{ plain_text: 'test-post-1' }] },
            Status: { status: { name: 'Published' } },
            published_at: { date: { start: '2026-01-20T12:00:00Z' } },
          },
        },
        {
          id: 'page-2',
          last_edited_time: '2026-01-20T12:00:00Z',
          properties: {
            Name: { title: [{ plain_text: 'Test Post 2' }] },
            Slug: { rich_text: [{ plain_text: 'test-post-2' }] },
            Status: { status: { name: 'Published' } },
            published_at: { date: { start: '2026-01-25T12:00:00Z' } },
          },
        },
        {
          id: 'page-3',
          last_edited_time: '2026-01-26T12:00:00Z',
          properties: {
            Name: { title: [{ plain_text: 'Test Post 3' }] },
            Slug: { rich_text: [{ plain_text: 'test-post-3' }] },
            Status: { status: { name: 'Ready' } },
          },
        },
        {
          id: 'page-4',
          last_edited_time: '2026-01-27T12:00:00Z',
          properties: {
            Name: { title: [{ plain_text: 'Test Post 4' }] },
            Slug: { rich_text: [{ plain_text: 'test-post-4' }] },
            Status: { status: { name: 'Draft' } },
          },
        },
      ],
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const posts = await fetchReadyPosts(env);

    expect(posts).toHaveLength(4);
    expect(posts.map((p) => p.title)).toEqual(['Test Post 1', 'Test Post 2', 'Test Post 3', 'Test Post 4']);
  });
});
