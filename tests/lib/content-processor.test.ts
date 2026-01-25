import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processContentImages } from '@/lib/content-processor';
import * as wordpress from '@/lib/wordpress';

// Mock uploadMedia
vi.mock('@/lib/wordpress', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    uploadMedia: vi.fn(),
  };
});

describe('processContentImages', () => {
  const mockEnv = {
    WORDPRESS_API_URL: 'https://api.example.com',
    WP_USERNAME: 'user',
    WP_APP_PASSWORD: 'pass',
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('should ignore non-Notion images', async () => {
    const html = '<img src="https://example.com/image.jpg" />';
    const result = await processContentImages(mockEnv, html, 'slug');
    expect(result).toBe(html);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should process Notion images', async () => {
    const notionUrl = 'https://prod-files-secure.s3.us-west-2.amazonaws.com/image.jpg';
    const wpUrl = 'https://wp.example.com/wp-content/uploads/image.jpg';
    const html = `<p>Test</p><img src="${notionUrl}" alt="test" />`;

    // Mock download
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });

    // Mock upload
    vi.mocked(wordpress.uploadMedia).mockResolvedValueOnce({
      source_url: wpUrl,
    });

    const result = await processContentImages(mockEnv, html, 'test-slug');

    // Check fetch download
    expect(global.fetch).toHaveBeenCalledWith(notionUrl);

    // Check upload
    expect(wordpress.uploadMedia).toHaveBeenCalled();
    const [env, buffer, filename] = vi.mocked(wordpress.uploadMedia).mock.calls[0];
    expect(env).toBe(mockEnv);
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(filename).toContain('test-slug');
    expect(filename).toContain('.jpg');

    // Check replacement
    expect(result).toContain(wpUrl);
    expect(result).not.toContain(notionUrl);
  });

  it('should handle download failure', async () => {
    const notionUrl = 'https://prod-files-secure.s3.us-west-2.amazonaws.com/fail.jpg';
    const html = `<img src="${notionUrl}" />`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const result = await processContentImages(mockEnv, html, 'slug');
    expect(result).toBe(html); // No change
    expect(wordpress.uploadMedia).not.toHaveBeenCalled();
  });
});
