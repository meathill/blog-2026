import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// 2026-11-04 全站 ISR 500 事故守卫：根级 app/not-found.tsx 一旦引入 next-intl、
// 客户端组件或 messages JSON，所有 ● ISR 路由的请求时重渲染会抛 DYNAMIC_SERVER_USAGE，
// OpenNext 未接住降级信号直接 500（构建期测试全绿也拦不住，只有结构约束能防复发）。
// 根级 404 只服务 [locale] 之外的边缘路径，必须保持零依赖静态渲染。
describe('root not-found guard', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/app/not-found.tsx'), 'utf8');

  it('不得引入 next-intl（含 NextIntlClientProvider）', () => {
    expect(source).not.toMatch(/['"]next-intl['"]/);
  });

  it('不得引入 messages JSON', () => {
    expect(source).not.toMatch(/messages\/(zh|en)\.json/);
  });

  it('不得引入项目客户端组件', () => {
    expect(source).not.toMatch(/@\/components\//);
  });
});
