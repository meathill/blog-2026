import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import middleware from '@/middleware';

const { mockIntlMiddleware } = vi.hoisted(() => ({
  mockIntlMiddleware: vi.fn(),
}));

vi.mock('next-intl/middleware', () => ({
  default: () => mockIntlMiddleware,
}));

// Mock routing since it is used in middleware initialization
vi.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['en', 'zh'],
    defaultLocale: 'zh',
  },
}));

describe('Middleware', () => {
  const BASE_URL = 'http://localhost:3000';

  it('Example: should redirect .html paths to canonical paths', () => {
    const req = new NextRequest(new URL('/en/tech/article.html', BASE_URL));
    const res = middleware(req);

    // Should be a redirect
    expect(res).toBeInstanceOf(NextResponse);
    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/en/posts/tech/article`);

    // Should NOT call intlMiddleware
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('Example: should redirect legacy paths (segment >= 2) to /posts/', () => {
    // /en/tech/article -> should go to /en/posts/tech/article
    const req = new NextRequest(new URL('/en/tech/article', BASE_URL));
    const res = middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/en/posts/tech/article`);
  });

  it('Example: should redirect legacy paths without locale to /posts/ (and let next-intl handle locale later if needed)', () => {
    // /tech/article -> /posts/tech/article
    // Note: In my implementation, I check for locale.
    // If no locale, I simply prepend /posts/ to the pathname.
    // Middleware re-runs on redirect.

    const req = new NextRequest(new URL('/tech/article', BASE_URL));
    const res = middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/article`);
  });

  it('should NOT redirect standard paths like /about', () => {
    const req = new NextRequest(new URL('/en/about', BASE_URL));
    middleware(req);

    // Should pass through to intlMiddleware
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should NOT redirect /posts paths', () => {
    const req = new NextRequest(new URL('/en/posts/tech/article', BASE_URL));
    // Reset mock before test
    mockIntlMiddleware.mockClear();

    middleware(req);

    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should NOT redirect single segment paths (potential categories)', () => {
    // /en/tech -> might be category list, keep as is for now?
    // My logic: if (contentSegments.length >= 2) -> redirect.
    // So /en/tech (1 content segment) should NOT redirect.

    const req = new NextRequest(new URL('/en/tech', BASE_URL));
    mockIntlMiddleware.mockClear();
    middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should redirect /tags/xxx to /tag/xxx', () => {
    const req = new NextRequest(new URL('/tags/memory', BASE_URL));
    // Reset mock
    mockIntlMiddleware.mockClear();

    const res = middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/zh/tag/memory`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should redirect /en/tags/xxx to /en/tag/xxx', () => {
    const req = new NextRequest(new URL('/en/tags/memory', BASE_URL));
    mockIntlMiddleware.mockClear();

    const res = middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/en/tag/memory`);
    expect(mockIntlMiddleware).not.toHaveBeenCalled();
  });

  it('should NOT redirect /tag/xxx/page/2', () => {
    const req = new NextRequest(new URL('/tag/memory/page/2', BASE_URL));
    mockIntlMiddleware.mockClear();

    const res = middleware(req);

    expect(res).toBeUndefined();
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should NOT redirect /tag/xxx', () => {
    const req = new NextRequest(new URL('/tag/memory', BASE_URL));
    mockIntlMiddleware.mockClear();
    middleware(req);
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should NOT redirect /posts/streaming-summary-march-and-bbchan', () => {
    const req = new NextRequest(new URL('/posts/streaming-summary-march-and-bbchan', BASE_URL));
    mockIntlMiddleware.mockClear();

    const res = middleware(req);

    // Should NOT redirect, but let international middleware handle it
    expect(res).toBeUndefined();
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should redirect /tech/interview-tutorial-how-to-use-github.html to /posts/tech/interview-tutorial-how-to-use-github', () => {
    const req = new NextRequest(new URL('/tech/interview-tutorial-how-to-use-github.html', BASE_URL));
    mockIntlMiddleware.mockClear();

    const res = middleware(req);

    expect(res?.status).toBe(307);
    expect(res?.headers.get('Location')).toBe(`${BASE_URL}/posts/tech/interview-tutorial-how-to-use-github`);
  });

  it('should NOT redirect /posts/interview-tutorial-how-to-use-github', () => {
    const req = new NextRequest(new URL('/posts/interview-tutorial-how-to-use-github', BASE_URL));
    mockIntlMiddleware.mockClear();

    const res = middleware(req);

    expect(res).toBeUndefined();
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });

  it('should NOT redirect /posts/from-uiprint-co-to-how-to-learn-coding', () => {
    const req = new NextRequest(new URL('/posts/from-uiprint-co-to-how-to-learn-coding', BASE_URL));
    mockIntlMiddleware.mockClear();

    const res = middleware(req);

    expect(res).toBeUndefined();
    expect(mockIntlMiddleware).toHaveBeenCalled();
  });
});
