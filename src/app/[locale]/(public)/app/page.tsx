import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import AppCard from '@/components/AppCard';
import type { Metadata } from 'next';
import { getAppTags } from '@/actions/tags';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Apps' });
  return {
    title: t('title'),
    description: t('subtitle_page'),
  };
}

export default async function AppListPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Apps' });
  const db = await getDb();
  const publishedApps = await db.select().from(apps).where(eq(apps.status, 'published')).orderBy(desc(apps.createdAt));

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-responsive-hero mb-6 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">{t('subtitle_page')}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {
          await Promise.all(
            publishedApps.map(async (app) => {
              const tags = await getAppTags(app.id);
              return <AppCard key={app.id} app={app} tags={tags} i18n={{ open_app: t('open_app') }} />;
            }),
          )
        }
      </div>

      {publishedApps.length === 0 && <div className="text-center py-12 text-zinc-500 italic">{t('coming_soon')}</div>}
    </div>
  );
}
