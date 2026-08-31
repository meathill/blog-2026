import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';

export type SupportedLocale = (typeof routing.locales)[number];

interface RootMetadataText {
  title: string;
  description: string;
  ogDescription: string;
  keywords: string[];
  ogLocale: string;
  url: string;
}

const ROOT_METADATA_TEXT: Record<SupportedLocale, RootMetadataText> = {
  zh: {
    title: 'Meathill Studio｜全栈工程 · Cloudflare · AI 应用',
    description:
      'Meathill Studio 是由 Meathill LLC 运营的一人工作室，拥有 20+ 年全栈开发经验。专注 Cloudflare 全栈架构、AI 应用与计费系统、React Native 跨端开发。',
    ogDescription: '20+ 年全栈开发经验的一人公司，远程交付。专注 Cloudflare 全栈、AI 应用与计费、跨端开发。',
    keywords: [
      'Meathill Studio',
      'Meathill LLC',
      '全栈开发',
      'Cloudflare',
      'Next.js',
      'AI 应用',
      '计费系统',
      'React Native',
    ],
    ogLocale: 'zh_CN',
    url: SITE_URL,
  },
  en: {
    title: 'Meathill Studio | Full-stack Engineering · Cloudflare · AI Apps',
    description:
      'Meathill Studio is a solo product and engineering studio operated by Meathill LLC, with 20+ years of full-stack experience across Cloudflare architecture, AI apps and billing, and React Native development.',
    ogDescription:
      'A solo studio with 20+ years of full-stack experience, delivering remotely. Cloudflare, AI apps & billing, cross-platform development.',
    keywords: [
      'Meathill Studio',
      'Meathill LLC',
      'full-stack development',
      'Cloudflare',
      'Next.js',
      'AI apps',
      'billing systems',
      'React Native',
      'remote development',
    ],
    ogLocale: 'en_US',
    url: `${SITE_URL}/en`,
  },
};

export function resolveSupportedLocale(locale: string | undefined): SupportedLocale {
  return routing.locales.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : routing.defaultLocale;
}

export function buildRootMetadata(locale: string | undefined): Metadata {
  const text = ROOT_METADATA_TEXT[resolveSupportedLocale(locale)];

  return {
    title: {
      default: text.title,
      template: '%s | Meathill Studio',
    },
    description: text.description,
    keywords: text.keywords,
    authors: [{ name: 'Meathill', url: SITE_URL }],
    creator: 'Meathill',
    metadataBase: new URL(SITE_URL),
    openGraph: {
      type: 'website',
      locale: text.ogLocale,
      url: text.url,
      siteName: 'Meathill Studio',
      title: text.title,
      description: text.ogDescription,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@meathill1',
      title: text.title,
      description: text.ogDescription,
      images: ['/api/og/home'],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
