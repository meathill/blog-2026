import { describe, it, expect } from 'vitest';
import { TECH_SECTION_SLUGS, isTechSectionSlug } from '@/lib/tech-sections';

describe('isTechSectionSlug', () => {
  it.each(TECH_SECTION_SLUGS)('应识别合法子栏目 %s', (slug) => {
    expect(isTechSectionSlug(slug)).toBe(true);
  });

  it('应拒绝未知 slug', () => {
    expect(isTechSectionSlug('article')).toBe(false);
  });

  it('应拒绝空字符串', () => {
    expect(isTechSectionSlug('')).toBe(false);
  });
});
