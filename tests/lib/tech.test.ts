import { describe, it, expect } from 'vitest';
import { getAllTechSections, getTechSection, localize, mergeTechPosts } from '@/lib/tech';
import { TECH_SECTION_SLUGS } from '@/lib/tech-sections';
import type { WPPost } from '@/lib/wordpress';

function buildPost(overrides: Partial<WPPost> = {}): WPPost {
  return {
    id: 1,
    date: '2026-01-01T00:00:00',
    modified: '2026-01-01T00:00:00',
    slug: 'post',
    title: { rendered: 'Post' },
    excerpt: { rendered: '' },
    content: { rendered: '' },
    categories: [],
    tags: [],
    featured_media: 0,
    ...overrides,
  };
}

describe('getAllTechSections / getTechSection', () => {
  const sections = getAllTechSections();

  it('应包含且仅包含 TECH_SECTION_SLUGS 中的 4 个分类', () => {
    const slugs = sections.map((section) => section.slug).sort();
    expect(slugs).toEqual([...TECH_SECTION_SLUGS].sort());
  });

  it.each(sections)('分类 $slug 的文案字段均非空', (section) => {
    expect(section.title.zh).toBeTruthy();
    expect(section.title.en).toBeTruthy();
    expect(section.description.zh).toBeTruthy();
    expect(section.description.en).toBeTruthy();
    expect(section.intro.zh).toBeTruthy();
    expect(section.intro.en).toBeTruthy();
  });

  it.each(sections)('分类 $slug 的 postSlugs 无重复', (section) => {
    expect(new Set(section.postSlugs).size).toBe(section.postSlugs.length);
  });

  it.each(sections)('分类 $slug 的 wpTagSlugs 无重复', (section) => {
    expect(new Set(section.wpTagSlugs).size).toBe(section.wpTagSlugs.length);
  });

  it('getTechSection 按 slug 返回对应分类', () => {
    const compare = getTechSection('compare');
    expect(compare?.slug).toBe('compare');
  });

  it('跨分类 postSlugs 之间没有重复策展', () => {
    const allPostSlugs = sections.flatMap((section) => section.postSlugs);
    expect(new Set(allPostSlugs).size).toBe(allPostSlugs.length);
  });
});

describe('localize', () => {
  it('locale 为 en 时返回英文', () => {
    expect(localize({ zh: '中文', en: 'English' }, 'en')).toBe('English');
  });

  it('locale 为其他值（含 zh）时返回中文', () => {
    expect(localize({ zh: '中文', en: 'English' }, 'zh')).toBe('中文');
    expect(localize({ zh: '中文', en: 'English' }, 'fr')).toBe('中文');
  });
});

describe('mergeTechPosts', () => {
  it('curated 按 curatedOrder 排序在前', () => {
    const a = buildPost({ slug: 'a', date: '2026-01-01T00:00:00' });
    const b = buildPost({ slug: 'b', date: '2026-03-01T00:00:00' });
    // curated 数组本身乱序，靠 curatedOrder 排回来
    const result = mergeTechPosts([b, a], ['a', 'b'], []);
    expect(result.map((post) => post.slug)).toEqual(['a', 'b']);
  });

  it('fromTags 按日期倒序排在 curated 之后', () => {
    const curated = buildPost({ slug: 'curated', date: '2020-01-01T00:00:00' });
    const older = buildPost({ slug: 'old', date: '2025-01-01T00:00:00' });
    const newer = buildPost({ slug: 'new', date: '2026-01-01T00:00:00' });
    const result = mergeTechPosts([curated], ['curated'], [older, newer]);
    expect(result.map((post) => post.slug)).toEqual(['curated', 'new', 'old']);
  });

  it('按 slug 去重：fromTags 中与 curated 重复的文章被剔除', () => {
    const curated = buildPost({ slug: 'shared', date: '2020-01-01T00:00:00' });
    const duplicateInTags = buildPost({ slug: 'shared', date: '2026-01-01T00:00:00' });
    const unique = buildPost({ slug: 'unique', date: '2025-01-01T00:00:00' });
    const result = mergeTechPosts([curated], ['curated'], [duplicateInTags, unique]);
    expect(result.map((post) => post.slug)).toEqual(['shared', 'unique']);
  });

  it('fromTags 内部跨多个 tag 聚合出的重复 slug 只保留一份', () => {
    const fromTagA = buildPost({ slug: 'dup', date: '2026-01-01T00:00:00' });
    const fromTagB = buildPost({ slug: 'dup', date: '2026-01-01T00:00:00' });
    const result = mergeTechPosts([], [], [fromTagA, fromTagB]);
    expect(result.map((post) => post.slug)).toEqual(['dup']);
  });

  it('curatedOrder 中不存在于 curated 的 slug 被安全忽略', () => {
    const curated = buildPost({ slug: 'a' });
    const result = mergeTechPosts([curated], ['a', 'missing'], []);
    expect(result.map((post) => post.slug)).toEqual(['a']);
  });

  it('全部为空输入时返回空数组', () => {
    expect(mergeTechPosts([], [], [])).toEqual([]);
  });
});
