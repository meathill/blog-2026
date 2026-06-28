import type { LucideIcon } from 'lucide-react';
import { CloudIcon, SmartphoneIcon, SparklesIcon } from 'lucide-react';

interface Localized {
  zh: string;
  en: string;
}

export interface Solution {
  slug: string;
  icon: LucideIcon;
  title: Localized;
  tagline: Localized;
  problem: Localized;
  outcomes: Localized[];
  /** WordPress 分类 slug，用于在详情页拉取相关文章 */
  categorySlug?: string;
}

const SOLUTIONS: Solution[] = [
  {
    slug: 'cloudflare-fullstack',
    icon: CloudIcon,
    title: {
      zh: 'Cloudflare 全栈架构与迁移',
      en: 'Cloudflare Full-Stack & Migration',
    },
    tagline: {
      zh: '把 Next.js / Nuxt 稳稳跑在 Cloudflare 上，告别失控的 Vercel 账单。',
      en: 'Run Next.js / Nuxt on Cloudflare for good — and leave runaway Vercel bills behind.',
    },
    problem: {
      zh: 'Vercel 账单失控、冷启动慢，想用 Workers / R2 / D1 / Hyperdrive 却一路踩坑？',
      en: 'Vercel bills out of control, slow cold starts, and Workers / R2 / D1 / Hyperdrive full of pitfalls?',
    },
    outcomes: [
      {
        zh: 'Next.js / Nuxt 迁移到 Cloudflare Workers，成本大幅下降',
        en: 'Migrate Next.js / Nuxt to Cloudflare Workers and cut costs sharply',
      },
      {
        zh: 'R2 对象存储、D1 / Hyperdrive 数据层接入',
        en: 'Wire up R2 object storage and the D1 / Hyperdrive data layer',
      },
      { zh: '边缘缓存、KMS、图片处理等生产级实践', en: 'Production-grade edge caching, KMS, and image handling' },
    ],
    categorySlug: 'cloudflare-worker',
  },
  {
    slug: 'ai-billing',
    icon: SparklesIcon,
    title: {
      zh: 'AI 应用与计费系统',
      en: 'AI Apps & Billing Systems',
    },
    tagline: {
      zh: '从 LLM 接入到 Stripe 计费，跑通一套真正能收钱的 AI 产品。',
      en: 'From LLM integration to Stripe billing — ship an AI product that actually gets paid.',
    },
    problem: {
      zh: '接了 OpenAI 想商业化，但用量计量、订阅、配额、对账一团乱？',
      en: 'Hooked up OpenAI and want to monetize, but usage metering, subscriptions, quotas, and reconciliation are a mess?',
    },
    outcomes: [
      { zh: 'OpenAI / Claude 等多模型接入与封装', en: 'Integrate and wrap multiple models (OpenAI / Claude, etc.)' },
      {
        zh: 'Stripe + Supabase 的用量计费与订阅体系',
        en: 'Usage-based billing and subscriptions with Stripe + Supabase',
      },
      { zh: 'API 网关、配额与额度管理', en: 'API gateway, quotas, and credit management' },
    ],
    categorySlug: 'ai',
  },
  {
    slug: 'cross-platform',
    icon: SmartphoneIcon,
    title: {
      zh: '跨端与移动应用',
      en: 'Cross-Platform & Mobile Apps',
    },
    tagline: {
      zh: '一套 React Native / Expo 代码，稳定上架 iOS 与 Android。',
      en: 'One React Native / Expo codebase, shipped reliably to iOS and Android.',
    },
    problem: {
      zh: 'Expo 上架被 Google Play 16KB page size 卡住，环境配置和构建一堆坑？',
      en: 'Expo blocked by Google Play’s 16KB page size, with environment and build issues everywhere?',
    },
    outcomes: [
      { zh: 'React Native / Expo 应用开发与上架', en: 'React Native / Expo app development and store submission' },
      {
        zh: '原生构建问题排查（如 16KB page size）',
        en: 'Native build troubleshooting (e.g. the 16KB page size issue)',
      },
      { zh: '国内网络环境下的开发与发布实践', en: 'Dev and release practices for restricted-network regions' },
    ],
    categorySlug: 'react-native',
  },
];

export function getAllSolutions(): Solution[] {
  return SOLUTIONS;
}

export function getSolutionBySlug(slug: string): Solution | null {
  return SOLUTIONS.find((s) => s.slug === slug) ?? null;
}

export function localize(field: Localized, locale: string): string {
  return locale === 'en' ? field.en : field.zh;
}
