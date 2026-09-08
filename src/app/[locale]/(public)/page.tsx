import type { Metadata } from 'next';
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

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
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
