// 步骤:边缘 feed 例外 —— 修复 meathill.com/feed(自 2026-06-05 起 500)
// 对现有 blog→meathill 的 Single Redirect 规则原位 PATCH,
// 包裹 `and not ends_with(path, "/feed"|"/feed/")`,只动这一条,其余规则零接触。
// 若 inventory 显示 301 是 Bulk Redirects / Page Rules 实现 → 本步骤会中止,需另行处理。

import { cfPatch, getZoneId } from '../lib/api.ts';
import { getZoneEntrypoint, sanitizeRule } from '../lib/rulesets.ts';
import { saveSnapshot } from '../lib/snapshot.ts';
import type { RulesetRule } from '../lib/types.ts';

const PHASE = 'http_request_dynamic_redirect';
const FEED_EXCEPTION =
  ' and not (ends_with(http.request.uri.path, "/feed") or ends_with(http.request.uri.path, "/feed/"))';

export async function applyRedirectFix(snapshotDir: string, dryRun: boolean, ruleId?: string): Promise<void> {
  const zoneId = await getZoneId();
  const entrypoint = await getZoneEntrypoint(PHASE);
  if (!entrypoint?.rules?.length) {
    console.error('❌ zone 级 Single Redirects 为空:现有 301 不是 Single Redirect 实现,先看 inventory 输出');
    process.exit(1);
  }
  saveSnapshot(snapshotDir, 'before-dynamic-redirect', entrypoint);

  const candidates = entrypoint.rules.filter(
    (rule) => rule.action === 'redirect' && rule.expression.includes('blog.meathill.com'),
  );
  let target: RulesetRule | undefined;
  if (ruleId) {
    target = entrypoint.rules.find((rule) => rule.id === ruleId);
    if (!target) {
      console.error(`❌ 找不到规则 id ${ruleId}`);
      process.exit(1);
    }
  } else if (candidates.length === 1) {
    target = candidates[0];
  } else {
    console.error(`❌ 涉及 blog.meathill.com 的 redirect 规则有 ${candidates.length} 条,用 --rule-id 指定要改哪条:`);
    for (const rule of candidates) {
      console.error(`  - id=${rule.id} ${rule.description ?? ''}\n    ${rule.expression}`);
    }
    process.exit(1);
  }

  if (target.expression.includes('"/feed"')) {
    console.log('✅ 规则已包含 feed 例外,无需改动');
    return;
  }

  const patched = sanitizeRule(target);
  patched.expression = `(${target.expression})${FEED_EXCEPTION}`;
  delete patched.id; // PATCH 的 rule id 在 URL 里,body 不需要

  if (dryRun) {
    console.log(`--dry-run:将 PATCH 规则 ${target.id},新表达式:\n${patched.expression}`);
    return;
  }

  await cfPatch(`/zones/${zoneId}/rulesets/${entrypoint.id}/rules/${target.id}`, patched);
  console.log(`✅ 规则 ${target.id} 已加 feed 例外`);
  console.log(`
验证:
  curl -sI https://blog.meathill.com/feed/ | head -3        # 应 200/301(WP canonical),不再 301 去 meathill
  curl -so /dev/null -w '%{http_code}\\n' https://meathill.com/feed   # 应恢复 200
  curl -sI https://blog.meathill.com/about | grep -i location        # 其他路径应仍 301 到 meathill.com`);
}
