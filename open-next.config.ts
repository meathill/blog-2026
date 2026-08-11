import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import d1TagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';

export default defineCloudflareConfig({
  // 区域缓存(Cache API)挡在 R2 前,热命中免跨区域读 R2;不设 bypassTagCacheOnCacheHit,
  // 命中时仍查 D1 tag cache,revalidateTag/revalidatePath 语义不变。
  // free plan 无按 tag purge,不配 cachePurge;发布流程的 purge_everything 会一并清区域缓存。
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: 'long-lived',
    shouldLazilyUpdateOnCacheHit: true,
  }),
  queue: doQueue,
  tagCache: d1TagCache,
  enableCacheInterception: true,
});
