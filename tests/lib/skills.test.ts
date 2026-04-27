import { describe, expect, it } from 'vitest';
import { getAllSkills, getLocalizedDescription, getSkillBySlug, getSkillSourceUrl } from '@/lib/skills';

describe('skills 数据', () => {
  it('getAllSkills 返回非空且按 name 排序', () => {
    const skills = getAllSkills();
    expect(skills.length).toBeGreaterThan(0);
    const names = skills.map((s) => s.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('每个 skill 同时具备中英文 description', () => {
    for (const skill of getAllSkills()) {
      expect(skill.description.zh).toBeTruthy();
      expect(skill.description.en).toBeTruthy();
      expect(skill.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('getSkillBySlug 命中与未命中', () => {
    const all = getAllSkills();
    expect(getSkillBySlug(all[0].slug)?.name).toBe(all[0].name);
    expect(getSkillBySlug('not-exist')).toBeNull();
  });

  it('getLocalizedDescription 按 locale 切换', () => {
    const skill = getAllSkills()[0];
    expect(getLocalizedDescription(skill, 'zh')).toBe(skill.description.zh);
    expect(getLocalizedDescription(skill, 'en')).toBe(skill.description.en);
  });

  it('getSkillSourceUrl 指向 meathill 仓库的 SKILL.md', () => {
    const skill = getAllSkills()[0];
    const url = getSkillSourceUrl(skill);
    expect(url).toContain('github.com/meathill/meathill');
    expect(url).toContain(`skills/${skill.package}/${skill.slug}/SKILL.md`);
  });
});
