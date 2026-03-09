import AppCard from '@/components/AppCard';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import { getCachedFeaturedApps } from '@/lib/public-apps';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function FeaturedApps() {
  const locale = await getLocale();
  const t = await getTranslations('Apps');
  const featuredApps = await getCachedFeaturedApps(locale);

  if (featuredApps.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {t('title')}
            </h2>
            <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
          </div>

          <Link
            href="/app"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            {t('view_all')} <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredApps.map(({ app, tags }) => (
            <AppCard key={app.id} app={app} tags={tags} i18n={{ open_app: t('open_app') }} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/app"
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            {t('view_all')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
