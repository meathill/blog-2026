import {
  CacheHandler,
  type CacheHandlerValue,
  IncrementalCache as NextIncrementalCache,
} from 'next/dist/server/lib/incremental-cache/index.js';
import { SharedCacheControls } from 'next/dist/server/lib/incremental-cache/shared-cache-controls.external.js';
import type { CachedRouteKind, IncrementalCacheKind } from 'next/dist/server/response-cache/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type IncrementalCache, restoreStoredRevalidate, withStoredRevalidate } from '@/lib/isr-freshness-cache';

const NOW = Date.now();
const DAY = 86400;
const manifest = {
  version: 4 as const,
  routes: {},
  dynamicRoutes: {},
  notFoundRoutes: [],
  preview: { previewModeId: 'test', previewModeSigningKey: 'test', previewModeEncryptionKey: 'test' },
};
const controls = new SharedCacheControls(manifest);
function page(revalidate: number | false = DAY, ageSeconds = 60) {
  return {
    value: { type: 'app' as const, html: '<main>文章</main>', rsc: '', revalidate },
    lastModified: NOW - ageSeconds * 1000,
  };
}
function makeStore(entry = page()) {
  const store = {
    name: 'test',
    get: vi.fn(async () => entry),
    set: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
  };
  return store as IncrementalCache & typeof store;
}
function makeNextCache(entry = page(), restore = true, tagStale = false) {
  const store = makeStore(entry);
  const wrapped = restore ? withStoredRevalidate(store) : store;
  class Handler extends CacheHandler {
    override async get(key: string): Promise<CacheHandlerValue | null> {
      const cached = await wrapped.get(key, 'cache');
      if (!cached) return null;
      return {
        lastModified: tagStale ? 1 : entry.lastModified,
        value: {
          kind: 'APP_PAGE' as CachedRouteKind.APP_PAGE,
          html: entry.value.html,
          rscData: Buffer.from(''),
          headers: undefined,
          postponed: undefined,
          status: undefined,
          segmentData: undefined,
        },
      };
    }
  }
  const cache = new NextIncrementalCache({
    dev: false,
    requestHeaders: {},
    getPrerenderManifest: () => manifest,
    CurCacheHandler: Handler,
  });
  vi.stubGlobal('__incrementalCache', cache);
  return cache;
}
async function read(cache: NextIncrementalCache) {
  return cache.get('/zh/skills', { kind: 'APP_PAGE' as IncrementalCacheKind.APP_PAGE, isFallback: false });
}
afterEach(() => {
  controls.clear();
  vi.unstubAllGlobals();
});

describe('持久化页面 TTL 恢复到真实 Next 新鲜度判断', () => {
  it('回归：缺少修复时，60 秒前的一天缓存被 Next 判为 STALE', async () => {
    expect((await read(makeNextCache(page(), false)))?.isStale).toBe(true);
  });
  it('冷实例读取后为 HIT，并保留真实 lastModified 与条目', async () => {
    const entry = page();
    const result = await read(makeNextCache(entry));
    expect(result?.isStale).toBeUndefined();
    expect(result?.cacheControl?.revalidate).toBe(DAY);
    expect(result?.revalidateAfter).toBe(entry.lastModified + DAY * 1000);
    expect(entry.value).not.toHaveProperty('meta');
    expect(entry.lastModified).toBe(NOW - 60000);
  });
  it('超过一天仍然 STALE，不延长缓存生命', async () => {
    expect((await read(makeNextCache(page(DAY, DAY + 10))))?.isStale).toBe(true);
  });
  it('tag 失效由原生 adapter 的时间戳触发刷新，不被 TTL 恢复掩盖', async () => {
    expect((await read(makeNextCache(page(), true, true)))?.isStale).toBe(true);
  });
  it('永久缓存 false 保持不过期', async () => {
    const result = await read(makeNextCache(page(false, DAY * 10)));
    expect(result?.isStale).toBeUndefined();
    expect(result?.cacheControl?.revalidate).toBe(false);
  });
  it('保留 manifest / 当前实例已知的路由配置及 expire', () => {
    controls.set('/zh/skills', { revalidate: 300, expire: 600 });
    restoreStoredRevalidate('/zh/skills/index', page(), controls);
    expect(controls.get('/zh/skills')).toEqual({ revalidate: 300, expire: 600 });
  });
  it('fetch、无效 TTL、未命中不恢复配置', async () => {
    const store = makeStore();
    const wrapped = withStoredRevalidate(store, () => controls);
    await wrapped.get('/fetch', 'fetch');
    for (const revalidate of [undefined, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      restoreStoredRevalidate('/invalid', { value: { type: 'app', revalidate } }, controls);
    }
    expect(controls.get('/fetch')).toBeUndefined();
    expect(controls.get('/invalid')).toBeUndefined();
  });
  it('底层缓存 name、set、delete 保持透传', async () => {
    const store = makeStore();
    const wrapped = withStoredRevalidate(store, () => controls);
    expect(wrapped.name).toBe(store.name);
    await wrapped.set('key', page().value, 'cache');
    await wrapped.delete('key');
    expect(store.set).toHaveBeenCalledOnce();
    expect(store.delete).toHaveBeenCalledOnce();
  });
});
