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
});
