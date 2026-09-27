import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readText(name: string): string {
  return readFileSync(resolve(__dirname, '../../', name), 'utf-8');
}

describe('ISR 配置守卫', () => {
  it('wrangler.jsonc 必须有 WORKER_SELF_REFERENCE 自引用（DO queue 回打依赖）', () => {
    const raw = readText('wrangler.jsonc');
    // jsonc 带注释，只去掉整行注释（行内 // 可能是 URL，不能动）
    const json = raw.replace(/^\s*\/\/.*$/gm, '');
    const config = JSON.parse(json) as {
      name: string;
      services?: { binding: string; service: string }[];
      durable_objects?: { bindings: { name: string; class_name: string }[] };
      d1_databases?: { binding: string }[];
      r2_buckets?: { binding: string }[];
    };

    expect(config.services ?? []).toEqual(
      expect.arrayContaining([{ binding: 'WORKER_SELF_REFERENCE', service: config.name }]),
    );
    expect(config.durable_objects?.bindings ?? []).toEqual(
      expect.arrayContaining([{ name: 'NEXT_CACHE_DO_QUEUE', class_name: 'DOQueueHandler' }]),
    );
    expect((config.d1_databases ?? []).map((d) => d.binding)).toContain('NEXT_TAG_CACHE_D1');
    expect((config.r2_buckets ?? []).map((b) => b.binding)).toContain('NEXT_INC_CACHE_R2_BUCKET');
  });

  it('open-next.config.ts 保持 R2 + regional + DO queue + D1 tag，不用 KV', () => {
    const source = readText('open-next.config.ts');
    expect(source).toContain('r2-incremental-cache');
    expect(source).toContain('withRegionalCache');
    expect(source).toContain('do-queue');
    expect(source).toContain('d1-next-tag-cache');
    expect(source).not.toMatch(/kv-incremental-cache/);
    expect(source).toContain('enableCacheInterception: false');
  });

  // 全站 ISR（2026-09-27）：构建期 0 预渲染、0 次 WordPress 请求；页面首个请求渲染后进增量缓存
  const PUBLIC_DIR = resolve(__dirname, '../../src/app/[locale]/(public)');
  // 必须保持动态的页面：search 用 searchParams；app/* 显式 force-dynamic（D1 内容 + searchParams）；login 是客户端页
  const DYNAMIC_PAGES = ['search/page.tsx', 'app/page.tsx', 'app/[slug]/page.tsx', 'login/page.tsx'];

  function listPages(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) return listPages(full);
      return name === 'page.tsx' ? [relative(PUBLIC_DIR, full)] : [];
    });
  }

  it('公开页面（除显式动态页外）都以空 generateStaticParams 走按需 ISR，并注入 request locale', () => {
    const pages = listPages(PUBLIC_DIR).filter((page) => !DYNAMIC_PAGES.includes(page));
    expect(pages.length).toBeGreaterThan(10);
    for (const page of pages) {
      const source = readFileSync(join(PUBLIC_DIR, page), 'utf-8');
      expect(source, page).toMatch(/export async function generateStaticParams\(\) \{\s*return \[\];\s*\}/);
      expect(source, page).toContain('setRequestLocale(locale)');
      expect(source, page).not.toContain('force-dynamic');
    }
  });

  it('根 layout 不读请求头；[locale] layout 注入 locale；sitemap 请求时生成并缓存', () => {
    const root = readText('src/app/layout.tsx');
    expect(root).not.toContain('next-intl/server');
    expect(root).not.toContain('next/headers');
    expect(readText('src/app/[locale]/layout.tsx')).toContain('setRequestLocale(locale)');
    expect(readText('src/app/[locale]/(public)/layout.tsx')).toContain('setRequestLocale(locale)');
    const sitemap = readText('src/app/sitemap.ts');
    expect(sitemap).toContain("export const dynamic = 'force-dynamic'");
    expect(sitemap).toContain('unstable_cache');
    expect(sitemap).not.toMatch(/export const revalidate/);
  });
});
