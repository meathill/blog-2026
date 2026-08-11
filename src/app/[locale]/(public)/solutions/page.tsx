import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import SolutionCard from '@/components/SolutionCard';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';
import { buildItemListJsonLd } from '@/lib/seo/jsonld';
import { getAllSolutions, localize } from '@/lib/solutions';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Solutions' });
  const zhUrl = `${SITE_URL}/solutions`;
  const enUrl = `${SITE_URL}/en/solutions`;
  const canonical = locale === 'en' ? enUrl : zhUrl;
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical,
      languages: { zh: zhUrl, en: enUrl, 'x-default': zhUrl },
    },
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      url: canonical,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function SolutionsListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Solutions' });
  const solutions = getAllSolutions();
  const baseUrl = locale === 'en' ? `${SITE_URL}/en` : SITE_URL;
  const itemListJsonLd = buildItemListJsonLd({
    name: t('title'),
    description: t('subtitle'),
    items: solutions.map((solution) => ({
      url: `${baseUrl}/solutions/${solution.slug}`,
      name: localize(solution.title, locale),
    })),
  });

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-responsive-hero mb-6 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
        {solutions.map((solution) => (
          <SolutionCard key={solution.slug} solution={solution} locale={locale} learnMoreLabel={t('learn_more')} />
        ))}
      </div>
    </div>
  );
}
