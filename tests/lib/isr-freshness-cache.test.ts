import { describe, expect, it, vi } from 'vitest';
import { applyStoredRevalidate, type NextModeTagCache, withStoredRevalidate } from '@/lib/isr-freshness-cache';

const NOW = 1_800_000_000_000;
const DAY = 86400;

type Entry = Parameters<typeof applyStoredRevalidate>[0];

function appEntry(ageSeconds: number, overrides: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return {
    lastModified: NOW - ageSeconds * 1000,
    value: {
      type: 'app',
      html: '<html></html>',
      rsc: '',
      revalidate: DAY,
      meta: { status: 200, headers: { 'x-next-cache-tags': 'wp,_N_T_/zh/posts/a', ...headers } },
      ...overrides,
    },
  } as unknown as Entry;
}

function tagCache(opts: { revalidated?: boolean; stale?: boolean; mode?: string } = {}): NextModeTagCache {
  return {
    mode: opts.mode ?? 'nextMode',
    hasBeenRevalidated: vi.fn().mockResolvedValue(opts.revalidated ?? false),
    isStale: vi.fn().mockResolvedValue(opts.stale ?? false),
  };
}

function headersOf(entry: Entry): Record<string, unknown> {
  return (entry.value as { meta: { headers: Record<string, unknown> } }).meta.headers;
}

describe('applyStoredRevalidate', () => {
  it('TTL 内且 tag 未失效：lastModified 报为 now，写入剩余 TTL 的 s-maxage', async () => {
    const cache = tagCache();
    const entry = appEntry(3600);
    const result = await applyStoredRevalidate(entry, NOW, cache);

    expect(result.lastModified).toBe(NOW);
    expect(headersOf(result)['cache-control']).toBe(`s-maxage=${DAY - 3600}, stale-while-revalidate=2592000`);
    // 用真实 lastModified 查 tag，而不是伪造后的 now
    expect(cache.hasBeenRevalidated).toHaveBeenCalledWith(['wp', '_N_T_/zh/posts/a'], NOW - 3600 * 1000);
    // 不修改原条目（regional cache 可能复用同一对象）
    expect(entry.lastModified).toBe(NOW - 3600 * 1000);
    expect(headersOf(entry)['cache-control']).toBeUndefined();
  });

  it('发布后 tag 已失效：原样返回，让 OpenNext 判 miss 重新渲染', async () => {
    const entry = appEntry(60);
    const result = await applyStoredRevalidate(entry, NOW, tagCache({ revalidated: true }));
    expect(result).toBe(entry);
  });

  it('tag 处于 SWR 窗口（导航变更 revalidateTag max）：原样返回，走 STALE', async () => {
    const entry = appEntry(60);
    expect(await applyStoredRevalidate(entry, NOW, tagCache({ stale: true }))).toBe(entry);
  });

  it('超过 TTL：原样返回，交给 Next SWR，不查 tag', async () => {
    const cache = tagCache();
    const entry = appEntry(DAY + 1);
    expect(await applyStoredRevalidate(entry, NOW, cache)).toBe(entry);
    expect(cache.hasBeenRevalidated).not.toHaveBeenCalled();
  });

  it('拿不到 next-mode tag cache 时保守不改（避免吞掉 revalidateTag）', async () => {
    const entry = appEntry(60);
    expect(await applyStoredRevalidate(entry, NOW, undefined)).toBe(entry);
    expect(await applyStoredRevalidate(entry, NOW, tagCache({ mode: 'original' }))).toBe(entry);
  });

  it('shouldBypassTagCache 的条目不查 tag 直接修正', async () => {
    const cache = tagCache({ revalidated: true });
    const entry = { ...appEntry(60), shouldBypassTagCache: true } as Entry;
    const result = await applyStoredRevalidate(entry, NOW, cache);
    expect(result.lastModified).toBe(NOW);
    expect(cache.hasBeenRevalidated).not.toHaveBeenCalled();
  });

  it('尊重条目自带的 Cache-Control（如 route handler）', async () => {
    const entry = appEntry(60, { type: 'route', body: '' }, { 'Cache-Control': 'public, s-maxage=3600' });
    const result = await applyStoredRevalidate(entry, NOW, tagCache());
    expect(result.lastModified).toBe(NOW);
    expect(headersOf(result)['Cache-Control']).toBe('public, s-maxage=3600');
    expect(headersOf(result)['cache-control']).toBeUndefined();
  });

  it('无 revalidate（SSG / 旧条目）、redirect 条目不动', async () => {
    const ssg = appEntry(60, { revalidate: false });
    expect(await applyStoredRevalidate(ssg, NOW, tagCache())).toBe(ssg);
    const redirect = appEntry(60, { type: 'redirect' });
    expect(await applyStoredRevalidate(redirect, NOW, tagCache())).toBe(redirect);
  });
});

describe('withStoredRevalidate', () => {
  function makeStore(entry: unknown) {
    return {
      name: 'r2-incremental-cache',
      get: vi.fn().mockResolvedValue(entry),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
  }

  it('透传 name / set / delete，fetch 缓存不处理', async () => {
    const entry = appEntry(60);
    const store = makeStore(entry);
    const wrapped = withStoredRevalidate(store as never, () => tagCache());

    expect(wrapped.name).toBe('r2-incremental-cache');
    expect(await wrapped.get('k', 'fetch')).toBe(entry);
    await wrapped.set('k', {} as never, 'cache');
    await wrapped.delete('k');
    expect(store.set).toHaveBeenCalledWith('k', {}, 'cache');
    expect(store.delete).toHaveBeenCalledWith('k');
  });

  it('页面缓存读取时修正新鲜度', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    try {
      const wrapped = withStoredRevalidate(makeStore(appEntry(60)) as never, () => tagCache());
      const result = await wrapped.get('k', 'cache');
      expect(result?.lastModified).toBe(NOW);
    } finally {
      vi.useRealTimers();
    }
  });
});
