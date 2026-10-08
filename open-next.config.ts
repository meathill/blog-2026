import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';

export default defineCloudflareConfig({
  // 2026-10-08：本月 R2 Class A 免费额度已用完，临时禁用 ISR / fetch 增量缓存。
  // 配合 wrangler 移除 site-cache 绑定；整页 Workers Cache 仍由 worker.ts 控制。
  // 恢复前先修复高频 404 缓存写入，再恢复 R2 + 区域缓存 + withStoredRevalidate。
  incrementalCache: 'dummy',
  queue: doQueue,
  // 无增量缓存时停用 tag store；D1 绑定保留，整页缓存仍由发布流程 purge。
  tagCache: 'dummy',
  // issue #12：Next 16.3 + OpenNext `_rsc` prefetch loop 会打爆 Worker 请求数，
  // upstream opennextjs-cloudflare#1348 / opennextjs-aws#1212，cache interception 先保持关闭。
  enableCacheInterception: false,
});
