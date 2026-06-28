import { ArrowRightIcon } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getCachedFeaturedApps } from '@/lib/public-apps';
import ProductCard from '@/components/ProductCard';

export default async function Products() {
  const locale = await getLocale();
  const t = await getTranslations('Apps');
  const featured = await getCachedFeaturedApps(locale);

  if (featured.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {t('home_title')}
            </h2>
            <p className="mt-2 text-muted-foreground">{t('home_subtitle')}</p>
          </div>

          <Link
            href="/app"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            {t('view_all')} <ArrowRightIcon size={16} />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(({ app, tags }) => (
            <ProductCard key={app.id} app={app} tags={tags} i18n={{ visit: t('visit') }} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/app"
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            {t('view_all')} <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
