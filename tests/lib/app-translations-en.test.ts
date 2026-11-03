import { describe, expect, it } from 'vitest';
import { APP_TRANSLATIONS_EN } from '../../scripts/app-translations-en';

// 导入脚本的数据守卫：任何一项缺失都会让 /en/app/<slug> 回退显示中文
describe('app 英文翻译数据', () => {
  it('覆盖预期数量的 published app（awesome-comment 已英文、muiad 已 archived，不含在内）', () => {
    const slugs = APP_TRANSLATIONS_EN.map((t) => t.slug);
    expect(slugs).toHaveLength(11);
    expect(new Set(slugs).size).toBe(11);
    expect(slugs).not.toContain('awesome-comment');
    expect(slugs).not.toContain('muiad');
  });

  it.each(APP_TRANSLATIONS_EN.map((t) => [t.slug, t] as const))('%s 的 name/description/content 非空', (_slug, t) => {
    expect(t.name.trim()).toBeTruthy();
    expect(t.description.trim()).toBeTruthy();
    expect(t.description.length).toBeLessThanOrEqual(400);
    // 正文至少 3 段（封面图 + 简介 + 结尾链接），避免漏翻半截
    expect(t.content.split('\n\n').length).toBeGreaterThanOrEqual(4);
    expect(t.content).toContain('](https://');
  });
});
