import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateTag, toTermSlug } from '../../src/lib/wordpress';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Mock Cloudflare Env
const env = {
  WP_USERNAME: 'test_user',
  WP_APP_PASSWORD: 'test_password',
  WORDPRESS_API_URL: 'https://mock-wp.com/wp-json/wp/v2',
} as any;

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(),
}));

// Mocking the module but we want to test getOrCreateTag so we rely on fetch mocking
vi.mock('../../src/lib/wordpress', async () => {
  const actual = await vi.importActual('../../src/lib/wordpress');
  return {
    ...actual,
    getTagBySlug: vi.fn(),
  };
});

describe('toTermSlug', () => {
  it('should handle ASCII names', () => {
    expect(toTermSlug('React')).toBe('react');
    expect(toTermSlug('Next JS')).toBe('next-js');
    expect(toTermSlug('vue-router')).toBe('vue-router');
  });

  it('should percent-encode Chinese characters', () => {
    expect(toTermSlug('代码维护')).toBe('%e4%bb%a3%e7%a0%81%e7%bb%b4%e6%8a%a4');
    expect(toTermSlug('重构')).toBe('%e9%87%8d%e6%9e%84');
  });

  it('should handle mixed ASCII and Chinese', () => {
    const slug = toTermSlug('vibe coding 实战');
    expect(slug).toBe('vibe-coding-%e5%ae%9e%e6%88%98');
  });

  it('should return empty string for empty input', () => {
    expect(toTermSlug('')).toBe('');
  });
});

describe('getOrCreateTag', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getCloudflareContext as any).mockResolvedValue({
      env: {
        WORDPRESS_API_URL: 'https://mock-wp.com/wp-json/wp/v2',
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
      text: async () => '',
    } as any);
  });

  it('should create tag if not exists', async () => {
    // 1. getTagBySlug (internal) -> fetch(GET /tags?slug=...) -> Empty list
    // 2. createTag (internal) -> fetch(POST /tags) -> Created Tag

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [], // getTagBySlug returns []
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'New Tag' }), // createTag returns tag
      });

    const tag = await getOrCreateTag(env, 'New Tag');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(tag).toEqual({ id: 1, name: 'New Tag' });
  });

  it('should handle term_exists error by fetching existing tag handling', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [], // getTagBySlug -> Not found
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => '{"code":"term_exists","data":{"term_id":123}}', // createTag -> Duplicate
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 123, name: 'Existing Tag' }], // getTags -> Found
      });

    const tag = await getOrCreateTag(env, 'Existing Tag');

    expect(tag).toEqual({ id: 123, name: 'Existing Tag' });
  });
});
