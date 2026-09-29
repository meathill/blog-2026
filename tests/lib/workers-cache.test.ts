import { describe, expect, it, vi } from 'vitest';
import {
  applyEdgeCachePolicy,
  EDGE_HTML_CACHE_CONTROL,
  EDGE_HTML_CACHE_TAG,
  isEdgeCacheablePath,
  isEdgeCacheableRequest,
  purgeEdgeHtmlCache,
} from '@/lib/workers-cache';

const ORIGIN = 'https://meathill.com';

function req(path: string, init: RequestInit = {}) {
  return new Request(`${ORIGIN}${path}`, init);
}

function isrHtml(overrides: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response('<html></html>', {
    status: overrides.status ?? 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-nextjs-cache': 'HIT',
      'cache-control': 's-maxage=86000, stale-while-revalidate=2592000',
      vary: 'rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding',
      ...overrides.headers,
    },
  });
}

describe('isEdgeCacheablePath', () => {
  it.each([
    '/',
    '/en',
    '/posts',
    '/posts/page/2',
    '/posts/infra/upload-file-via-cloudflare-r2',
    '/en/posts/next-js/best-practice-for-nextjs-on-cloudflare-worker-2026',
    '/category/js',
    '/category/js/page/3',
    '/tag/%E5%89%8D%E7%AB%AF',
    '/posts/author/meathill',
    '/about',
    '/en/about',
    '/skills/react',
    '/solutions',
    '/tech/platforms',
  ])('公共 ISR 页可缓存：%s', (path) => {
    expect(isEdgeCacheablePath(path)).toBe(true);
  });

  it.each([
    '/admin',
    '/en/admin/blog',
    '/api/auth/session',
    '/api/og/post',
    '/feed',
    '/tag/js/feed',
    '/search',
    '/en/search',
    '/login',
    '/app',
    '/app/some-app',
    '/sitemap.xml',
    '/robots.txt',
    '/posts/',
    '/aboutx',
    '/_next/static/chunks/a.js',
  ])('其它路径不缓存：%s', (path) => {
    expect(isEdgeCacheablePath(path)).toBe(false);
  });
});

describe('isEdgeCacheableRequest', () => {
  it('普通 GET / HEAD 文档请求可缓存，普通 cookie（_ga）不影响', () => {
    expect(isEdgeCacheableRequest(req('/posts/a/b'))).toBe(true);
    expect(isEdgeCacheableRequest(req('/posts/a/b', { method: 'HEAD' }))).toBe(true);
    expect(isEdgeCacheableRequest(req('/', { headers: { cookie: '_ga=GA1.1.1; theme=dark' } }))).toBe(true);
  });

  it('非 GET/HEAD、带查询串不缓存', () => {
    expect(isEdgeCacheableRequest(req('/posts/a/b', { method: 'POST' }))).toBe(false);
    expect(isEdgeCacheableRequest(req('/posts/a/b?_rsc=abc'))).toBe(false);
    expect(isEdgeCacheableRequest(req('/?utm_source=x'))).toBe(false);
  });

  it.each([
    ['rsc', '1'],
    ['next-router-prefetch', '1'],
    ['next-action', 'abc'],
    ['x-prerender-revalidate', 'token'],
    ['authorization', 'Bearer x'],
  ])('带 %s 请求头不缓存', (name, value) => {
    expect(isEdgeCacheableRequest(req('/posts/a/b', { headers: { [name]: value } }))).toBe(false);
  });

  it.each([
    'better-auth.session_token=abc',
    '__Secure-better-auth.session_token=abc',
    '_ga=1; better-auth.session_data=x',
    '__prerender_bypass=1',
    '__next_preview_data=1',
  ])('登录 / 预览 cookie 不缓存：%s', (cookie) => {
    expect(isEdgeCacheableRequest(req('/', { headers: { cookie } }))).toBe(false);
  });
});

describe('applyEdgeCachePolicy', () => {
  it('公共 ISR HTML：写边缘 TTL + Cache-Tag + Vary 隔离，浏览器 Cache-Control 不动', () => {
    const res = applyEdgeCachePolicy(req('/posts/a/b'), isrHtml());
    expect(res.headers.get('cloudflare-cdn-cache-control')).toBe(EDGE_HTML_CACHE_CONTROL);
    expect(EDGE_HTML_CACHE_CONTROL).not.toMatch(/s-maxage|must-revalidate/);
    expect(res.headers.get('cache-tag')).toBe(EDGE_HTML_CACHE_TAG);
    expect(res.headers.get('x-edge-cache')).toBe('cache');
    expect(res.headers.get('cache-control')).toBe('s-maxage=86000, stale-while-revalidate=2592000');
    const vary = (res.headers.get('vary') ?? '').toLowerCase();
    expect(vary).toContain('x-prerender-revalidate');
    expect(vary).toContain('next-action');
    expect(vary).toContain('rsc');
    // 未压缩输出时去掉 Accept-Encoding，避免按原文分变体打散命中率
    expect(vary).not.toContain('accept-encoding');
    expect(vary.split(',').filter((v) => v.trim() === 'rsc')).toHaveLength(1);
  });

  it('MISS（首次渲染）也缓存，STALE（过期旧页）不缓存', () => {
    expect(
      applyEdgeCachePolicy(req('/'), isrHtml({ headers: { 'x-nextjs-cache': 'MISS' } })).headers.get('x-edge-cache'),
    ).toBe('cache');
    expect(
      applyEdgeCachePolicy(req('/'), isrHtml({ headers: { 'x-nextjs-cache': 'STALE' } })).headers.get('x-edge-cache'),
    ).toBe('bypass');
  });

  it.each([
    ['404', isrHtml({ status: 404 })],
    ['500', isrHtml({ status: 500 })],
    ['动态渲染（无 x-nextjs-cache）', isrHtml({ headers: { 'x-nextjs-cache': '' } })],
    ['Set-Cookie', isrHtml({ headers: { 'set-cookie': 'a=1' } })],
    ['private', isrHtml({ headers: { 'cache-control': 'private, no-cache, no-store' } })],
    ['非 HTML', isrHtml({ headers: { 'content-type': 'application/json' } })],
    ['Vary: *', isrHtml({ headers: { vary: '*' } })],
  ])('%s 响应显式 no-store（防 heuristic freshness 默认缓存）', (_name, response) => {
    const res = applyEdgeCachePolicy(req('/posts/a/b'), response);
    expect(res.headers.get('cloudflare-cdn-cache-control')).toBe('no-store');
    expect(res.headers.get('cache-tag')).toBeNull();
    expect(res.headers.get('x-edge-cache')).toBe('bypass');
  });

  it('不可缓存的请求（admin / 登录）即使响应像 ISR 也 no-store，并保留状态码与 body', async () => {
    const admin = applyEdgeCachePolicy(req('/admin'), isrHtml({ headers: { 'cache-tag': 'x' } }));
    expect(admin.headers.get('cloudflare-cdn-cache-control')).toBe('no-store');
    expect(admin.headers.get('cache-tag')).toBeNull();
    const loggedIn = applyEdgeCachePolicy(
      req('/', { headers: { cookie: 'better-auth.session_token=1' } }),
      isrHtml({ status: 200 }),
    );
    expect(loggedIn.headers.get('cloudflare-cdn-cache-control')).toBe('no-store');
    expect(loggedIn.status).toBe(200);
    expect(await loggedIn.text()).toBe('<html></html>');
  });
});

describe('purgeEdgeHtmlCache', () => {
  it('按 html tag 调 ctx.cache.purge', async () => {
    const purge = vi.fn().mockResolvedValue({ success: true, errors: [] });
    expect(await purgeEdgeHtmlCache({ cache: { purge } })).toBe(true);
    expect(purge).toHaveBeenCalledWith({ tags: [EDGE_HTML_CACHE_TAG] });
  });

  it('未开启 Workers Cache（ctx.cache 缺失）、限流失败、抛错都返回 false 不抛', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await purgeEdgeHtmlCache({})).toBe(false);
    const limited = vi.fn().mockResolvedValue({ success: false, errors: [{ code: 429, message: 'rate limited' }] });
    expect(await purgeEdgeHtmlCache({ cache: { purge: limited } })).toBe(false);
    const broken = vi.fn().mockRejectedValue(new Error('boom'));
    expect(await purgeEdgeHtmlCache({ cache: { purge: broken } })).toBe(false);
    warn.mockRestore();
    error.mockRestore();
  });

  it('延迟后再 purge（等 revalidateTag 落盘）', async () => {
    vi.useFakeTimers();
    try {
      const purge = vi.fn().mockResolvedValue({ success: true, errors: [] });
      const pending = purgeEdgeHtmlCache({ cache: { purge } }, 3000);
      await vi.advanceTimersByTimeAsync(2999);
      expect(purge).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(await pending).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
