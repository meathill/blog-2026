import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';

// 本月保持关闭 R2 增量缓存。恢复前验证原生 ISR 的 86400s TTL 与 404 行为。
export default defineCloudflareConfig({
  incrementalCache: 'dummy',
  tagCache: 'dummy',
  queue: doQueue,
});
