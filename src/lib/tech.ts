/**
 * `/tech` 内容中心的策展配置与纯函数。
 *
 * 频道定位：面向独立开发者、小团队和技术小白的技术选型内容中心。
 * 4 个分类各自维护一份显式策展白名单（postSlugs，保序展示历史精华文章），
 * 并叠加一组 WP tag 自动聚合通道（wpTagSlugs，让新文章无需改代码即可归入分类）。
 */
import type { LucideIcon } from 'lucide-react';
import { CloudIcon, CompassIcon, GitCompareIcon, LayersIcon } from 'lucide-react';
import type { TechSectionSlug } from '@/lib/tech-sections';
import type { WPPost } from '@/lib/wordpress';

export interface Localized {
  zh: string;
  en: string;
}

export interface TechSection {
  slug: TechSectionSlug;
  icon: LucideIcon;
  /** 分类名 */
  title: Localized;
  /** 一句话定位（卡片/列表用） */
  description: Localized;
  /** 分类页开头 2-3 句定位文案（SEO 正文） */
  intro: Localized;
  /** 显式策展白名单，保序 */
  postSlugs: string[];
  /** WP tag 自动聚合通道 */
  wpTagSlugs: string[];
}

const TECH_SECTIONS: TechSection[] = [
  {
    slug: 'compare',
    icon: GitCompareIcon,
    title: { zh: '对比选型', en: 'Compare' },
    description: {
      zh: 'Vercel vs Cloudflare、TiDB vs 传统数据库——把技术对比选型和迁移路上的坑摊开讲清楚。',
      en: 'Vercel vs Cloudflare, TiDB vs traditional databases — honest tech-compare writeups on real migration pitfalls.',
    },
    intro: {
      zh: '技术选型最怕道听途说。这里收录的都是真金白银跑过一遍的对比选型：为什么从 Vercel 迁到 Cloudflare、换数据库前后踩过哪些坑。没有厂商话术，只有实测数据和踩坑记录，帮独立开发者和小团队少走弯路。',
      en: 'Picking the wrong stack is expensive. These are hands-on tech-compare writeups — why we migrated from Vercel to Cloudflare, what broke when we switched databases — backed by real numbers, not vendor pitches. Built for indie developers and small teams who need to decide fast without guessing.',
    },
    postSlugs: [
      'migrate-next-js-from-vercel-to-cloudflare',
      'moved-my-nuxt3-sites-from-vercel-to-cloudflarenuxt',
      'a-record-of-moving-db-to-tidb-cloud-and-move-back',
    ],
    wpTagSlugs: ['tech-compare', 'agent-skills'],
  },
  {
    slug: 'platforms',
    icon: CloudIcon,
    title: { zh: '平台详解', en: 'Platforms' },
    description: {
      zh: '深挖 Cloudflare Workers、Hyperdrive、Image Resizing 等云平台组件的生产级实践与账单陷阱。',
      en: 'Deep dives into Cloudflare Workers, Hyperdrive, Image Resizing, and other cloud platform pieces — production practices and billing traps.',
    },
    intro: {
      zh: 'Serverless 平台的文档从不会告诉你账单会怎么炸。这里是我们在 Cloudflare Workers、Hyperdrive、Image Resizing 等组件上真实跑过的生产实践：哪些配置省钱、哪些默认值是陷阱。写给正在评估或已经用上 Cloudflare 全栈的你。',
      en: 'Platform docs rarely warn you about the billing surprises. These are production notes from running real workloads on Cloudflare Workers, Hyperdrive, Image Resizing, and more — what configuration saves money, and which defaults are traps. Written for anyone evaluating or already running a Cloudflare-first stack.',
    },
    postSlugs: [
      'best-practice-for-nextjs-on-cloudflare-worker-2026',
      'best-practice-for-nextjs-supabase-hyperdrive-on-cloudflare-worker',
      'nextjs-images-why-so-expensive-cloudflare-image-resizing-pitfalls-best-practices',
      'cloudflare-email-worker-three-pitfalls',
      'payload-cms-on-cloudflare-five-pitfalls',
      'tidb-ru-bill-explosion-investigation',
    ],
    wpTagSlugs: ['tech-platforms', 'hyperdrive', 'cloudflare-workers'],
  },
  {
    slug: 'stacks',
    icon: LayersIcon,
    title: { zh: '技术栈方案', en: 'Stacks' },
    description: {
      zh: '从零搭建一套完整技术栈：Next.js + Strapi + TiDB + Cloudflare R2，一站式方案与实操步骤。',
      en: 'Full tech-stack blueprints from scratch — Next.js + Strapi + TiDB + Cloudflare R2 — with step-by-step build notes.',
    },
    intro: {
      zh: '与其东拼西凑教程，不如直接抄一套跑得通的技术栈方案。这里整理的是从零到上线的完整搭建记录——数据库、CMS、存储、部署一次讲清楚，适合想快速定型 tech stack 的独立开发者和小团队。',
      en: 'Skip the tutorial hell — copy a stack that already works end to end. These are complete build logs from zero to production: database, CMS, storage, and deployment in one place, made for indie developers and small teams who want to lock in a tech stack fast.',
    },
    postSlugs: ['new-serial-tutorial-build-website-with-next-js-strapi-zeabur-tidb-cloudflare-r2-vercel'],
    wpTagSlugs: ['tech-stacks'],
  },
  {
    slug: 'guides',
    icon: CompassIcon,
    title: { zh: '入门指南', en: 'Guides' },
    description: {
      zh: '写给技术小白的入门指南：vibe coding 工作流、Claude Code skills，用最短路径上手新工具。',
      en: 'Beginner-friendly guides — vibe coding workflows, Claude Code skills — the shortest path to getting productive with a new tool.',
    },
    intro: {
      zh: '新工具、新工作流刚上手时最缺的是一份靠谱的入门指南。这里收录了 vibe coding 的代码维护技巧、Claude Code skills 的实战用法，用最少的弯路带你从零上手，特别适合刚接触这些工具的技术小白。',
      en: "Getting started with a new workflow shouldn't mean reading ten conflicting blog posts. These guides cover vibe coding maintenance habits and practical Claude Code skills, taking you from zero to productive with the fewest detours — ideal if you're new to these tools.",
    },
    postSlugs: ['vibe-coding-code-maintenance-skill', 'vibe-coding-lightweight-kms-on-cloudflare'],
    wpTagSlugs: ['tech-guides', 'vibe-coding', 'claude-code'],
  },
];

export function getAllTechSections(): TechSection[] {
  return TECH_SECTIONS;
}

export function getTechSection(slug: TechSectionSlug): TechSection | null {
  return TECH_SECTIONS.find((section) => section.slug === slug) ?? null;
}

export function localize(field: Localized, locale: string): string {
  return locale === 'en' ? field.en : field.zh;
}

/**
 * 合并策展文章与 tag 聚合文章：curated 按 curatedOrder 排序在前，
 * fromTags 按日期倒序补在后，全程按 slug 去重（curated 优先）。
 */
export function mergeTechPosts(curated: WPPost[], curatedOrder: string[], fromTags: WPPost[]): WPPost[] {
  const curatedBySlug = new Map(curated.map((post) => [post.slug, post]));
  const orderedCurated = curatedOrder
    .map((slug) => curatedBySlug.get(slug))
    .filter((post): post is WPPost => Boolean(post));

  const seenSlugs = new Set(orderedCurated.map((post) => post.slug));
  const sortedFromTags = [...fromTags]
    .filter((post) => !seenSlugs.has(post.slug))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // fromTags 内部也可能有重复 slug（多个 tag 聚合同一篇），保留首个
  const dedupedFromTags: WPPost[] = [];
  const seenFromTagsSlugs = new Set<string>();
  for (const post of sortedFromTags) {
    if (seenFromTagsSlugs.has(post.slug)) continue;
    seenFromTagsSlugs.add(post.slug);
    dedupedFromTags.push(post);
  }

  return [...orderedCurated, ...dedupedFromTags];
}
