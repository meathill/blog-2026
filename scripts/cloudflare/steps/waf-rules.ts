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

// 漏洞扫描器在 meathill.com 上批量探测备份/配置文件(db.old、pg_dump.sql、.env.sh、
// about.php.bak……2026-06-11 实测 45 分钟 1214 个唯一垃圾路径),每个都会被 catch-all
// 路由放大成 2~3 个 WP/TiDB 查询且 URL 唯一、缓存无法吸收 → RU 尖刺。
// WAF 在 Worker 之前执行,在这里 403 = 零渲染零 DB。
// 注意:集合里不能放 xml/txt/js/css 等 meathill.com 的合法后缀。
export const SCANNER_RULE: RulesetRule = {
  ref: 'blog2026_mainsite_scanner_block',
  description: 'blog-2026: 拦截 meathill.com 上的扫描器特征路径(备份/配置文件后缀)',
  expression: `(http.host eq "meathill.com" and (http.request.uri.path.extension in {"php" "php7" "phtml" "sql" "bak" "old" "orig" "tmp" "swp" "sh" "rb" "py" "pl" "cgi" "asp" "aspx" "jsp" "log" "ini" "conf" "yml" "yaml" "env" "gz" "xz" "zst" "tar" "zip" "rar" "7z" "dump" "sqlite" "db"} or http.request.uri.path contains "/.git" or http.request.uri.path contains ".env" or starts_with(http.request.uri.path, "/wp-")))`,
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
  await upsertZoneEntrypointRule({
    phase: 'http_request_firewall_custom',
    rule: SCANNER_RULE,
    snapshotDir,
    snapshotName: 'before-firewall-custom-scanner',
    dryRun,
  });
  console.log(`
验证:
  curl -so /dev/null -w '%{http_code}\\n' https://${BLOG_HOST}/wp-content/plugins/akismet/readme.txt   # 应 403
  curl -so /dev/null -w '%{http_code}\\n' 'https://${BLOG_HOST}/wp-content/uploads/<真实图片路径>'      # 应 200`);
}
