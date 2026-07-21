import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';
import { routing } from '@/i18n/routing';

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
    title: 'Meathill LLC — 全栈工程 · Cloudflare · AI 应用',
    description:
      'Meathill LLC：20+ 年全栈开发经验的一人公司，远程交付。专注 Cloudflare 全栈架构与迁移、AI 应用与计费系统、React Native 跨端开发。',
    ogDescription: '20+ 年全栈开发经验的一人公司，远程交付。专注 Cloudflare 全栈、AI 应用与计费、跨端开发。',
    keywords: ['Meathill LLC', '全栈开发', 'Cloudflare', 'Next.js', 'AI 应用', '计费系统', 'React Native', '远程开发'],
    ogLocale: 'zh_CN',
    url: SITE_URL,
  },
  en: {
    title: 'Meathill LLC — Full-stack Engineering · Cloudflare · AI Apps',
    description:
      'Meathill LLC: a solo studio with 20+ years of full-stack experience, delivering remotely. Focused on Cloudflare architecture and migration, AI apps and billing systems, and React Native cross-platform development.',
    ogDescription:
      'A solo studio with 20+ years of full-stack experience, delivering remotely. Cloudflare, AI apps & billing, cross-platform development.',
    keywords: [
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
      template: '%s | Meathill LLC',
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
      siteName: 'Meathill LLC',
      title: text.title,
      description: text.ogDescription,
      images: [
        {
          url: '/api/og/home',
          width: 1200,
          height: 630,
          alt: 'Meathill LLC',
        },
      ],
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
