// 只读盘点:改任何东西之前先看清现状
// 运行:CLOUDFLARE_API_TOKEN=xxx node scripts/cloudflare/inventory.ts
// 输出:控制台摘要 + snapshots/<时间戳>-inventory/ 完整 JSON

import { ACCOUNT_ID, BLOG_HOST, cfGet, cfGetAll, cfGetOrNull, getZoneId } from './lib/api.ts';
import { createSnapshotDir, saveSnapshot } from './lib/snapshot.ts';
import type {
  AccessApp,
  AccessPolicy,
  BulkRedirectItem,
  BulkRedirectList,
  PageRule,
  Ruleset,
  ServiceToken,
  TieredCacheSetting,
} from './lib/types.ts';

const ZONE_PHASES = [
  'http_request_dynamic_redirect', // Single Redirects(所有阶段最前)
  'http_request_firewall_custom', // WAF 自定义规则
  'http_request_cache_settings', // Cache Rules
];

function appTouchesBlog(app: AccessApp): boolean {
  if (app.domain?.includes(BLOG_HOST)) return true;
  if (app.destinations?.some((destination) => destination.uri.includes(BLOG_HOST))) return true;
  if (app.self_hosted_domains?.some((domain) => domain.includes(BLOG_HOST))) return true;
  return false;
}

function summarizeRuleset(name: string, ruleset: Ruleset | null): void {
  console.log(`\n## ${name}`);
  if (!ruleset || !ruleset.rules?.length) {
    console.log('  (无 entrypoint 或规则为空)');
    return;
  }
  console.log(`  ruleset id: ${ruleset.id},共 ${ruleset.rules.length} 条`);
  for (const rule of ruleset.rules) {
    const blogFlag = rule.expression.includes(BLOG_HOST) ? ' ⭐blog' : '';
    const expression = rule.expression.length > 120 ? `${rule.expression.slice(0, 120)}…` : rule.expression;
    console.log(`  - [${rule.action}]${blogFlag} id=${rule.id} ref=${rule.ref ?? '-'} ${rule.description ?? ''}`);
    console.log(`      ${expression}`);
    if (rule.action_parameters) {
      console.log(`      params: ${JSON.stringify(rule.action_parameters)}`);
    }
  }
}

async function main(): Promise<void> {
  const zoneId = await getZoneId();
  const dir = createSnapshotDir('inventory');
  console.log(`zone ${zoneId}\n`);
  console.log('=== Cloudflare 现状盘点(只读)===');

  // 1) zone 级三个 phase entrypoint
  for (const phase of ZONE_PHASES) {
    const entrypoint = await cfGetOrNull<Ruleset>(`/zones/${zoneId}/rulesets/phases/${phase}/entrypoint`);
    saveSnapshot(dir, phase, entrypoint);
    summarizeRuleset(phase, entrypoint);
  }

  // 2) 旧版 Page Rules
  const pageRules = await cfGet<PageRule[]>(`/zones/${zoneId}/pagerules`);
  saveSnapshot(dir, 'pagerules', pageRules);
  console.log(`\n## Page Rules(legacy):${pageRules.length} 条`);
  for (const pageRule of pageRules) {
    const target = pageRule.targets[0]?.constraint.value ?? '?';
    console.log(`  - [${pageRule.status}] ${target} → ${JSON.stringify(pageRule.actions)}`);
  }

  // 3) 账号级 Bulk Redirects
  const bulkEntrypoint = await cfGetOrNull<Ruleset>(
    `/accounts/${ACCOUNT_ID}/rulesets/phases/http_request_redirect/entrypoint`,
  );
  saveSnapshot(dir, 'bulk-redirect-entrypoint', bulkEntrypoint);
  summarizeRuleset('Bulk Redirects(账号级 http_request_redirect)', bulkEntrypoint);
  const lists = await cfGet<BulkRedirectList[]>(`/accounts/${ACCOUNT_ID}/rules/lists`);
  const redirectLists = lists.filter((list) => list.kind === 'redirect');
  saveSnapshot(dir, 'redirect-lists', redirectLists);
  for (const list of redirectLists) {
    const items = await cfGetAll<BulkRedirectItem>(`/accounts/${ACCOUNT_ID}/rules/lists/${list.id}/items`);
    saveSnapshot(dir, `redirect-list-items-${list.name}`, items);
    const blogItems = items.filter((item) => item.redirect?.source_url.includes(BLOG_HOST));
    console.log(`  list "${list.name}":${items.length} 条,其中 ${blogItems.length} 条涉及 ${BLOG_HOST}`);
    for (const item of blogItems.slice(0, 10)) {
      const redirect = item.redirect;
      if (redirect) {
        console.log(
          `    - ${redirect.source_url} → ${redirect.target_url} (${redirect.status_code ?? 301}, subpath=${redirect.subpath_matching ?? false}, suffix=${redirect.preserve_path_suffix ?? false})`,
        );
      }
    }
  }

  // 4) Access apps(只看涉及 blog.meathill.com 的)+ 各自 policies
  const apps = await cfGetAll<AccessApp>(`/accounts/${ACCOUNT_ID}/access/apps`);
  const blogApps = apps.filter(appTouchesBlog);
  saveSnapshot(dir, 'access-apps-blog', blogApps);
  console.log(`\n## Access apps:共 ${apps.length} 个,涉及 ${BLOG_HOST} 的 ${blogApps.length} 个`);
  for (const app of blogApps) {
    console.log(`  - "${app.name}" id=${app.id} type=${app.type} aud=${app.aud?.slice(0, 16)}…`);
    console.log(`    domain: ${app.domain ?? '-'}`);
    console.log(`    destinations: ${JSON.stringify(app.destinations ?? app.self_hosted_domains ?? [])}`);
    console.log(`    service_auth_401_redirect: ${app.service_auth_401_redirect ?? false}`);
    const appUid = app.uid ?? app.id;
    const policies =
      app.policies ?? (await cfGetAll<AccessPolicy>(`/accounts/${ACCOUNT_ID}/access/apps/${appUid}/policies`));
    saveSnapshot(dir, `access-policies-${appUid}`, policies);
    for (const policy of policies) {
      console.log(
        `    policy "${policy.name ?? '-'}" decision=${policy.decision} include=${JSON.stringify(policy.include ?? [])}`,
      );
    }
  }

  // 5) Service tokens(名称与 client_id,secret 拿不到)
  const tokens = await cfGetAll<ServiceToken>(`/accounts/${ACCOUNT_ID}/access/service_tokens`);
  saveSnapshot(dir, 'service-tokens', tokens);
  console.log(`\n## Access service tokens:${tokens.length} 个`);
  for (const token of tokens) {
    console.log(`  - "${token.name}" client_id=${token.client_id} expires_at=${token.expires_at ?? '-'}`);
  }

  // 6) Smart Tiered Cache
  const tieredCache = await cfGetOrNull<TieredCacheSetting>(
    `/zones/${zoneId}/cache/tiered_cache_smart_topology_enable`,
  );
  saveSnapshot(dir, 'tiered-cache', tieredCache);
  console.log(`\n## Smart Tiered Cache:${tieredCache?.value ?? '未知'}`);

  console.log(`\n盘点完成,完整 JSON 在 ${dir}`);
}

await main();
