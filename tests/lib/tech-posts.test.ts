import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TechSection } from '@/lib/tech';
import type { WPPost } from '@/lib/wordpress';

const mockGetPosts = vi.fn();
const mockGetPostsByTag = vi.fn();
const mockGetTagBySlug = vi.fn();

vi.mock('@/lib/wordpress', () => ({
  getPosts: (...args: unknown[]) => mockGetPosts(...args),
  getPostsByTag: (...args: unknown[]) => mockGetPostsByTag(...args),
  getTagBySlug: (...args: unknown[]) => mockGetTagBySlug(...args),
}));

const { getTechSectionPosts, getTechHubPreviews } = await import('@/lib/tech-posts');
const { getAllTechSections } = await import('@/lib/tech');

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

function buildSection(overrides: Partial<TechSection> = {}): TechSection {
  return {
    slug: 'compare',
    icon: (() => null) as unknown as TechSection['icon'],
    title: { zh: '对比选型', en: 'Compare' },
    description: { zh: '', en: '' },
    intro: { zh: '', en: '' },
    postSlugs: [],
    wpTagSlugs: [],
    ...overrides,
  };
}

describe('getTechSectionPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('合并策展文章与 tag 聚合文章', async () => {
    const curatedPost = buildPost({ slug: 'curated', date: '2020-01-01T00:00:00' });
    const tagPost = buildPost({ slug: 'from-tag', date: '2026-01-01T00:00:00' });
    mockGetPosts.mockResolvedValue({ posts: [curatedPost], total: 1, totalPages: 1 });
    mockGetTagBySlug.mockResolvedValue({ id: 10, slug: 'tech-compare', name: 'Compare', count: 5 });
    mockGetPostsByTag.mockResolvedValue({ posts: [tagPost], total: 1, totalPages: 1 });

    const section = buildSection({ postSlugs: ['curated'], wpTagSlugs: ['tech-compare'] });
    const result = await getTechSectionPosts(section);

    expect(mockGetPosts).toHaveBeenCalledWith({ slug: ['curated'], embed: true });
    expect(result.map((post) => post.slug)).toEqual(['curated', 'from-tag']);
  });

  it('postSlugs 为空时不调用 getPosts', async () => {
    mockGetTagBySlug.mockResolvedValue(null);
    const section = buildSection({ postSlugs: [], wpTagSlugs: [] });

    const result = await getTechSectionPosts(section);

    expect(mockGetPosts).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('tag 不存在时静默跳过', async () => {
    mockGetPosts.mockResolvedValue({ posts: [], total: 0, totalPages: 0 });
    mockGetTagBySlug.mockResolvedValue(null);

    const section = buildSection({ postSlugs: [], wpTagSlugs: ['not-exist'] });
    const result = await getTechSectionPosts(section);

    expect(mockGetPostsByTag).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('getPosts 抛错时降级为空数组，不影响 tag 聚合结果', async () => {
    mockGetPosts.mockRejectedValue(new Error('WP down'));
    mockGetTagBySlug.mockResolvedValue({ id: 10, slug: 'tech-compare', name: 'Compare', count: 5 });
    const tagPost = buildPost({ slug: 'from-tag' });
    mockGetPostsByTag.mockResolvedValue({ posts: [tagPost], total: 1, totalPages: 1 });

    const section = buildSection({ postSlugs: ['curated'], wpTagSlugs: ['tech-compare'] });
    const result = await getTechSectionPosts(section);

    expect(result.map((post) => post.slug)).toEqual(['from-tag']);
  });

  it('getPostsByTag 抛错时该 tag 静默跳过，不影响其他 tag', async () => {
    mockGetPosts.mockResolvedValue({ posts: [], total: 0, totalPages: 0 });
    mockGetTagBySlug.mockImplementation((slug: string) =>
      Promise.resolve({ id: slug === 'ok-tag' ? 1 : 2, slug, name: slug, count: 1 }),
    );
    mockGetPostsByTag.mockImplementation((tagId: number) => {
      if (tagId === 1) {
        return Promise.resolve({ posts: [buildPost({ slug: 'ok-post' })], total: 1, totalPages: 1 });
      }
      return Promise.reject(new Error('WP down'));
    });

    const section = buildSection({ postSlugs: [], wpTagSlugs: ['ok-tag', 'bad-tag'] });
    const result = await getTechSectionPosts(section);

    expect(result.map((post) => post.slug)).toEqual(['ok-post']);
  });

  it('传入 limit 时按 limit 截断合并结果', async () => {
    mockGetPosts.mockResolvedValue({
      posts: [buildPost({ slug: 'a' }), buildPost({ slug: 'b' })],
      total: 2,
      totalPages: 1,
    });
    mockGetTagBySlug.mockResolvedValue(null);

    const section = buildSection({ postSlugs: ['a', 'b'], wpTagSlugs: [] });
    const result = await getTechSectionPosts(section, 1);

    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('a');
  });
});

describe('getTechHubPreviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('并发返回 4 个分类各自的预览列表，结构以 section slug 为 key', async () => {
    mockGetPosts.mockResolvedValue({ posts: [], total: 0, totalPages: 0 });
    mockGetTagBySlug.mockResolvedValue(null);

    const result = await getTechHubPreviews(3);

    const expectedSlugs = getAllTechSections().map((section) => section.slug);
    expect(Object.keys(result).sort()).toEqual([...expectedSlugs].sort());
    for (const slug of expectedSlugs) {
      expect(Array.isArray(result[slug])).toBe(true);
    }
  });
});
