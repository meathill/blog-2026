import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock getCloudflareContext
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(),
}));

import { POST } from '@/app/api/perf/route';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// /api/perf 响应体固定为 { ok: boolean }
interface PerfApiResponse {
  ok: boolean;
}

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/perf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/perf', () => {
  const mockKvGet = vi.fn();
  const mockKvPut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockKvGet.mockResolvedValue(null);
    mockKvPut.mockResolvedValue(undefined);
    (getCloudflareContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      env: {
        PERF_KV: {
          get: mockKvGet,
          put: mockKvPut,
        },
      },
    });
  });

  it('应该正确记录 highlight 语言', async () => {
    const request = createRequest({
      type: 'highlight-languages',
      data: { languages: ['javascript', 'css'], path: '/posts/test' },
    });

    const response = await POST(request as any);
    const json = (await response.json()) as PerfApiResponse;

    expect(json.ok).toBe(true);
    expect(mockKvPut).toHaveBeenCalledTimes(2); // langs + paths

    // 验证 langs 写入
    const langsCall = mockKvPut.mock.calls.find((c: string[]) => c[0] === 'hl:langs');
    expect(langsCall).toBeTruthy();
    const langsData = JSON.parse(langsCall![1]);
    expect(langsData.javascript).toBe(1);
    expect(langsData.css).toBe(1);

    // 验证 paths 写入
    const pathsCall = mockKvPut.mock.calls.find((c: string[]) => c[0] === 'hl:paths');
    expect(pathsCall).toBeTruthy();
    const pathsData = JSON.parse(pathsCall![1]);
    expect(pathsData['/posts/test']).toEqual(['javascript', 'css']);
  });

  it('应该聚合已有的语言计数', async () => {
    mockKvGet.mockImplementation((key: string) => {
      if (key === 'hl:langs') return Promise.resolve({ javascript: 5 });
      if (key === 'hl:paths') return Promise.resolve({ '/posts/test': ['javascript'] });
      return Promise.resolve(null);
    });

    const request = createRequest({
      type: 'highlight-languages',
      data: { languages: ['javascript', 'python'], path: '/posts/test' },
    });

    const response = await POST(request as any);
    expect(((await response.json()) as PerfApiResponse).ok).toBe(true);

    const langsCall = mockKvPut.mock.calls.find((c: string[]) => c[0] === 'hl:langs');
    const langsData = JSON.parse(langsCall![1]);
    expect(langsData.javascript).toBe(6); // 5 + 1
    expect(langsData.python).toBe(1);

    const pathsCall = mockKvPut.mock.calls.find((c: string[]) => c[0] === 'hl:paths');
    const pathsData = JSON.parse(pathsCall![1]);
    expect(pathsData['/posts/test']).toContain('javascript');
    expect(pathsData['/posts/test']).toContain('python');
  });

  it('KV 未绑定时应静默返回 ok', async () => {
    (getCloudflareContext as ReturnType<typeof vi.fn>).mockResolvedValue({
      env: {},
    });

    const request = createRequest({
      type: 'highlight-languages',
      data: { languages: ['javascript'], path: '/posts/test' },
    });

    const response = await POST(request as any);
    expect(((await response.json()) as PerfApiResponse).ok).toBe(true);
    expect(mockKvPut).not.toHaveBeenCalled();
  });

  it('缺少 type 应返回 400', async () => {
    const request = createRequest({ data: { languages: ['js'] } });
    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('缺少 data 应返回 400', async () => {
    const request = createRequest({ type: 'highlight-languages' });
    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('无效 JSON 应返回 400', async () => {
    const request = new Request('http://localhost/api/perf', {
      method: 'POST',
      body: 'not json',
    });
    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });
});
