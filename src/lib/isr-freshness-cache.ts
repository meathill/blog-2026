import type { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';

export type IncrementalCache = Parameters<typeof withRegionalCache>[0];
type CacheEntryLike = { value?: unknown; lastModified?: number };
type RouteCacheControl = { revalidate: number | false; expire?: number };
export type RouteCacheControls = {
  get(route: string): RouteCacheControl | undefined;
  set(route: string, control: RouteCacheControl): void;
};

// OpenNext 从 R2 恢复页面时没有恢复 Next 的路由 TTL。冷实例的按需路径不在
// prerender manifest 中，calculateRevalidate 因而回退为 1 秒并反复重建。
// 使用当前 Next 实例的配置表，避免导入另一个打包副本的 SharedCacheControls。
function getRouteCacheControls(): RouteCacheControls | undefined {
  return (globalThis as { __incrementalCache?: { cacheControls?: RouteCacheControls } }).__incrementalCache
    ?.cacheControls;
}

export function restoreStoredRevalidate(
  key: string,
  entry: CacheEntryLike,
  controls: RouteCacheControls | undefined,
): void {
  if (!controls || !entry.value || typeof entry.value !== 'object') return;
  const value = entry.value as { type?: string; revalidate?: unknown };
  if (!['app', 'page', 'route', 'redirect'].includes(value.type ?? '')) return;
  const { revalidate } = value;
  if (revalidate !== false && (typeof revalidate !== 'number' || !Number.isFinite(revalidate) || revalidate < 0)) {
    return;
  }
  const route = key.replace(/(?:\/index)?\/?$/, '') || '/';
  // 当前 manifest / 已生成路由的配置优先，保留 expire 等 Next 原生设置。
  if (controls.get(route) === undefined) controls.set(route, { revalidate });
}

export function withStoredRevalidate(
  store: IncrementalCache,
  getControls: () => RouteCacheControls | undefined = getRouteCacheControls,
): IncrementalCache {
  return {
    name: store.name,
    get: (async (key: string, cacheType?: 'cache' | 'fetch' | 'composable') => {
      const entry = await store.get(key, cacheType);
      if (entry && (cacheType === undefined || cacheType === 'cache')) {
        restoreStoredRevalidate(key, entry, getControls());
      }
      // 不修改时间戳或响应头；过期、tag 失效和剩余 TTL 由 Next / OpenNext 原生处理。
      return entry;
    }) as IncrementalCache['get'],
    set: (key, value, cacheType) => store.set(key, value, cacheType),
    delete: (key) => store.delete(key),
  };
}
