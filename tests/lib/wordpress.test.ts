import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripHtml, calculateReadingTime, formatDate } from '@/lib/wordpress';

describe('wordpress utils', () => {
  describe('stripHtml', () => {
    it('应该移除 HTML 标签', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      expect(stripHtml(html)).toBe('Hello World');
    });

    it('应该处理 HTML 实体', () => {
      const html = '&lt;div&gt; &amp; &quot;test&quot;';
      expect(stripHtml(html)).toBe('<div> & "test"');
    });

    it('应该处理空字符串', () => {
      expect(stripHtml('')).toBe('');
    });
  });

  describe('calculateReadingTime', () => {
    it('应该计算中文阅读时间', () => {
      const content = '这是一段测试文本'.repeat(100); // 800 字
      expect(calculateReadingTime(content)).toBe(2); // 800 / 400 = 2 分钟
    });

    it('最少返回 1 分钟', () => {
      const content = '短文';
      expect(calculateReadingTime(content)).toBe(1);
    });

    it('应该忽略 HTML 标签', () => {
      const content = '<p>测试</p>'.repeat(200);
      const time = calculateReadingTime(content);
      expect(time).toBeGreaterThan(0);
    });
  });

  describe('formatDate', () => {
    it('应该格式化日期为 YYYY-MM-DD', () => {
      expect(formatDate('2025-11-23T10:30:00')).toBe('2025-11-23');
    });

    it('应该处理带时区的日期', () => {
      expect(formatDate('2025-11-23T10:30:00+08:00')).toBe('2025-11-23');
    });
  });

  describe('API Functions', () => {
    const mockEnv = {
      WORDPRESS_API_URL: 'https://wp.example.com',
      WP_USERNAME: 'user',
      WP_APP_PASSWORD: 'pass',
      CF_ACCESS_CLIENT_ID: 'id',
      CF_ACCESS_CLIENT_SECRET: 'secret'
    } as any;

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('createPost should make POST request', async () => {
      const { createPost } = await import('@/lib/wordpress');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 101 }),
      });

      const postData = { title: 'New Post' };
      const res = await createPost(mockEnv, postData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://wp.example.com/posts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(postData)
        })
      );
      expect(res).toEqual({ id: 101 });
    });

    it('updatePost should make POST (update) request', async () => {
      const { updatePost } = await import('@/lib/wordpress');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 101, title: { rendered: 'Updated' } }),
      });

      const res = await updatePost(mockEnv, 101, { title: 'Updated' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://wp.example.com/posts/101',
        expect.objectContaining({ method: 'POST' })
      );
      expect(res.id).toBe(101);
    });

    it('uploadMedia should make POST request with binary', async () => {
      const { uploadMedia } = await import('@/lib/wordpress');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ source_url: 'http://img.jpg' }),
      });

      const buffer = new ArrayBuffer(10);
      const res = await uploadMedia(mockEnv, buffer, 'test.jpg');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://wp.example.com/media',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Disposition': 'attachment; filename="test.jpg"'
          }),
          body: buffer
        })
      );
      expect(res.source_url).toBe('http://img.jpg');
    });
  });
});
