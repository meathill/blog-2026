import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import d1TagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';
import { createBlogIncrementalCache } from './src/lib/blog-incremental-cache';

// 本月 R2 Class A 额度已用完，保持关闭。恢复还需重新绑定 site-cache；不会自动恢复。
const R2_CACHE_ENABLED = false;

const config = defineCloudflareConfig({
  // 恢复后也必须走 404 过滤与请求级写入门禁，不能直接接原始 R2 adapter。
  incrementalCache: R2_CACHE_ENABLED ? createBlogIncrementalCache(r2IncrementalCache) : 'dummy',
  queue: doQueue,
  tagCache: R2_CACHE_ENABLED ? d1TagCache : 'dummy',
  // Next 16.3 / OpenNext prefetch loop：upstream cloudflare#1348 / aws#1212，继续关闭。
  enableCacheInterception: false,
});

// Cloudflare 的配置会额外编译为 edge 产物；这些由 nodejs_compat 提供，不能作为浏览器包解析。
config.edgeExternals = [...(config.edgeExternals ?? []), 'node:async_hooks', 'node:buffer'];
export default config;
