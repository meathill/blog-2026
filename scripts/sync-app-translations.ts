#!/usr/bin/env npx tsx

/**
 * 将 scripts/app-translations-en.ts 中的英文翻译 upsert 进 app_translations 表（locale = 'en'）。
 *
 * 使用方法：
 *   pnpm sync:app-translations            # 本地 + 远程 D1 都写
 *   pnpm sync:app-translations -- --slug=muicv   # 只导入指定 app
 *   pnpm sync:app-translations -- --remote-only  # 跳过本地
 *
 * 说明：
 *   - 按 slug 反查 apps.id（本地与远程各查一次），app 不存在则跳过并提示；
 *   - 依赖 app_translations 的 UNIQUE(app_id, locale) 约束做 upsert；
 *   - 远程写入需要 wrangler 已登录且有 DB 写权限。
 */

import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { writeFileSync, unlinkSync } from 'node:fs';
import { APP_TRANSLATIONS_EN } from './app-translations-en';

interface AppRow {
  id: string;
  slug: string;
}

function escapeSQL(value: string | null): string {
  if (value === null) return 'NULL';
  return `'${value.replace(/'/g, "''")}'`;
}

function run(cmd: string): string {
  console.log(`> ${cmd}`);
  return execSync(cmd, { encoding: 'utf-8' });
}

function fetchAppIdMap(target: '--local' | '--remote'): Map<string, string> {
  const result = run(`npx wrangler d1 execute DB ${target} --command "SELECT id, slug FROM apps" --json`);
  const rows: AppRow[] = JSON.parse(result)[0]?.results ?? [];
  return new Map(rows.map((row) => [row.slug, row.id]));
}

function upsertSQL(appId: string, slug: string, now: number): string {
  const item = APP_TRANSLATIONS_EN.find((t) => t.slug === slug)!;
  return `
    INSERT INTO app_translations (id, app_id, locale, name, description, content, created_at, updated_at)
    VALUES (
      ${escapeSQL(randomUUID())},
      ${escapeSQL(appId)},
      'en',
      ${escapeSQL(item.name)},
      ${escapeSQL(item.description)},
      ${escapeSQL(item.content)},
      ${now},
      ${now}
    )
    ON CONFLICT(app_id, locale) DO UPDATE SET
      name=excluded.name,
      description=excluded.description,
      content=excluded.content,
      updated_at=excluded.updated_at;
  `;
}

function applyTranslations(target: '--local' | '--remote', slugs: string[]) {
  console.log(`\n📡 目标：${target}`);
  const idMap = fetchAppIdMap(target);
  const now = Date.now();
  let ok = 0;
  let skipped = 0;

  for (const slug of slugs) {
    const appId = idMap.get(slug);
    if (!appId) {
      console.warn(`⚠️  ${target} 中未找到 slug "${slug}"，跳过`);
      skipped += 1;
      continue;
    }
    const tempFile = '.temp_app_translation.sql';
    writeFileSync(tempFile, upsertSQL(appId, slug, now));
    try {
      run(`npx wrangler d1 execute DB ${target} --file ${tempFile}`);
      ok += 1;
      console.log(`   ✅ ${slug}`);
    } catch (e) {
      console.error(`   ❌ ${slug}:`, (e as Error).message);
    } finally {
      unlinkSync(tempFile);
    }
  }
  console.log(`📊 ${target}：成功 ${ok}，跳过 ${skipped}`);
}

async function main() {
  const args = process.argv.slice(2);
  const slugArg = args.find((arg) => arg.startsWith('--slug='));
  const targetSlug = slugArg ? slugArg.split('=')[1] : null;
  const remoteOnly = args.includes('--remote-only');

  const slugs = targetSlug ? [targetSlug] : APP_TRANSLATIONS_EN.map((t) => t.slug);
  console.log(`📦 准备导入 ${slugs.length} 个 app 的英文翻译\n`);

  if (!remoteOnly) {
    applyTranslations('--local', slugs);
  }
  applyTranslations('--remote', slugs);

  console.log('\n🎉 完成！如需撤销，可删除对应 locale=en 行。');
}

main().catch((e) => {
  console.error('❌ 执行失败:', e);
  process.exit(1);
});
