import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Hero from '@/components/home/Hero';
import ValueStrip from '@/components/home/ValueStrip';
import Products from '@/components/home/Products';
import Solutions from '@/components/home/Solutions';
import Tools from '@/components/home/Tools';
import RecentPosts from '@/components/home/RecentPosts';
import ContactCTA from '@/components/home/ContactCTA';
import { SITE_URL } from '@/lib/constants';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/seo/jsonld';
import JsonLd from '@/components/JsonLd';

export const revalidate = 86400;

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const { locale } = await params;
  const canonical = locale === 'en' ? `${SITE_URL}/en` : SITE_URL;
  return {
    alternates: {
      canonical,
      languages: {
        zh: SITE_URL,
        en: `${SITE_URL}/en`,
        'x-default': SITE_URL,
      },
    },
  };
}

// ISR：构建期不预渲染任何路径，首个请求渲染后写入增量缓存（R2），按 revalidate 过期后台重建。
// 空数组 + dynamicParams（默认 true）= 全部按需生成；不要在这里列路径，见 DEV_NOTE「全站 ISR」。
export async function generateStaticParams() {
  return [];
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const organizationJsonLd = buildOrganizationJsonLd();
  const webSiteJsonLd = buildWebSiteJsonLd(locale);

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={webSiteJsonLd} />
      <Hero />
      <ValueStrip />
      <Products />
      <Solutions />
      <Tools />
      <RecentPosts />
      <ContactCTA />
    </>
  );
}
