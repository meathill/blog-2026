import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, HEAD } from '@/app/api/markdown-negotiation/route';

vi.mock('@/lib/seo/markdown-negotiation', () => ({
  resolvePathMarkdown: vi.fn(async (path: string) => {
    if (path === '/posts/tech/exists') {
      return '# 示例文章\n\n正文内容';
    }
    return null;
  }),
}));

describe('api/markdown-negotiation route handler', () => {
  const BASE_URL = 'http://localhost:3000';

  it('缺少 path 参数时返回 400', async () => {
    const req = new NextRequest(new URL('/api/markdown-negotiation', BASE_URL));
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(res.headers.get('Vary')).toBe('Accept');
  });

  it('存在的内容路径返回 200 与 text/markdown 及 Vary: Accept', async () => {
    const req = new NextRequest(new URL('/api/markdown-negotiation?path=%2Fposts%2Ftech%2Fexists', BASE_URL));
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(res.headers.get('Vary')).toBe('Accept');
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600');
    const body = await res.text();
    expect(body).toBe('# 示例文章\n\n正文内容');
  });

  it('HEAD 请求返回对应状态与头部且无正文', async () => {
    const req = new NextRequest(new URL('/api/markdown-negotiation?path=%2Fposts%2Ftech%2Fexists', BASE_URL), {
      method: 'HEAD',
    });
    const res = await HEAD(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
    expect(res.headers.get('Vary')).toBe('Accept');
    const body = await res.text();
    expect(body).toBe('');
  });

  it('不存在的内容路径返回 404', async () => {
    const req = new NextRequest(new URL('/api/markdown-negotiation?path=%2Fposts%2Ftech%2Fnot-exists', BASE_URL));
    const res = await GET(req);
    expect(res.status).toBe(404);
    expect(res.headers.get('Vary')).toBe('Accept');
  });
});
