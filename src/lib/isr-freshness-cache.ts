import type { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';

// Issue #14：按需 ISR 页（全站 generateStaticParams 返回 []，所有文章/首页都不在 prerender-manifest）
// 在 Workers 上几乎每次都是 `x-nextjs-cache: STALE`（无 Cache-Control）并触发后台重渲染。
//
// 根因：Next 16 IncrementalCache.calculateRevalidate 只从 prerender-manifest 或本 isolate 内存
// （SharedCacheControls）取页面的 revalidate，都取不到就回退为「1 秒后过期」。Workers isolate
// 频繁更替，段配置 `revalidate = 86400` 对这些路径实际无效。
//
// 修复：OpenNext 写增量缓存时把真实 revalidate 存进条目（value.revalidate）。包一层增量缓存：
// - 条目仍在 TTL 内且 tag 未失效：lastModified 报成「现在」，让 Next 的 1 秒回退也判为新鲜（HIT），
//   并把剩余 TTL 写进缓存头，OpenNext fixISRHeaders 据此输出正确的 s-maxage；
// - 已过 TTL，或 tag 已失效 / 处于 SWR 窗口：原样返回，由 OpenNext + Next 照常处理。
//
// 与 free-ai-api 的同名方案不同：本站 tag cache 是 D1 next-mode，`hasBeenRevalidated` 比较的是
// 「tag 失效时间 > 条目 lastModified」。如果直接把 lastModified 改成 now，发布时的
// revalidateTag 就永远判不中。所以必须先用**真实** lastModified 查一次 tag cache，确认没失效才改。
// 同一请求内 D1 tag 查询有请求级缓存，OpenNext 随后的第二次判断不会再打 D1。

type IncrementalCache = Parameters<typeof withRegionalCache>[0];
type CacheEntry = NonNullable<Awaited<ReturnType<IncrementalCache['get']>>>;

export type NextModeTagCache = {
  mode?: string;
  hasBeenRevalidated(tags: string[], lastModified?: number): Promise<boolean>;
  isStale?(tags: string[], lastModified?: number): Promise<boolean>;
};

// 与 OpenNext fixISRHeaders 的 SWR 值保持一致（30 天）
const STALE_WHILE_REVALIDATE_SECONDS = 60 * 60 * 24 * 30;
const NEXT_CACHE_TAGS_HEADER = 'x-next-cache-tags';

type IsrValue = {
  type?: string;
  revalidate?: number | false;
  meta?: { headers?: Record<string, unknown> } & Record<string, unknown>;
} & Record<string, unknown>;

function findHeader(headers: Record<string, unknown>, name: string): unknown {
  const key = Object.keys(headers).find((item) => item.toLowerCase() === name);
  return key === undefined ? undefined : headers[key];
}

function readTags(headers: Record<string, unknown>): string[] {
  const raw = findHeader(headers, NEXT_CACHE_TAGS_HEADER);
  return typeof raw === 'string' ? raw.split(',').filter(Boolean) : [];
}

async function isInvalidatedByTags(
  tagCache: NextModeTagCache | undefined,
  tags: string[],
  lastModified: number,
): Promise<boolean> {
  if (tags.length === 0) return false;
  // 非 next-mode（或拿不到 tag cache）无法用同一语义判断，保守起见不改条目
  if (!tagCache || tagCache.mode !== 'nextMode') return true;
  if (await tagCache.hasBeenRevalidated(tags, lastModified)) return true;
  return (await tagCache.isStale?.(tags, lastModified)) ?? false;
}

/** 按条目自带的 revalidate 修正时间新鲜度。导出供单测。 */
export async function applyStoredRevalidate<T extends CacheEntry>(
  entry: T,
  now: number,
  tagCache: NextModeTagCache | undefined,
): Promise<T> {
  const value = entry.value as IsrValue | undefined;
  if (!value || typeof value !== 'object') return entry;
  // 只处理 App Router 页面 / 路由处理器条目；redirect、SSG(revalidate=false) 不动
  if (value.type !== 'app' && value.type !== 'route') return entry;
  const { revalidate } = value;
  if (typeof revalidate !== 'number' || revalidate <= 0) return entry;
  const { lastModified } = entry;
  if (typeof lastModified !== 'number' || lastModified <= 0) return entry;

  const ageSeconds = (now - lastModified) / 1000;
  if (ageSeconds >= revalidate) return entry; // 真过期：交给 Next 走 SWR

  const headers = { ...(value.meta?.headers ?? {}) };
  if (!entry.shouldBypassTagCache && (await isInvalidatedByTags(tagCache, readTags(headers), lastModified))) {
    return entry;
  }

  // 路由处理器可能自带 Cache-Control（如 feed），尊重业务设置
  if (findHeader(headers, 'cache-control') === undefined) {
    const remaining = Math.max(1, Math.floor(revalidate - ageSeconds));
    headers['cache-control'] = `s-maxage=${remaining}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`;
  }

  return {
    ...entry,
    lastModified: now,
    value: { ...value, meta: { ...(value.meta ?? {}), headers } },
  };
}

function getGlobalTagCache(): NextModeTagCache | undefined {
  return (globalThis as { tagCache?: NextModeTagCache }).tagCache;
}

/**
 * 包装增量缓存：只改读出的副本（lastModified / 头），写入与删除透传。
 * `name` 必须透传：populateCache 按底层缓存名判断目标存储。
 */
export function withStoredRevalidate(
  store: IncrementalCache,
  getTagCache: () => NextModeTagCache | undefined = getGlobalTagCache,
): IncrementalCache {
  return {
    name: store.name,
    get: (async (key: string, cacheType?: 'cache' | 'fetch' | 'composable') => {
      const entry = await store.get(key, cacheType);
      if (!entry || (cacheType !== undefined && cacheType !== 'cache')) {
        return entry;
      }
      return applyStoredRevalidate(entry, Date.now(), getTagCache());
    }) as IncrementalCache['get'],
    set: (key, value, cacheType) => store.set(key, value, cacheType),
    delete: (key) => store.delete(key),
  };
}
