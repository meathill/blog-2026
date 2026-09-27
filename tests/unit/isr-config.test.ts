import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
});
