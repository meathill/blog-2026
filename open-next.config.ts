import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';
import d1TagCache from '@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache';
import { createBlogIncrementalCache } from './src/lib/blog-incremental-cache';

// 恢复 R2 增量缓存（Issue #17）：404 过滤 + 请求级写入门禁，避免 R2 Class A 超额；
// 读取缓存时恢复 Next 路由 TTL，不改 lastModified，保留原生过期与 tag 失效语义。
const config = defineCloudflareConfig({
  incrementalCache: createBlogIncrementalCache(r2IncrementalCache),
  queue: doQueue,
  tagCache: d1TagCache,
  // Next 16.3 / OpenNext prefetch loop：upstream cloudflare#1348 / aws#1212，继续关闭。
  enableCacheInterception: false,
});

// Cloudflare 的配置会额外编译为 edge 产物；这些由 nodejs_compat 提供，不能作为浏览器包解析。
config.edgeExternals = [...(config.edgeExternals ?? []), 'node:async_hooks', 'node:buffer'];
export default config;
