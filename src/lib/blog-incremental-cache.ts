import { Buffer } from 'node:buffer';
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';
import { rejectNotFoundCacheWrites, writeCacheWhenAllowed } from './cache-write-policy';
import { withStoredRevalidate } from './isr-freshness-cache';

export type IncrementalCache = Parameters<typeof withRegionalCache>[0];
const CACHE_NAME = 'blog-filtered-r2-incremental-cache';
// Next 流式 notFound 可能没有 status=404，所以通过本站 404 组件的明确标记识别。
const NOT_FOUND_MARKER = /<[a-z][^>]*\sdata-blog-not-found=(?:"true"|'true')[\s>]/i;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function isEmptyWordPressLookup(data: Record<string, unknown>): boolean {
  if (typeof data.url !== 'string' || typeof data.body !== 'string') return false;
  let url: URL;
  try {
    url = new URL(data.url);
  } catch {
    return false;
  }
  if (!/\/wp-json\/wp\/v2\/(posts|media|categories|tags)\/?$/.test(url.pathname)) {
    return false;
  }
  // slug 查询命中不存在的内容、以及深分页（page / offset）返回空列表时都不缓存：
  // 这类请求通常来自 404 页面或爬虫，缓存只会放大 R2 写入，没有复用价值。
  const hasSlugLookup = Boolean(url.searchParams.get('slug'));
  const hasPagination = url.searchParams.has('page') || url.searchParams.has('offset');
  if (!hasSlugLookup && !hasPagination) {
    return false;
  }
  // Next FETCH 条目使用 base64；也接受明文 JSON，便于兼容已有条目。
  for (const body of [data.body, Buffer.from(data.body, 'base64').toString('utf8')]) {
    try {
      const value: unknown = JSON.parse(body);
      if (Array.isArray(value) && value.length === 0) return true;
    } catch {
      // 非 JSON 的正常缓存条目不按空查询处理。
    }
  }
  return false;
}

export function isNotFoundCacheValue(value: unknown): boolean {
  const entry = asRecord(value);
  if (!entry) return false;
  if (asRecord(entry.meta)?.status === 404) return true;
  if (typeof entry.html === 'string' && NOT_FOUND_MARKER.test(entry.html)) return true;
  if (entry.kind === 'FETCH') {
    const data = asRecord(entry.data);
    return !!data && (data.status === 404 || isEmptyWordPressLookup(data));
  }
  return false;
}

export function withNotFoundCachePolicy(store: IncrementalCache): IncrementalCache {
  return {
    // CLI 的默认预填直接上传文件，不经过 set；使用独立名称跳过预填，按需生成后才允许写入。
    name: CACHE_NAME,
    get: (async (key, cacheType) => {
      const entry = await store.get(key, cacheType);
      return entry && isNotFoundCacheValue(entry.value) ? null : entry;
    }) as IncrementalCache['get'],
    set: async (key, value, cacheType) => {
      if (isNotFoundCacheValue(value)) {
        // fetch 的空查询可能有成功的页面回退，只跳过该条目；明确的 404 页面则拒绝本次待写入。
        if (cacheType !== 'fetch' && asRecord(value)?.kind !== 'FETCH') rejectNotFoundCacheWrites();
        return;
      }
      await writeCacheWhenAllowed(() => store.set(key, value, cacheType));
    },
    delete: (key) => store.delete(key),
  };
}

// 恢复时使用此唯一入口：策略包在区域缓存外，404 连区域缓存也不写，R2 更不会收到 put。
// 读取时恢复 Next 的路由 TTL，保留真实时间戳及原生过期/tag 失效语义。
export function createBlogIncrementalCache(store: IncrementalCache): IncrementalCache {
  return withStoredRevalidate(
    withNotFoundCachePolicy(
      withRegionalCache(store, {
        mode: 'long-lived',
        shouldLazilyUpdateOnCacheHit: true,
      }),
    ),
  );
}
