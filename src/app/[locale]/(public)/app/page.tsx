import { getDb } from '@/lib/db';
import { apps, appTranslations } from '@/db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import AppCard from '@/components/AppCard';
import ProductCard from '@/components/ProductCard';
import { getAppCoverMap, getPublicAppTagsMap, type PublicAppCardData, type PublicAppTag } from '@/lib/public-apps';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Apps' });
  const zhUrl = `${SITE_URL}/app`;
  const enUrl = `${SITE_URL}/en/app`;
  const canonical = locale === 'en' ? enUrl : zhUrl;

  return {
    title: t('title'),
    description: t('subtitle_page'),
    alternates: {
      canonical,
      languages: {
        zh: zhUrl,
        en: enUrl,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('subtitle_page'),
      url: canonical,
      type: 'website',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

interface AppListPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string }>;
}

export default async function AppListPage({ params, searchParams }: AppListPageProps) {
  const { locale } = await params;
  const { tag: activeTag } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'Apps' });
  const db = await getDb();
  const result = await db
    .select()
    .from(apps)
    .leftJoin(appTranslations, and(eq(appTranslations.appId, apps.id), eq(appTranslations.locale, locale)))
    .where(eq(apps.status, 'published'))
    .orderBy(desc(apps.featured), asc(apps.sortOrder), desc(apps.createdAt));

  const appIds = result.map(({ apps: app }) => app.id);
  const tagMap = await getPublicAppTagsMap(appIds);
  const coverMap = await getAppCoverMap(appIds);

  const allApps = result.map(({ apps: app, app_translations: translation }) => ({
    ...app,
    name: translation?.name || app.name,
    description: translation?.description || app.description,
    content: translation?.content || app.content,
    coverImage: coverMap.get(app.id) ?? null,
    tags: tagMap.get(app.id) ?? [],
  }));

  // 收集所有标签作为筛选条
  const tagById = new Map<string, PublicAppTag>();
  for (const tags of tagMap.values()) {
    for (const tag of tags) tagById.set(tag.id, tag);
  }
  const allTags = [...tagById.values()].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = activeTag ? allApps.filter((a) => a.tags.some((tag) => tag.slug === activeTag)) : allApps;
  const featuredApps = !activeTag ? allApps.filter((a) => a.featured) : [];

  function toCardData(a: (typeof allApps)[number]): PublicAppCardData {
    return a;
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
        <h1 className="text-responsive-hero mb-6 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">{t('subtitle_page')}</p>
      </div>

      {featuredApps.length > 0 && (
        <section className="mb-16 max-w-6xl mx-auto">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-amber-600">{t('featured_label')}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredApps.map((app) => (
              <ProductCard key={app.id} app={toCardData(app)} tags={app.tags} i18n={{ visit: t('visit') }} />
            ))}
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">{t('all_label')}</h2>
        </div>

        {allTags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              prefetch={false}
              href="/app"
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                !activeTag
                  ? 'border-amber-600 bg-amber-600 text-white'
                  : 'border-[var(--surface-border)] text-[var(--text-secondary)] hover:border-amber-600 hover:text-amber-600'
              }`}
            >
              {t('filter_all')}
            </Link>
            {allTags.map((tag) => (
              <Link
                prefetch={false}
                key={tag.id}
                href={`/app?tag=${tag.slug}`}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  activeTag === tag.slug
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-[var(--surface-border)] text-[var(--text-secondary)] hover:border-amber-600 hover:text-amber-600'
                }`}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => (
            <AppCard key={app.id} app={app} tags={app.tags} i18n={{ open_app: t('open_app') }} />
          ))}
        </div>

        {filtered.length === 0 && <div className="text-center py-12 text-zinc-500 italic">{t('coming_soon')}</div>}
      </div>
    </div>
  );
}
