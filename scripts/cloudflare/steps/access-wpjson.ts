// 步骤:Access 全量收口 /wp-json(风险最高,放最后)
// 目标形态:现有 app 的 destinations = blog.meathill.com/wp-json + blog.meathill.com/wp-json/*
//(Access 路径语义:`/wp-json/*` 不含父路径,所以要两条;官方文档已核实)
// 决策树:
//   Case A:1 个 app + Service Auth policy(non_identity + service_token)→ 只扩 destinations
//   Case B:有 bypass policy → 需 --confirm 删 bypass 后再扩
//   Case C:多个 app 分片 → 需 --app-id 指定主 app,其余人工处理
//   Case D:无 Service Auth policy → 中止(Worker 的 service token 对不上,先人工确认)
// 红线:destinations 不得覆盖整个 host、/feed*、/wp-content/uploads*(都是匿名 fetch 依赖)

import { ACCOUNT_ID, BLOG_HOST, cfDelete, cfGetAll, cfPut } from '../lib/api.ts';
import { saveSnapshot } from '../lib/snapshot.ts';
import type { AccessApp, AccessPolicy } from '../lib/types.ts';

const TARGET_DESTINATIONS = [
  { type: 'public', uri: `${BLOG_HOST}/wp-json` },
  { type: 'public', uri: `${BLOG_HOST}/wp-json/*` },
];

const READ_ONLY_FIELDS = ['id', 'uid', 'aud', 'created_at', 'updated_at', 'policies'] as const;

function appTouchesBlog(app: AccessApp): boolean {
  if (app.domain?.includes(BLOG_HOST)) return true;
  if (app.destinations?.some((destination) => destination.uri.includes(BLOG_HOST))) return true;
  if (app.self_hosted_domains?.some((domain) => domain.includes(BLOG_HOST))) return true;
  return false;
}

/** app 当前覆盖的 URI 列表(destinations 优先,旧字段兜底) */
function coveredUris(app: AccessApp): string[] {
  if (app.destinations?.length) return app.destinations.map((destination) => destination.uri);
  if (app.self_hosted_domains?.length) return app.self_hosted_domains;
  return app.domain ? [app.domain] : [];
}

function violatesRedLine(uris: string[]): string | null {
  for (const uri of uris) {
    const path = uri.replace(BLOG_HOST, '');
    if (path === '' || path === '/' || path === '/*') return `${uri} 覆盖整个 host`;
    if (path.includes('/feed')) return `${uri} 覆盖 feed(RSS 代理是匿名 fetch)`;
    if (path.includes('/wp-content')) return `${uri} 覆盖 wp-content(图片转码是匿名 fetch)`;
  }
  return null;
}

function hasServiceAuthPolicy(policies: AccessPolicy[]): boolean {
  return policies.some(
    (policy) =>
      policy.decision === 'non_identity' &&
      policy.include?.some((rule) => rule.service_token ?? rule.any_valid_service_token),
  );
}

function isTargetShape(uris: string[]): boolean {
  return uris.includes(`${BLOG_HOST}/wp-json`) && uris.includes(`${BLOG_HOST}/wp-json/*`);
}

export async function applyAccessWpjson(
  snapshotDir: string,
  dryRun: boolean,
  options: { appId?: string; confirm: boolean },
): Promise<void> {
  const apps = (await cfGetAll<AccessApp>(`/accounts/${ACCOUNT_ID}/access/apps`)).filter(appTouchesBlog);
  saveSnapshot(snapshotDir, 'before-access-apps', apps);
  if (apps.length === 0) {
    console.error('❌ 没有任何 Access app 覆盖 blog.meathill.com,与实测(wp-json 403)矛盾,中止');
    process.exit(1);
  }

  let app: AccessApp;
  if (apps.length > 1 && !options.appId) {
    console.error(`❌ Case C:${apps.length} 个 app 都涉及 ${BLOG_HOST},用 --app-id 指定主 app:`);
    for (const candidate of apps) {
      console.error(`  - id=${candidate.id} "${candidate.name}" 覆盖 ${JSON.stringify(coveredUris(candidate))}`);
    }
    process.exit(1);
  } else if (options.appId) {
    const found = apps.find((candidate) => candidate.id === options.appId || candidate.uid === options.appId);
    if (!found) {
      console.error(`❌ 找不到 app ${options.appId}`);
      process.exit(1);
    }
    app = found;
  } else {
    app = apps[0];
  }

  const appUid = app.uid ?? app.id;
  const policies =
    app.policies ?? (await cfGetAll<AccessPolicy>(`/accounts/${ACCOUNT_ID}/access/apps/${appUid}/policies`));
  saveSnapshot(snapshotDir, 'before-access-policies', policies);

  // Case D:没有 service token policy,收口会把 Worker 一起挡掉
  if (!hasServiceAuthPolicy(policies)) {
    console.error('❌ Case D:app 没有 Service Auth policy(decision=non_identity + service_token),中止。');
    console.error('   先人工确认 Worker secrets 的 CF_ACCESS_CLIENT_ID 对应哪个 service token,再建 policy。');
    process.exit(1);
  }

  // Case B:bypass policy 很可能就是读端点曾匿名 200 的原因
  const bypassPolicies = policies.filter((policy) => policy.decision === 'bypass');
  if (bypassPolicies.length > 0 && !options.confirm) {
    console.error(`❌ Case B:发现 ${bypassPolicies.length} 条 bypass policy,删除会改变匿名可访问性。`);
    for (const policy of bypassPolicies) {
      console.error(`  - "${policy.name}" include=${JSON.stringify(policy.include ?? [])}`);
    }
    console.error('   确认无误后加 --confirm 重跑(会删除以上 bypass)。');
    process.exit(1);
  }

  const currentUris = coveredUris(app);
  const violation = violatesRedLine(TARGET_DESTINATIONS.map((destination) => destination.uri));
  if (violation) {
    console.error(`❌ 红线:${violation}`);
    process.exit(1);
  }
  const extraUris = currentUris.filter((uri) => !uri.includes('/wp-json'));
  if (extraUris.length > 0) {
    console.error(`❌ app 还覆盖了 wp-json 之外的路径 ${JSON.stringify(extraUris)},不自动收敛,先人工确认`);
    process.exit(1);
  }

  if (isTargetShape(currentUris) && app.service_auth_401_redirect === true && bypassPolicies.length === 0) {
    console.log('✅ Access app 已是目标形态(全量 /wp-json + Service Auth + 401),无需改动');
    return;
  }

  console.log(`将更新 app "${app.name}"(${appUid}):`);
  console.log(
    `  destinations: ${JSON.stringify(currentUris)} → ${JSON.stringify(TARGET_DESTINATIONS.map((d) => d.uri))}`,
  );
  console.log(`  service_auth_401_redirect: ${app.service_auth_401_redirect ?? false} → true`);

  if (dryRun) {
    console.log('--dry-run:不执行');
    return;
  }

  for (const policy of bypassPolicies) {
    await cfDelete(`/accounts/${ACCOUNT_ID}/access/apps/${appUid}/policies/${policy.uid ?? policy.id}`);
    console.log(`🗑️ 已删 bypass policy "${policy.name}"`);
  }

  // PUT 全量字段(官方文档:先 GET 再 PUT 防丢字段),剔除只读字段,policy 以 id 引用
  const body: Record<string, unknown> = { ...app };
  for (const field of READ_ONLY_FIELDS) {
    delete body[field];
  }
  body.destinations = TARGET_DESTINATIONS;
  body.service_auth_401_redirect = true;
  body.policies = policies.filter((policy) => policy.decision !== 'bypass').map((policy) => policy.uid ?? policy.id);
  delete body.self_hosted_domains; // 与 destinations 二选一,destinations 优先

  await cfPut(`/accounts/${ACCOUNT_ID}/access/apps/${appUid}`, body);
  console.log(`✅ app 已更新。立即验证(失败立刻 rollback):
  curl -so /dev/null -w '%{http_code}\\n' 'https://${BLOG_HOST}/wp-json/wp/v2/posts?per_page=1'   # 匿名应 401/403
  curl -so /dev/null -w '%{http_code}\\n' https://meathill.com/                                    # 前台应 200
  回滚:node scripts/cloudflare/rollback.ts --step access --snapshot <本次快照目录>`);
}
