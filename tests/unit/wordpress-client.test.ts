import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { wpFetch } from '../../src/lib/wordpress/client';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(),
}));

function mockResponse(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `Status ${status}`,
    text: async () => JSON.stringify(body),
    json: async () => body,
    body: { cancel: vi.fn(async () => {}) },
  } as unknown as Response;
}

describe('wpFetch 超时与重试', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getCloudflareContext as any).mockResolvedValue({
      env: { WORDPRESS_API_URL: 'https://mock-wp.com/wp-json/wp/v2' },
    });
  });

  it('源站 5xx 时重试一次并成功', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(503))
      .mockResolvedValueOnce(mockResponse(200, [{ id: 1 }]));

    const data = await wpFetch<{ id: number }[]>('/posts?slug=demo');

    expect(data).toEqual([{ id: 1 }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('网络错误（如源站挂起超时）重试一次并成功', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(mockResponse(200, []));

    await expect(wpFetch('/posts')).resolves.toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('连续 5xx 重试耗尽后抛错', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse(524));

    await expect(wpFetch('/posts?slug=demo')).rejects.toThrow('WordPress API error: 524');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('4xx 属于确定失败，不重试', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse(404));

    await expect(wpFetch('/posts?slug=none')).rejects.toThrow('WordPress API error: 404');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('非 GET 请求不自动重试，避免写操作重复执行', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse(503));

    await expect(wpFetch('/posts', { method: 'POST' })).rejects.toThrow('WordPress API error: 503');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('每次请求都带超时 signal', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockResponse(200, []));

    await wpFetch('/posts');

    const init = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
