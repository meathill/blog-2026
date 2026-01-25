import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchReadyPosts, updateNotionPostStatus, getNotionClient } from '@/lib/notion';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

// Mock dependencies (Hoisted by Vitest)
vi.mock('@notionhq/client');
vi.mock('notion-to-md');
vi.mock('marked', () => ({
  marked: vi.fn((str) => Promise.resolve(`HTML: ${str}`)),
}));

describe('notion utils', () => {
  const mockEnv = {
    NOTION_API_KEY: 'secret_key',
    // Valid 32-char hex for formatting test
    NOTION_DATABASE_ID: '12345678123412341234123456789012',
  } as any;

  // Mock Functions
  let mockQuery: any;
  let mockUpdate: any;
  let mockPageToMarkdown: any;
  let mockToMarkdownString: any;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(); // Mock global fetch

    // Setup Notion Client Mock
    mockQuery = vi.fn();
    mockUpdate = vi.fn();
    (Client as any).mockImplementation(
      class {
        databases = { query: mockQuery };
        pages = { update: mockUpdate };
      },
    );

    // Setup NotionToMarkdown Mock
    mockPageToMarkdown = vi.fn();
    mockToMarkdownString = vi.fn();
    (NotionToMarkdown as any).mockImplementation(
      class {
        pageToMarkdown = mockPageToMarkdown;
        toMarkdownString = mockToMarkdownString;
      },
    );
  });

  describe('getNotionClient', () => {
    it('should create client with fetch adapter', () => {
      const { client } = getNotionClient(mockEnv);
      expect(client).toBeDefined();
    });
  });

  describe('fetchReadyPosts', () => {
    it('should throw if database ID is missing', async () => {
      await expect(fetchReadyPosts({} as any)).rejects.toThrow('NOTION_DATABASE_ID is missing');
    });

    it('should fetch and convert posts', async () => {
      // Mock Native Fetch Response for Query
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 'page-1',
              properties: {
                Name: { title: [{ plain_text: 'Test Title' }] },
                Slug: { rich_text: [{ plain_text: 'test-slug' }] },
                Status: { status: { name: 'Ready' } },
                Tags: { multi_select: [{ name: 'Tag1' }] },
                Categories: { type: 'multi_select', multi_select: [{ name: 'Cat1' }] },
                Date: { date: { start: '2023-01-01' } },
              },
            },
          ],
        }),
      });

      mockPageToMarkdown.mockResolvedValueOnce(['block1']);
      mockToMarkdownString.mockReturnValueOnce({ parent: 'Markdown Content' });

      const posts = await fetchReadyPosts(mockEnv);

      // Verify Fetch Call via Capture
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, init] = (global.fetch as any).mock.calls[0];

      // Expected formatted UUID: 8-4-4-4-12
      expect(url).toBe('https://api.notion.com/v1/databases/12345678-1234-1234-1234-123456789012/query');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({
        Authorization: 'Bearer secret_key',
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      });
      // Parse body to avoid stringify formatting issues
      expect(JSON.parse(init.body)).toEqual({
        filter: {
          property: 'Status',
          status: { equals: 'Ready' },
        },
      });

      expect(posts).toHaveLength(1);
      expect(posts[0]).toEqual({
        id: 'page-1',
        title: 'Test Title',
        slug: 'test-slug',
        status: 'Ready',
        tags: ['Tag1'],
        categories: ['Cat1'],
        date: '2023-01-01',
        content: 'HTML: Markdown Content',
      });
    });

    it('should ignore pages without properties', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 'noprops' }] }),
      });
      const posts = await fetchReadyPosts(mockEnv);
      expect(posts).toHaveLength(0);
    });

    it('should handle fetch errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });
      await expect(fetchReadyPosts(mockEnv)).rejects.toThrow('Notion API Error: 400 Bad Request');
    });
  });

  describe('updateNotionPostStatus', () => {
    it('should update page status', async () => {
      await updateNotionPostStatus(mockEnv, 'page-1', 'Published');
      expect(mockUpdate).toHaveBeenCalledWith({
        page_id: 'page-1',
        properties: {
          Status: {
            status: {
              name: 'Published',
            },
          },
        },
      });
    });
  });
});
