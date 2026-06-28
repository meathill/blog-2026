#!/usr/bin/env node

/**
 * 补齐并标记「重点产品」(featured)。
 *
 * 前置：先应用迁移，确保 apps 表有 featured / sort_order 列：
 *   pnpm db:migrate:local      # 本地
 *   pnpm db:migrate:prod       # 线上
 *
 * 使用方法（Node >= 24 原生执行 TS，无需 tsx）：
 *   pnpm seed:products            # 作用于本地 D1
 *   pnpm seed:products --remote   # 作用于线上 D1
 *
 * 行为（幂等，可重复运行）：
 *   - 缺失的产品（按 slug）：新建为 status='published'、featured=1，写入中/英文案
 *   - 已存在的产品：仅标记 featured + sort_order，不覆盖其名称/简介/状态
 *   - 英文翻译：仅当该 (app, en) 翻译不存在时写入，不覆盖已有翻译
 *   封面图请到 /admin/apps/[id] 上传（type=cover）；无封面时卡片用渐变占位。
 */

import { execSync } from 'node:child_process';
import { unlinkSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

interface Product {
  slug: string;
  name: string;
  url: string;
  descZh: string;
  descEn: string;
  sortOrder: number;
}

// 重点产品（按 sortOrder 升序排在首页）。已存在的只会被标记 featured，文案不会被改写。
const PRODUCTS: Product[] = [
  {
    slug: 'dyqr',
    name: 'DYQR',
    url: 'https://dyqr.me',
    descZh: '动态二维码与短链：生成后随时改目标、自定义样式、附带访问分析，印刷物改链接无需重印。',
    descEn:
      'Dynamic QR codes & short links — change the destination anytime, customize the style, and track scans without reprinting.',
    sortOrder: 1,
  },
  {
    slug: 'muirouter',
    name: 'Mui Router',
    url: 'https://muirouter.com',
    descZh: 'OpenAI 兼容的 LLM 网关：一个 API Key 接入多家模型供应商，统一计费、配额与并发。',
    descEn:
      'OpenAI-compatible LLM gateway — one API key for many model providers, with unified billing, quotas, and rate control.',
    sortOrder: 2,
  },
  {
    slug: 'muicv',
    name: 'Mui CV',
    url: 'https://muicv.com',
    descZh: 'AI 简历工具：按岗位生成与优化简历，支持 STAR/量化审查与一键导出 PDF。',
    descEn:
      'AI resume builder — generate and tailor resumes per job, with STAR/quantification review and one-click PDF export.',
    sortOrder: 3,
  },
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
  console.log(`📦 补齐重点产品 (${target})\n`);
  const now = Date.now();

  const statements = PRODUCTS.flatMap((p) => {
    const id = randomUUID();
    const translationId = randomUUID();
    return [
      // 缺失才新建（已发布），已存在则跳过，不覆盖原有文案/状态
      `INSERT INTO apps (id, slug, name, description, content, icon, url, repo_url, status, featured, sort_order, created_at, updated_at, published_at)
       VALUES (${esc(id)}, ${esc(p.slug)}, ${esc(p.name)}, ${esc(p.descZh)}, NULL, NULL, ${esc(p.url)}, NULL, 'published', 1, ${p.sortOrder}, ${now}, ${now}, ${now})
       ON CONFLICT(slug) DO NOTHING;`,
      // 无论新旧，都标记 featured + 排序
      `UPDATE apps SET featured = 1, sort_order = ${p.sortOrder}, updated_at = ${now} WHERE slug = ${esc(p.slug)};`,
      // 英文翻译：取该 slug 的真实 app id，仅在缺失时写入
      `INSERT INTO app_translations (id, app_id, locale, name, description, content, created_at, updated_at)
       SELECT ${esc(translationId)}, id, 'en', ${esc(p.name)}, ${esc(p.descEn)}, NULL, ${now}, ${now} FROM apps WHERE slug = ${esc(p.slug)}
       ON CONFLICT(app_id, locale) DO NOTHING;`,
    ];
  });

  const sql = statements.join('\n');
  const tempFile = '.temp_seed_products.sql';
  writeFileSync(tempFile, sql);
  try {
    run(`npx wrangler d1 execute DB ${target} --file ${tempFile}`);
  } finally {
    unlinkSync(tempFile);
  }

  console.log('\n✅ 完成。');
  console.log('ℹ️  新建产品已发布并设为 Featured；到 /admin/apps/[id] 上传封面（type=cover）效果更佳。');
  console.log('ℹ️  如需把 baifo / mizu 等已有产品也设为重点，在 /admin/apps 勾选 Featured 即可。');
}

main();
