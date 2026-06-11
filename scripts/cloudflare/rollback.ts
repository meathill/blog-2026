// 回滚:把 apply 落盘的 before 快照原样 PUT 回去
// 用法:
//   node scripts/cloudflare/rollback.ts --step cache|waf|redirect|access --snapshot <快照目录名或绝对路径>

import { ACCOUNT_ID, cfPut, getZoneId } from './lib/api.ts';
import { sanitizeRule } from './lib/rulesets.ts';
import { loadSnapshot } from './lib/snapshot.ts';
import type { AccessApp, AccessPolicy, Ruleset } from './lib/types.ts';

const STEP_TO_SNAPSHOT: Record<string, { name: string; phase?: string }> = {
  cache: { name: 'before-cache-settings', phase: 'http_request_cache_settings' },
  waf: { name: 'before-firewall-custom', phase: 'http_request_firewall_custom' },
  redirect: { name: 'before-dynamic-redirect', phase: 'http_request_dynamic_redirect' },
  access: { name: 'before-access-apps' },
};

const APP_READ_ONLY_FIELDS = ['id', 'uid', 'aud', 'created_at', 'updated_at', 'policies'] as const;

async function rollbackRuleset(snapshotDir: string, snapshotName: string, phase: string): Promise<void> {
  const zoneId = await getZoneId();
  const snapshot = loadSnapshot<Ruleset | { phase: string; rules: [] }>(snapshotDir, snapshotName);
  const rules = (snapshot.rules ?? []).map(sanitizeRule);
  await cfPut(`/zones/${zoneId}/rulesets/phases/${phase}/entrypoint`, { rules });
  console.log(`✅ ${phase} 已恢复为快照状态(${rules.length} 条规则)`);
}

async function rollbackAccess(snapshotDir: string): Promise<void> {
  const apps = loadSnapshot<AccessApp[]>(snapshotDir, 'before-access-apps');
  const policies = loadSnapshot<AccessPolicy[]>(snapshotDir, 'before-access-policies');
  for (const app of apps) {
    const appUid = app.uid ?? app.id;
    const body: Record<string, unknown> = { ...app };
    for (const field of APP_READ_ONLY_FIELDS) {
      delete body[field];
    }
    // 快照里的 policy 原样按 id 挂回(被删的 bypass 无法自动重建,需人工在 dashboard 重配)
    const appPolicies = app.policies ?? policies;
    body.policies = appPolicies.map((policy) => policy.uid ?? policy.id);
    await cfPut(`/accounts/${ACCOUNT_ID}/access/apps/${appUid}`, body);
    console.log(`✅ Access app "${app.name}"(${appUid})已恢复为快照状态`);
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let step = '';
  let snapshotDir = '';
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--step') step = argv[++index] ?? '';
    else if (argv[index] === '--snapshot') snapshotDir = argv[++index] ?? '';
  }
  const config = STEP_TO_SNAPSHOT[step];
  if (!config || !snapshotDir) {
    console.error('用法:node scripts/cloudflare/rollback.ts --step cache|waf|redirect|access --snapshot <目录>');
    process.exit(1);
  }
  if (step === 'access') {
    await rollbackAccess(snapshotDir);
  } else if (config.phase) {
    await rollbackRuleset(snapshotDir, config.name, config.phase);
  }
}

await main();
