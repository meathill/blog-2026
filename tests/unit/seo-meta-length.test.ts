import { describe, expect, it, vi } from 'vitest';

// routing.ts 会经 createNavigation 拉入 next/navigation，vitest 下 ESM 解析失败，mock 掉
vi.mock('next-intl/navigation', () => ({
  createNavigation: () => ({}),
}));

import { buildRootMetadata } from '@/lib/seo/root-metadata';
import { getAllSkills } from '@/lib/skills';
import enMessages from '../../messages/en.json';

// Issue #11：Ahrefs 把 meta description >160 字符记为过长。本仓 5 条超标
//（/en、/en/about、3 个 /en/skills/*）已改短，此测试锁住上限防回退。
// tools.meathill.com 的约 83 条属 evertools 仓库，转交那边修。
describe('SEO meta description 长度守卫（Ahrefs 上限 160 字符）', () => {
  it('首页根 metadata 中英文 description 均 ≤160', () => {
    for (const locale of ['zh', 'en']) {
      const meta = buildRootMetadata(locale);
      expect(typeof meta.description).toBe('string');
      expect(meta.description!.length).toBeLessThanOrEqual(160);
    }
  });

  it('/en/about 的 about_description ≤160', () => {
    const description: string = (enMessages as any).Metadata.about_description;
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('全部 skill 英文 description（详情页 meta）≤160', () => {
    for (const skill of getAllSkills()) {
      expect(skill.description.en.length).toBeLessThanOrEqual(160);
    }
  });
});
