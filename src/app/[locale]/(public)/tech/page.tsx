import type { Metadata } from 'next';
import { ArrowRightIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import PostCard from '@/components/PostCard';
import TechSectionCard from '@/components/tech/tech-section-card';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from '@/lib/seo/jsonld';
import { getAllTechSections, localize } from '@/lib/tech';
import { getTechHubPreviews, getTechSectionPosts } from '@/lib/tech-posts';
import type { TechSectionSlug } from '@/lib/tech-sections';

const HUB_PREVIEW_COUNT = 3;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Tech' });
  const zhUrl = `${SITE_URL}/tech`;
  const enUrl = `${SITE_URL}/en/tech`;
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

export default async function TechHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Tech' });
  const sections = getAllTechSections();
  const baseUrl = locale === 'en' ? `${SITE_URL}/en` : SITE_URL;

  const [previewsBySection, sectionPostCounts] = await Promise.all([
    getTechHubPreviews(HUB_PREVIEW_COUNT),
    Promise.all(sections.map((section) => getTechSectionPosts(section))),
  ]);
  const countsBySlug = Object.fromEntries(
    sections.map((section, index) => [section.slug, sectionPostCounts[index].length]),
  ) as Record<TechSectionSlug, number>;

  const itemListJsonLd = buildItemListJsonLd({
    name: t('title'),
    description: t('subtitle'),
    items: sections.map((section) => ({
      url: `${baseUrl}/tech/${section.slug}`,
      name: localize(section.title, locale),
    })),
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: t('home'), url: baseUrl },
    { name: t('title'), url: `${baseUrl}/tech` },
  ]);

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-responsive-hero mb-6 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-lg text-[var(--text-secondary)]">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto mb-20">
        {sections.map((section) => (
          <TechSectionCard
            key={section.slug}
            section={section}
            locale={locale}
            postsCountLabel={t('postsCount', { count: countsBySlug[section.slug] })}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto space-y-16">
        {sections.map((section) => {
          const posts = previewsBySection[section.slug];
          return (
            <section key={section.slug}>
              <div className="flex items-end justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold">
                  <span className="text-gradient">{localize(section.title, locale)}</span>
                </h2>
                <Link
                  prefetch={false}
                  href={`/tech/${section.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-500 transition-all group shrink-0"
                >
                  {t('viewAll')}
                  <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--surface-border)] p-10 text-center">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{t('emptyTitle')}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{t('emptyDescription')}</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
