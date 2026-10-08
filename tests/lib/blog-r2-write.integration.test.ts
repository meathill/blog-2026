import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { createBlogIncrementalCache } from '@/lib/blog-incremental-cache';
import { runWithCacheWritePolicy } from '@/lib/cache-write-policy';

const contextSymbol = Symbol.for('__cloudflare-context__');
let originalContext: PropertyDescriptor | undefined;
const put = vi.fn(async () => {});
const regionalPut = vi.fn(async () => {});

beforeEach(() => {
  put.mockClear();
  regionalPut.mockClear();
  originalContext = Object.getOwnPropertyDescriptor(globalThis, contextSymbol);
  Object.defineProperty(globalThis, contextSymbol, {
    configurable: true,
    value: { env: { NEXT_INC_CACHE_R2_BUCKET: { put } }, ctx: { waitUntil: vi.fn() }, cf: {} },
  });
  vi.stubGlobal('caches', { open: vi.fn(async () => ({ put: regionalPut })) });
});

afterEach(() => {
  if (originalContext) Object.defineProperty(globalThis, contextSymbol, originalContext);
  else Reflect.deleteProperty(globalThis, contextSymbol);
  vi.unstubAllGlobals();
});

describe('真实 R2 adapter 与区域缓存的恢复策略', () => {
  it('页面尚未确定为 404 前的数据 fetch，最终也不会调用 R2.put', async () => {
    const cache = createBlogIncrementalCache(r2IncrementalCache);
    await runWithCacheWritePolicy(async () => {
      await cache.set(
        'navigation',
        {
          kind: 'FETCH',
          data: { status: 200, body: 'W3siaWQiOjF9XQ==', url: 'https://example.com/navigation', headers: {} },
          revalidate: 86400,
        },
        'fetch',
      );
      return new Response('Not Found', { status: 404 });
    });
    expect(put).not.toHaveBeenCalled();
    expect(regionalPut).not.toHaveBeenCalled();
  });

  it('无状态码的 404 页面也不会调用 R2.put', async () => {
    const cache = createBlogIncrementalCache(r2IncrementalCache);
    await cache.set(
      'missing',
      { type: 'app', html: '<main data-blog-not-found="true">404</main>', rsc: '', revalidate: false },
      'cache',
    );
    expect(put).not.toHaveBeenCalled();
    expect(regionalPut).not.toHaveBeenCalled();
  });

  it('正常永久缓存页恢复后确实写入 R2 与区域缓存', async () => {
    const cache = createBlogIncrementalCache(r2IncrementalCache);
    const value = {
      type: 'app' as const,
      html: '<main>文章</main>',
      rsc: '',
      revalidate: false as const,
      meta: { status: 200, headers: {} },
    };
    await runWithCacheWritePolicy(async () => {
      await cache.set('valid', value, 'cache');
      expect(put).not.toHaveBeenCalled();
      return new Response('OK');
    });
    expect(put).toHaveBeenCalledOnce();
    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^incremental-cache\/.*\/.+\.cache$/),
      JSON.stringify(value),
    );
    expect(regionalPut).toHaveBeenCalledOnce();
  });
});
