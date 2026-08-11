/**
 * `/tech` 内容中心的 WordPress 取数层。
 *
 * 所有对外函数均做 try/catch 降级：WordPress 不可用时返回空数组而不是抛错，
 * 避免内容中心页面因 WP 抖动而整体挂掉。
 */
import { getPosts, getPostsByTag, getTagBySlug } from '@/lib/wordpress';
import type { WPPost } from '@/lib/wordpress';
import { getAllTechSections, mergeTechPosts } from '@/lib/tech';
import type { TechSection } from '@/lib/tech';
import type { TechSectionSlug } from '@/lib/tech-sections';

/**
 * 拉取单个分类的文章列表：策展白名单 + tag 自动聚合，合并去重后按 limit 截断。
 */
export async function getTechSectionPosts(section: TechSection, limit?: number): Promise<WPPost[]> {
  const curated = await fetchCuratedPosts(section.postSlugs);
  const fromTags = await fetchPostsByTagSlugs(section.wpTagSlugs);
  const merged = mergeTechPosts(curated, section.postSlugs, fromTags);
  return typeof limit === 'number' ? merged.slice(0, limit) : merged;
}

/**
 * 并发拉取 4 个分类各自的前 N 篇预览文章，用于 `/tech` hub 页。
 */
export async function getTechHubPreviews(previewCount: number): Promise<Record<TechSectionSlug, WPPost[]>> {
  const sections = getAllTechSections();

  const entries = await Promise.all(
    sections.map(async (section) => {
      const posts = await getTechSectionPosts(section, previewCount);
      return [section.slug, posts] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<TechSectionSlug, WPPost[]>;
}

async function fetchCuratedPosts(postSlugs: string[]): Promise<WPPost[]> {
  if (postSlugs.length === 0) return [];

  try {
    const { posts } = await getPosts({ slug: postSlugs, embed: true });
    return posts;
  } catch (error) {
    console.warn('[tech-posts] 拉取策展文章失败，降级为空列表', error);
    return [];
  }
}

async function fetchPostsByTagSlugs(wpTagSlugs: string[]): Promise<WPPost[]> {
  if (wpTagSlugs.length === 0) return [];

  const results = await Promise.all(wpTagSlugs.map((tagSlug) => fetchPostsByTagSlug(tagSlug)));
  return results.flat();
}

async function fetchPostsByTagSlug(tagSlug: string): Promise<WPPost[]> {
  try {
    const tag = await getTagBySlug(tagSlug);
    if (!tag) return [];

    const { posts } = await getPostsByTag(tag.id);
    return posts;
  } catch (error) {
    console.warn(`[tech-posts] 拉取 tag "${tagSlug}" 文章失败，降级为空列表`, error);
    return [];
  }
}
