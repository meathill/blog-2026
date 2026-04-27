import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAllSkills } from '@/lib/skills';
import SkillCard from '@/components/SkillCard';
import { SITE_URL } from '@/lib/constants';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Skills' });
  const zhUrl = `${SITE_URL}/skills`;
  const enUrl = `${SITE_URL}/en/skills`;
  const canonical = locale === 'en' ? enUrl : zhUrl;
  return {
    title: t('title'),
    description: t('subtitle'),
    keywords: ['Claude Code', 'Skills', 'AI', 'meathill'],
    alternates: {
      canonical,
      languages: {
        zh: zhUrl,
        en: enUrl,
        'x-default': zhUrl,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      url: canonical,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      alternateLocale: locale === 'en' ? 'zh_CN' : 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('subtitle'),
    },
  };
}

export default async function SkillsListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Skills' });
  const skills = getAllSkills();
  const baseUrl = locale === 'en' ? `${SITE_URL}/en` : SITE_URL;
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('title'),
    description: t('subtitle'),
    itemListElement: skills.map((skill, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/skills/${skill.slug}`,
      name: skill.name,
    })),
  };

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

      {skills.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 italic">{t('empty')}</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <SkillCard key={skill.slug} skill={skill} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
