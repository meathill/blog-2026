// 统一入口:按步骤应用 Cloudflare 配置(每步自动落 before 快照)
// 用法:
//   CLOUDFLARE_API_TOKEN=xxx node scripts/cloudflare/apply.ts --step cache [--dry-run]
//   --step cache     wp-json 边缘缓存 600s
//   --step waf       block 非 uploads 的 /wp-content/*
//   --step redirect  feed 例外(修 RSS),可配 --rule-id <id>
//   --step access    /wp-json 全量收口进 Access,可配 --app-id <id> --confirm
// 实施顺序与验证见 README.md;回滚用 rollback.ts

import { applyAccessWpjson } from './steps/access-wpjson.ts';
import { applyCacheRule } from './steps/cache-rules.ts';
import { applyRedirectFix } from './steps/redirect-fix.ts';
import { applyWafRule } from './steps/waf-rules.ts';
import { createSnapshotDir } from './lib/snapshot.ts';

interface CliOptions {
  step: string;
  dryRun: boolean;
  confirm: boolean;
  ruleId?: string;
  appId?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { step: '', dryRun: false, confirm: false };
  for (let index = 0; index < argv.length; index += 1) {
    switch (argv[index]) {
      case '--step':
        options.step = argv[++index] ?? '';
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--confirm':
        options.confirm = true;
        break;
      case '--rule-id':
        options.ruleId = argv[++index];
        break;
      case '--app-id':
        options.appId = argv[++index];
        break;
      default:
        console.error(`未知参数:${argv[index]}`);
        process.exit(1);
    }
  }
  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!['cache', 'waf', 'redirect', 'access'].includes(options.step)) {
    console.error('用法:node scripts/cloudflare/apply.ts --step cache|waf|redirect|access [--dry-run]');
    process.exit(1);
  }

  const snapshotDir = createSnapshotDir(options.step);
  switch (options.step) {
    case 'cache':
      await applyCacheRule(snapshotDir, options.dryRun);
      break;
    case 'waf':
      await applyWafRule(snapshotDir, options.dryRun);
      break;
    case 'redirect':
      await applyRedirectFix(snapshotDir, options.dryRun, options.ruleId);
      break;
    case 'access':
      await applyAccessWpjson(snapshotDir, options.dryRun, {
        appId: options.appId,
        confirm: options.confirm,
      });
      break;
  }
}

await main();
