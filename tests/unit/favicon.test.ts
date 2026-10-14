import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('favicon.ico', () => {
  it('public/favicon.ico 是静态图标，浏览器默认请求不再落到页面 404', () => {
    const bytes = readFileSync(resolve(__dirname, '../../public/favicon.ico'));
    expect(bytes.readUInt16LE(0)).toBe(0);
    expect(bytes.readUInt16LE(2)).toBe(1);
    expect(bytes.readUInt16LE(4)).toBeGreaterThan(0);
  });
});
