// 步骤:wp-json 边缘缓存(TiDB 降载核心)
// - override_origin 完全无视 origin 的 no-store/private(官方文档已核实)
// - 排除带 authorization 头的请求(verifyAuth / context=edit),防认证响应入缓存
// - 4xx/5xx 不缓存(value: -1 = no-store),避免缓存住故障响应
// - cache key 默认含完整 query string,不同 wp-json 查询互不污染

import { BLOG_HOST } from '../lib/api.ts';
import { upsertZoneEntrypointRule } from '../lib/rulesets.ts';
import type { RulesetRule } from '../lib/types.ts';

export const CACHE_RULE: RulesetRule = {
  ref: 'blog2026_wpjson_edge_cache',
  description: 'blog-2026: wp-json 读端点边缘缓存 600s(TiDB 降载)',
  expression: `(http.host eq "${BLOG_HOST}" and starts_with(http.request.uri.path, "/wp-json/") and not any(http.request.headers.names[*] == "authorization"))`,
  action: 'set_cache_settings',
  action_parameters: {
    cache: true,
    edge_ttl: {
      mode: 'override_origin',
      default: 600,
      status_code_ttl: [{ status_code_range: { from: 400 }, value: -1 }],
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
  console.log(`
验证(二连发,第二次应 cf-cache-status: HIT):
  curl -sD- -o /dev/null 'https://${BLOG_HOST}/wp-json/wp/v2/posts?per_page=1' | grep -i cf-cache-status
若一直 BYPASS:检查响应是否带 Set-Cookie;fallback 见 README「缓存不生效」`);
}
