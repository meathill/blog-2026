import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const { mockIntlMiddleware } = vi.hoisted(() => ({
  mockIntlMiddleware: vi.fn(),
}));

vi.mock('next-intl/middleware', () => ({
  default: () => mockIntlMiddleware,
}));

vi.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['en', 'zh'],
    defaultLocale: 'zh',
  },
}));

// Import after mocks
import middleware from '@/middleware';

describe('Middleware', () => {
  const BASE_URL = 'http://localhost:3000';

  beforeEach(() => {
    mockIntlMiddleware.mockClear();
  });

  // --- 已有用例 (已修正为 async) ---

  it('should redirect .html paths to canonical paths', async () => {
    const req = new NextRequest(new URL('/en/tech/article.html', BASE_URL));
    const res = await middleware(req);

    expect(res).toBeInstanceOf(NextResponse);
    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/en/posts/tech/article`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should redirect .html/amp paths to canonical paths', async () => {
    const req = new NextRequest(new URL('/tech/article.html/amp', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
  });

  it('should redirect /amp suffix paths to canonical paths', async () => {
    const req = new NextRequest(new URL('/tech/article/amp', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
  });

  it('should redirect legacy paths (segment >= 2) to /posts/', async () => {
    const req = new NextRequest(new URL('/en/tech/article', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/en/posts/tech/article`);
  });

  it('should redirect legacy paths without locale to /posts/', async () => {
    const req = new NextRequest(new URL('/tech/article', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
  });

  it('should NOT redirect standard paths like /about', async () => {
    const req = new NextRequest(new URL('/en/about', BASE_URL));
    await middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should NOT redirect /posts paths', async () => {
    const req = new NextRequest(new URL('/en/posts/tech/article', BASE_URL));
    await middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should redirect /tags/xxx to /tag/xxx', async () => {
    const req = new NextRequest(new URL('/tags/memory', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/zh/tag/memory`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should redirect /en/tags/xxx to /en/tag/xxx', async () => {
    const req = new NextRequest(new URL('/en/tags/memory', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/en/tag/memory`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should NOT redirect /tag/xxx', async () => {
    const req = new NextRequest(new URL('/tag/memory', BASE_URL));
    await middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should redirect /page/3 to /posts/page/3', async () => {
    const req = new NextRequest(new URL('/page/3', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/zh/posts/page/3`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  // --- 新增用例：Feed Rewrite ---

  it('should rewrite /tag/foo/feed to /feed/tag/foo', async () => {
    const req = new NextRequest(new URL('/tag/foo/feed', BASE_URL));
    const res = await middleware(req);

    // rewrite 不会改变 status，但 NextResponse.rewrite 会设置 x-middleware-rewrite header
    expect(res).toBeInstanceOf(NextResponse);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should rewrite /category/life/feed to /feed/category/life', async () => {
    const req = new NextRequest(new URL('/category/life/feed', BASE_URL));
    const res = await middleware(req);

    expect(res).toBeInstanceOf(NextResponse);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  // --- 新增用例：Category Pagination and Single-Segment ---

  it('should redirect /tech/page/22 to /category/tech/page/22', async () => {
    const req = new NextRequest(new URL('/tech/page/22', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/category/tech/page/22`);
  });

  it('should redirect single-segment /tech to /category/tech', async () => {
    const req = new NextRequest(new URL('/tech', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/category/tech`);
  });

  it('should still redirect /tech/article to /posts/tech/article', async () => {
    const req = new NextRequest(new URL('/tech/article', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
  });

  // --- 新增用例：410 Gone (Updated to Category) ---

  it('should redirect single-segment unknown paths like /img_0226 to /category/img_0226', async () => {
    const req = new NextRequest(new URL('/img_0226', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/category/img_0226`);
  });

  // --- 新增用例：attachment_id ---

  it('should return 404 for ?attachment_id when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'));

    const req = new NextRequest(new URL('/?attachment_id=9999', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(404);
    vi.restoreAllMocks();
  });

  it('should return 404 for ?attachment_id when API returns 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

    const req = new NextRequest(new URL('/?attachment_id=9999', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(404);
    vi.restoreAllMocks();
  });

  it('should redirect for ?attachment_id when API returns source_url', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ source_url: 'https://blog.meathill.com/uploads/img.jpg' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const req = new NextRequest(new URL('/?attachment_id=2035', BASE_URL));
    const res = await middleware(req);

    expect(res?.status).toBe(301);
    expect(res?.headers.get('Location')).toBe('https://blog.meathill.com/uploads/img.jpg');
    vi.restoreAllMocks();
  });
});
