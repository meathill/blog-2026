#!/usr/bin/env node

/**
 * 更新 navigation_configs 中「作品」(Works) 菜单项：
 * - 移除 Battleship、AIGAZOU、扫雷游戏
 * - 增加 DYQR、Mui Router、Mui CV、Free AI API、My Playlist
 *
 * 用法：
 *   node scripts/update-navigation-works.ts          # 本地 D1
 *   node scripts/update-navigation-works.ts --remote # 线上 D1
 */

import { execSync } from 'node:child_process';
import { unlinkSync, writeFileSync } from 'node:fs';

interface NavChild {
  href: string;
  label: string;
  external?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  external?: boolean;
  children?: NavChild[];
}

interface NavConfig {
  header: NavItem[];
  footer: NavItem[];
}

const NEW_WORKS_CHILDREN: NavChild[] = [
  { href: 'https://space.bilibili.com/7409098', label: 'B 站视频', external: true },
  { href: 'https://www.youtube.com/channel/UCBeD-XqErDK4tKy5FtZj8vg', label: '油管频道', external: true },
  { href: 'https://github.com/meathill', label: 'GitHub', external: true },
  { href: 'https://dyqr.me', label: 'DYQR', external: true },
  { href: 'https://muirouter.com', label: 'Mui Router', external: true },
  { href: 'https://muicv.com', label: 'Mui CV', external: true },
  { href: 'https://freeaiapi.org', label: 'Free AI API', external: true },
  { href: 'https://my-playlist.app', label: 'My Playlist', external: true },
  { href: 'https://baifo.life', label: '拜拜-网上拜佛', external: true },
  { href: 'https://muistory.com', label: '姆伊游戏书', external: true },
];

const isRemote = process.argv.includes('--remote');
const target = isRemote ? '--remote' : '--local';

function esc(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function run(cmd: string): string {
  console.log(`> ${cmd}`);
  return execSync(cmd, { encoding: 'utf-8' });
}

function main() {
  console.log(`📦 更新导航作品菜单 (${target})\n`);

  // 1. 读取当前 navigation_configs
  const queryCmd = `pnpm wrangler d1 execute DB ${target} --json --command "SELECT locale, items FROM navigation_configs"`;
  const rawOut = execSync(queryCmd, { encoding: 'utf-8' });
  const parsed = JSON.parse(rawOut);
  const rows: { locale: string; items: string }[] = parsed[0]?.results ?? [];

  if (rows.length === 0) {
    console.log(`⚠️  未在 ${target} 找到 navigation_configs 记录，导航将使用代码中的默认配置。`);
    return;
  }

  const statements: string[] = [];
  const now = Date.now();

  for (const row of rows) {
    const config: NavConfig = JSON.parse(row.items);
    if (!config.header || !Array.isArray(config.header)) {
      continue;
    }

    const worksItem = config.header.find((item) => item.href === '/works');
    if (worksItem) {
      worksItem.children = NEW_WORKS_CHILDREN;
    } else {
      config.header.push({
        href: '/works',
        label: row.locale === 'en' ? 'Works' : '作品',
        children: NEW_WORKS_CHILDREN,
      });
    }

    const updatedJson = JSON.stringify(config);
    statements.push(
      `UPDATE navigation_configs SET items = ${esc(updatedJson)}, updated_at = ${now} WHERE locale = ${esc(row.locale)};`,
    );
  }

  if (statements.length === 0) {
    console.log('未检测到需要更新的行。');
    return;
  }

  const sql = statements.join('\n');
  const tempFile = '.temp_update_navigation.sql';
  writeFileSync(tempFile, sql);
  try {
    run(`npx wrangler d1 execute DB ${target} --file ${tempFile}`);
  } finally {
    unlinkSync(tempFile);
  }

  console.log(`\n✅ ${target} 导航配置已成功更新！作品子项包含 DYQR 等 5 款独立产品。`);
}

main();
