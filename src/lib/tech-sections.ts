/**
 * `/tech` 下允许直接渲染的子栏目 slug。
 *
 * 这些是产品页面（对比、平台、技术栈、指南），与 WP 分类 `tech` 下的
 * 旧文章路径 `/tech/{slug}` 共享同一个根路径段，middleware 需要区分二者：
 * 命中这里的 slug 放行渲染，其余交给 legacy 301 逻辑。
 *
 * 本文件零依赖，会被 middleware bundle 引入，禁止 import 任何第三方库。
 */
export const TECH_SECTION_SLUGS = ['compare', 'platforms', 'stacks', 'guides'] as const;

export type TechSectionSlug = (typeof TECH_SECTION_SLUGS)[number];

/**
 * 判断给定 slug 是否为合法的 `/tech` 子栏目。
 */
export function isTechSectionSlug(slug: string): slug is TechSectionSlug {
  return (TECH_SECTION_SLUGS as readonly string[]).includes(slug);
}
