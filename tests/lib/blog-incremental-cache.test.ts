import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import NotFoundContent from '@/components/NotFoundContent';
import type { IncrementalCache } from '@/lib/blog-incremental-cache';
import {
  createBlogIncrementalCache,
  isNotFoundCacheValue,
  withNotFoundCachePolicy,
} from '@/lib/blog-incremental-cache';
import { runWithCacheWritePolicy } from '@/lib/cache-write-policy';

vi.mock('@opennextjs/cloudflare/overrides/incremental-cache/regional-cache', () => ({
  withRegionalCache: vi.fn((store: IncrementalCache) => store),
}));

function makeStore(entry: unknown = null) {
  return {
    name: 'cf-r2-incremental-cache',
    get: vi.fn().mockResolvedValue(entry),
    set: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
  } satisfies IncrementalCache;
}

function page(status?: number, html = '<main>文章内容</main>', revalidate: number | false = 86400) {
  return { type: 'app' as const, html, rsc: '', revalidate, meta: { status, headers: {} } };
}

function fetchEntry(status: number, body: string, url = 'https://blog.meathill.com/wp-json/wp/v2/posts?slug=missing') {
  return { kind: 'FETCH' as const, data: { status, body, url, headers: {} }, revalidate: 86400 };
}

describe('恢复后的博客缓存策略', () => {
  it.each([
    page(404),
    page(undefined, '<main data-blog-not-found="true">404</main>', false),
    page(200, '<main data-blog-not-found="true">404</main>'),
    { type: 'route' as const, body: 'Not Found', meta: { status: 404 }, revalidate: 86400 },
  ])('拒绝显式 404 和缺状态码/流式 200 的 404 页面', async (value) => {
    const store = makeStore();
    await withNotFoundCachePolicy(store).set('missing', value, 'cache');
    expect(store.set).not.toHaveBeenCalled();
  });

  it('实际 404 组件的 SSR 标记能阻止无状态码缓存写入', async () => {
    const store = makeStore();
    const html = renderToStaticMarkup(createElement(NotFoundContent));
    await withNotFoundCachePolicy(store).set('missing', page(undefined, html, false), 'cache');
    expect(store.set).not.toHaveBeenCalled();
  });

  it('正常永久 SSG 缓存仍可写入，不把 revalidate=false 当成 404', async () => {
    const store = makeStore();
    const value = page(200, '<main>正常静态文章</main>', false);
    await withNotFoundCachePolicy(store).set('valid', value, 'cache');
    expect(store.set).toHaveBeenCalledWith('valid', value, 'cache');
  });

  it('页面文章中提到 404 或写了转义示例不误拦', () => {
    expect(isNotFoundCacheValue(page(200, '<pre>&lt;main data-blog-not-found=&quot;true&quot;&gt;404</pre>'))).toBe(
      false,
    );
  });

  it('读取到旧 404 缓存时返回 miss', async () => {
    const store = makeStore({ value: page(404), lastModified: Date.now() });
    await expect(withNotFoundCachePolicy(store).get('missing', 'cache')).resolves.toBeNull();
  });

  it('明确的 fetch 404 响应不缓存', async () => {
    const store = makeStore();
    await withNotFoundCachePolicy(store).set('lookup', fetchEntry(404, '{}'), 'fetch');
    expect(store.set).not.toHaveBeenCalled();
  });

  it.each(['[]', Buffer.from('[]').toString('base64')])('WP slug 查询的空结果不缓存：%s', async (body) => {
    const store = makeStore();
    await withNotFoundCachePolicy(store).set('lookup', fetchEntry(200, body), 'fetch');
    expect(store.set).not.toHaveBeenCalled();
  });

  it('有效文章与首页空列表仍缓存，深分页空结果不缓存', async () => {
    const store = makeStore();
    const filtered = withNotFoundCachePolicy(store);
    await filtered.set('valid', fetchEntry(200, Buffer.from('[{"id":1}]').toString('base64')), 'fetch');
    await filtered.set('list', fetchEntry(200, '[]', 'https://blog.meathill.com/wp-json/wp/v2/posts'), 'fetch');
    await filtered.set(
      'deep',
      fetchEntry(200, '[]', 'https://blog.meathill.com/wp-json/wp/v2/posts?offset=4999900'),
      'fetch',
    );
    expect(store.set).toHaveBeenCalledTimes(2);
  });

  it('最后返回 404 时，已成功查询的共享数据也不写入', async () => {
    const store = makeStore();
    await runWithCacheWritePolicy(async () => {
      await withNotFoundCachePolicy(store).set('navigation', fetchEntry(200, '[{"id":1}]'), 'fetch');
      return new Response('Not Found', { status: 404 });
    });
    expect(store.set).not.toHaveBeenCalled();
  });

  it('流式 200 中出现明确 404 页面时，已计划的数据写入也被丢弃', async () => {
    const store = makeStore();
    const filtered = withNotFoundCachePolicy(store);
    await runWithCacheWritePolicy(async () => {
      await filtered.set('navigation', fetchEntry(200, '[{"id":1}]'), 'fetch');
      await filtered.set('missing', page(200, '<main data-blog-not-found="true">404</main>'), 'cache');
      return new Response('Not Found UI');
    });
    expect(store.set).not.toHaveBeenCalled();
  });

  it('空 slug 查询后回退到正常页面，正常页面仍能写入', async () => {
    const store = makeStore();
    const filtered = withNotFoundCachePolicy(store);
    await runWithCacheWritePolicy(async () => {
      await filtered.set('missing-lookup', fetchEntry(200, '[]'), 'fetch');
      await filtered.set('valid-fallback', page(200), 'cache');
      return new Response('OK');
    });
    expect(store.set).toHaveBeenCalledOnce();
    expect(store.set).toHaveBeenCalledWith('valid-fallback', expect.objectContaining({ type: 'app' }), 'cache');
  });

  it('恢复工厂始终启用过滤，并阻止 CLI 直接预填 R2 绕过策略', async () => {
    const store = makeStore();
    const cache = createBlogIncrementalCache(store);
    expect(cache.name).not.toBe('cf-r2-incremental-cache');
    await cache.set('missing', page(404), 'cache');
    expect(store.set).not.toHaveBeenCalled();
    await cache.set('valid', page(200), 'cache');
    expect(store.set).toHaveBeenCalledOnce();
  });
});
