import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OG_EDGE_CACHE_CONTROL, ogImageHeaders } from '@/lib/og/cache-headers';

describe('OG 边缘缓存头', () => {
  it('成功图可被 Workers Cache 缓存，失败和刷新不缓存', () => {
    expect(ogImageHeaders('image/jpeg', true)).toEqual({
      'Content-Type': 'image/jpeg',
      'Cache-Control': expect.stringContaining('public'),
      'Cloudflare-CDN-Cache-Control': OG_EDGE_CACHE_CONTROL,
    });
    expect(ogImageHeaders('image/png', false)['Cloudflare-CDN-Cache-Control']).toBe('no-store');
    expect(ogImageHeaders('image/png', false)['Cache-Control']).toBe('no-store');
  });

  it('next.config 的 API no-store 不覆盖 /api/og', () => {
    const source = readFileSync(resolve(__dirname, '../../next.config.ts'), 'utf8');
    expect(source).toContain('/api/:path((?!og/).*)');
    expect(source).not.toContain("source: '/api/:path*'");
    expect(readFileSync(resolve(__dirname, '../../src/app/api/og/post/route.tsx'), 'utf8')).toContain('ogImageHeaders');
    expect(readFileSync(resolve(__dirname, '../../src/app/api/og/home/route.tsx'), 'utf8')).toContain('ogImageHeaders');
  });
});
