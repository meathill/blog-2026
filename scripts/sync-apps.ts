#!/usr/bin/env npx tsx

/**
 * 同步本地 apps 数据到线上生产环境
 *
 * 使用方法：
 *   pnpm sync:apps
 *
 * 说明：
 *   - 从本地 D1 数据库读取 apps 数据
 *   - 使用 wrangler d1 execute 将数据同步到远程 D1
 *   - 如果远程已存在相同 slug 的 app，会进行更新
 */

import { execSync } from 'node:child_process';

interface App {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  content: string | null;
  icon: string | null;
  url: string | null;
  repo_url: string | null;
  status: string;
  created_at: number;
  updated_at: number;
  published_at: number | null;
}

interface AppImage {
  id: string;
  app_id: string;
  url: string;
  alt: string | null;
  type: string;
  sort_order: number | null;
  created_at: number;
}

function escapeSQL(value: string | null): string {
  if (value === null) return 'NULL';
  return `'${value.replace(/'/g, "''")}'`;
}

function run(cmd: string): string {
  console.log(`> ${cmd}`);
  return execSync(cmd, { encoding: 'utf-8' });
}

async function main() {
  console.log('📦 开始同步 apps 数据到线上...\n');

  // 1. 读取本地 D1 数据
  console.log('📖 读取本地 D1 数据库...');
  const localResult = run(`npx wrangler d1 execute DB --local --command "SELECT * FROM apps" --json`);

  let apps: App[];
  try {
    const parsed = JSON.parse(localResult);
    apps = parsed[0]?.results || [];
  } catch (e) {
    console.error('❌ 解析本地数据失败:', e);
    process.exit(1);
  }

  if (apps.length === 0) {
    console.log('⚠️ 本地没有 apps 数据，无需同步');
    return;
  }

  console.log(`📊 找到 ${apps.length} 个 apps\n`);

  // 2. 逐个同步到线上
  for (const app of apps) {
    console.log(`🔄 同步: ${app.name} (${app.slug})`);

    // 使用 INSERT OR REPLACE 来处理更新
    const sql = `
      INSERT OR REPLACE INTO apps (
        id, slug, name, description, content, icon, url, repo_url,
        status, created_at, updated_at, published_at
      ) VALUES (
        ${escapeSQL(app.id)},
        ${escapeSQL(app.slug)},
        ${escapeSQL(app.name)},
        ${escapeSQL(app.description)},
        ${escapeSQL(app.content)},
        ${escapeSQL(app.icon)},
        ${escapeSQL(app.url)},
        ${escapeSQL(app.repo_url)},
        ${escapeSQL(app.status)},
        ${app.created_at},
        ${app.updated_at},
        ${app.published_at ?? 'NULL'}
      );
    `
      .replace(/\n/g, ' ')
      .trim();

    try {
      run(`npx wrangler d1 execute DB --remote --command "${sql}"`);
      console.log(`   ✅ ${app.name} 同步成功`);
    } catch (e: any) {
      console.error(`   ❌ ${app.name} 同步失败:`, e.message);
    }
  }



  // 3. 同步 app_images
  console.log('\n📖 读取本地 app_images...');
  const localImagesResult = run(`npx wrangler d1 execute DB --local --command "SELECT * FROM app_images" --json`);
  let images: AppImage[];
  try {
    const parsed = JSON.parse(localImagesResult);
    images = parsed[0]?.results || [];
  } catch (e) {
    console.error('❌ 解析 app_images 失败:', e);
    images = []; // 继续执行
  }

  if (images.length > 0) {
    console.log(`📊 找到 ${images.length} 个 images\n`);
    for (const img of images) {
      console.log(`🔄 同步 image: ${img.url}`);
      const sql = `
        INSERT OR REPLACE INTO app_images (id, app_id, url, alt, type, sort_order, created_at)
        VALUES (
          ${escapeSQL(img.id)},
          ${escapeSQL(img.app_id)},
          ${escapeSQL(img.url)},
          ${escapeSQL(img.alt)},
          ${escapeSQL(img.type)},
          ${img.sort_order ?? 0},
          ${img.created_at}
        );
      `.replace(/\n/g, ' ').trim();

      try {
        run(`npx wrangler d1 execute DB --remote --command "${sql}"`);
        console.log(`   ✅ Image 同步成功`);
      } catch (e: any) {
        console.error(`   ❌ Image 同步失败:`, e.message);
      }
    }
  }

  console.log('\n🎉 同步完成!');
}

main().catch(console.error);
