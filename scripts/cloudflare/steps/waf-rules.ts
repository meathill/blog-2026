// 步骤:收紧 wp-content —— block 非 uploads 的 /wp-content/*(插件/主题探测面)
// ⚠️ 必须保留 /wp-content/uploads/*:meathill.com 文章封面经 /cdn-cgi/image/ 拉取
// ⚠️ 若将来要用 wp-admin 后台,需先撤掉本规则(后台依赖 plugins/includes 静态资源)

import { BLOG_HOST } from '../lib/api.ts';
import { upsertZoneEntrypointRule } from '../lib/rulesets.ts';
import type { RulesetRule } from '../lib/types.ts';

export const WAF_RULE: RulesetRule = {
  ref: 'blog2026_wpcontent_lockdown',
  description: 'blog-2026: 拦截非 uploads 的 wp-content 探测',
  expression: `(http.host eq "${BLOG_HOST}" and starts_with(http.request.uri.path, "/wp-content/") and not starts_with(http.request.uri.path, "/wp-content/uploads/"))`,
  action: 'block',
};

export async function applyWafRule(snapshotDir: string, dryRun: boolean): Promise<void> {
  await upsertZoneEntrypointRule({
    phase: 'http_request_firewall_custom',
    rule: WAF_RULE,
    snapshotDir,
    snapshotName: 'before-firewall-custom',
    dryRun,
  });
  console.log(`
验证:
  curl -so /dev/null -w '%{http_code}\\n' https://${BLOG_HOST}/wp-content/plugins/akismet/readme.txt   # 应 403
  curl -so /dev/null -w '%{http_code}\\n' 'https://${BLOG_HOST}/wp-content/uploads/<真实图片路径>'      # 应 200`);
}
