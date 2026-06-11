// zone 级 phase entrypoint 的幂等 upsert
// ⚠️ PUT entrypoint 会替换整个 rules 数组(官方文档红字警告),
//    所以流程恒为:GET → 按 ref 合并 → PUT 全量(其余规则原样带回)

import { cfGetOrNull, cfPut, getZoneId } from './api.ts';
import { saveSnapshot } from './snapshot.ts';
import type { Ruleset, RulesetRule } from './types.ts';

/** PUT 时每条规则只带 API 接受的字段(去掉 version/last_updated 等只读字段) */
export function sanitizeRule(rule: RulesetRule): RulesetRule {
  const sanitized: RulesetRule = {
    expression: rule.expression,
    action: rule.action,
  };
  if (rule.id) sanitized.id = rule.id;
  if (rule.ref) sanitized.ref = rule.ref;
  if (rule.description) sanitized.description = rule.description;
  if (rule.enabled !== undefined) sanitized.enabled = rule.enabled;
  if (rule.action_parameters) sanitized.action_parameters = rule.action_parameters;
  return sanitized;
}

export async function getZoneEntrypoint(phase: string): Promise<Ruleset | null> {
  const zoneId = await getZoneId();
  return cfGetOrNull<Ruleset>(`/zones/${zoneId}/rulesets/phases/${phase}/entrypoint`);
}

interface UpsertOptions {
  phase: string;
  rule: RulesetRule;
  snapshotDir: string;
  snapshotName: string;
  dryRun: boolean;
}

/** 按 ref 在 entrypoint 中新增或原位替换一条规则,返回是否实际写入 */
export async function upsertZoneEntrypointRule(options: UpsertOptions): Promise<boolean> {
  const { phase, rule, snapshotDir, snapshotName, dryRun } = options;
  if (!rule.ref) {
    throw new Error('upsert 规则必须带 ref 以保证幂等');
  }

  const zoneId = await getZoneId();
  const entrypoint = await getZoneEntrypoint(phase);
  const existingRules = entrypoint?.rules ?? [];
  saveSnapshot(snapshotDir, snapshotName, entrypoint ?? { phase, rules: [] });

  const index = existingRules.findIndex((item) => item.ref === rule.ref);
  const nextRules = existingRules.map(sanitizeRule);
  if (index >= 0) {
    const current = existingRules[index];
    if (
      current.expression === rule.expression &&
      JSON.stringify(current.action_parameters ?? null) === JSON.stringify(rule.action_parameters ?? null)
    ) {
      console.log(`✅ 规则 ${rule.ref} 已是目标形态,无需改动`);
      return false;
    }
    nextRules[index] = { ...sanitizeRule(rule), id: existingRules[index].id };
    console.log(`♻️ 将原位更新规则 ${rule.ref}(规则 id ${existingRules[index].id})`);
  } else {
    nextRules.push(sanitizeRule(rule));
    console.log(`➕ 将追加规则 ${rule.ref}(entrypoint 现有 ${existingRules.length} 条规则,全部原样带回)`);
  }

  if (dryRun) {
    console.log('--dry-run:将 PUT 的 rules 数组如下');
    console.log(JSON.stringify(nextRules, null, 2));
    return false;
  }

  const updated = await cfPut<Ruleset>(`/zones/${zoneId}/rulesets/phases/${phase}/entrypoint`, {
    rules: nextRules,
  });
  console.log(`✅ ${phase} entrypoint 已更新,现有 ${updated.rules?.length ?? 0} 条规则`);
  return true;
}
