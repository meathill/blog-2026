import { describe, expect, it, vi } from 'vitest';
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_HOST,
  INDEXNOW_KEY,
  chunkUrls,
  normalizeIndexNowUrl,
  submitPostToIndexNow,
  submitToIndexNow,
} from '@/lib/seo/indexnow';

describe('seo/indexnow', () => {
  describe('normalizeIndexNowUrl', () => {
    it('保留绝对 http/https URL', () => {
      expect(normalizeIndexNowUrl('https://meathill.com/posts/test')).toBe('https://meathill.com/posts/test');
      expect(normalizeIndexNowUrl('http://example.com/foo')).toBe('http://example.com/foo');
    });

    it('将 / 开头的相对路径拼接为完整绝对 URL', () => {
      expect(normalizeIndexNowUrl('/posts/a', 'https://meathill.com')).toBe('https://meathill.com/posts/a');
    });

    it('非法路径抛出错误', () => {
      expect(() => normalizeIndexNowUrl('posts/without-slash')).toThrow('无法识别的 URL 或路径');
    });
  });

  describe('chunkUrls', () => {
    it('按指定大小分批', () => {
      const urls = ['/1', '/2', '/3', '/4', '/5'];
      const chunks = chunkUrls(urls, 2);
      expect(chunks).toEqual([['/1', '/2'], ['/3', '/4'], ['/5']]);
    });

    it('chunkSize 必须大于 0', () => {
      expect(() => chunkUrls(['/1'], 0)).toThrow('chunkSize 必须大于 0');
    });
  });

  describe('submitToIndexNow', () => {
    it('空列表直接返回成功', async () => {
      const result = await submitToIndexNow([]);
      expect(result.success).toBe(true);
      expect(result.submittedCount).toBe(0);
      expect(result.batchCount).toBe(0);
    });

    it('向 IndexNow 发送正确的 POST 请求并处理 200/202 成功响应', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const result = await submitToIndexNow(['/posts/1', 'https://meathill.com/posts/2'], {
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result.success).toBe(true);
      expect(result.submittedCount).toBe(2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe(INDEXNOW_ENDPOINT);
      const body = JSON.parse(call[1].body);
      expect(body.host).toBe(INDEXNOW_HOST);
      expect(body.key).toBe(INDEXNOW_KEY);
      expect(body.urlList).toEqual(['https://meathill.com/posts/1', 'https://meathill.com/posts/2']);
    });

    it('202 视为成功', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 202,
      } as Response);

      const result = await submitToIndexNow(['/posts/1'], {
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result.success).toBe(true);
      expect(result.statuses).toEqual([202]);
    });

    it('非 200/202 错误时返回失败与警告信息', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid Key',
      } as Response);

      const result = await submitToIndexNow(['/posts/1'], {
        fetchImpl: mockFetch as unknown as typeof fetch,
      });

      expect(result.success).toBe(false);
      expect(result.warning).toContain('400');
      expect(result.warning).toContain('Invalid Key');
    });
  });

  describe('submitPostToIndexNow', () => {
    it('为指定文章与分类生成对应 URL 并提交', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const result = await submitPostToIndexNow('my-post', ['tech'], 'https://meathill.com', {
        fetchImpl: mockFetch as unknown as typeof fetch,
      });
      expect(result.success).toBe(true);
      expect(result.submittedCount).toBe(3);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
