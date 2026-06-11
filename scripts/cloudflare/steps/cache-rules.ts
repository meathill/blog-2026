// 步骤:wp-json 边缘缓存(TiDB 降载核心)
// - override_origin 完全无视 origin 的 no-store/private(官方文档已核实)
// - 排除带 authorization 头的请求(verifyAuth / context=edit),防认证响应入缓存
// - 4xx/5xx 不缓存(value: -1 = no-store),避免缓存住故障响应
// - cache key 默认含完整 query string,不同 wp-json 查询互不污染

import { BLOG_HOST } from '../lib/api.ts';
import { upsertZoneEntrypointRule } from '../lib/rulesets.ts';
import type { RulesetRule } from '../lib/types.ts';

// 4xx/5xx 缓存策略(wp-json 与 feed 共用):
// - 404 缓存 5 分钟:同一 URL 短时间内的重复 404 不再扫库
// - 401/403 绝不缓存:Access 拒绝页缓存住会把合法 Worker 一起挡掉
// - 405+/5xx 绝不缓存:故障响应不能被钉住
const ERROR_STATUS_TTL = [
  { status_code: 404, value: 300 },
  { status_code_range: { from: 400, to: 403 }, value: -1 },
  { status_code_range: { from: 405 }, value: -1 },
];

// TTL 24h:wp-json 流量全部来自 Worker 渲染,长尾 URL(每篇 slug、每个 tag/分类页)
// 重访间隔远大于短 TTL,600s 时几乎全 MISS;24h 让每个唯一 URL 每天最多回源一次。
// 时效性靠发布时 purge(见 DEV_NOTE),不靠 TTL。
export const CACHE_RULE: RulesetRule = {
  ref: 'blog2026_wpjson_edge_cache',
  description: 'blog-2026: wp-json 读端点边缘缓存 24h(TiDB 降载,发布时 purge)',
  expression: `(http.host eq "${BLOG_HOST}" and starts_with(http.request.uri.path, "/wp-json/") and not any(http.request.headers.names[*] == "authorization"))`,
  action: 'set_cache_settings',
  action_parameters: {
    cache: true,
    edge_ttl: {
      mode: 'override_origin',
      default: 86400,
      status_code_ttl: ERROR_STATUS_TTL,
    },
    browser_ttl: { mode: 'respect_origin' },
  },
};

// RSS 阅读器(FreshRSS 等)仍订阅 blog.meathill.com/feed 老地址直连源站
//(实测 4h 138 次回源,每次都是全量 WP 渲染)。TTL 30d:feed 内容只在发文时变化,
// 而 purge-on-publish 发文时会清掉整个边缘缓存,所以长 TTL 没有时效代价。
export const FEED_CACHE_RULE: RulesetRule = {
  ref: 'blog2026_feed_edge_cache',
  description: 'blog-2026: feed 边缘缓存 30d(发文时 purge 自动刷新)',
  expression: `(http.host eq "${BLOG_HOST}" and ends_with(http.request.uri.path, "/feed"))`,
  action: 'set_cache_settings',
  action_parameters: {
    cache: true,
    edge_ttl: {
      mode: 'override_origin',
      default: 2592000,
      status_code_ttl: ERROR_STATUS_TTL,
    },
    browser_ttl: { mode: 'respect_origin' },
  },
};

export async function applyCacheRule(snapshotDir: string, dryRun: boolean): Promise<void> {
  await upsertZoneEntrypointRule({
    phase: 'http_request_cache_settings',
    rule: CACHE_RULE,
    snapshotDir,
    snapshotName: 'before-cache-settings',
    dryRun,
  });
  await upsertZoneEntrypointRule({
    phase: 'http_request_cache_settings',
    rule: FEED_CACHE_RULE,
    snapshotDir,
    snapshotName: 'before-cache-settings-feed',
    dryRun,
  });
  console.log(`
验证(二连发,第二次应 cf-cache-status: HIT):
  curl -sD- -o /dev/null 'https://${BLOG_HOST}/wp-json/wp/v2/posts?per_page=1' | grep -i cf-cache-status
若一直 BYPASS:检查响应是否带 Set-Cookie;fallback 见 README「缓存不生效」`);
}
