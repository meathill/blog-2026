import { ArrowRightIcon } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getAllSolutions } from '@/lib/solutions';
import SolutionCard from '@/components/SolutionCard';

export default async function Solutions() {
  const locale = await getLocale();
  const t = await getTranslations('Solutions');
  const solutions = getAllSolutions();

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {t('home_title')}
            </h2>
            <p className="mt-2 text-muted-foreground">{t('home_subtitle')}</p>
          </div>

          <Link
            prefetch={false}
            href="/solutions"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            {t('view_all')} <ArrowRightIcon size={16} />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {solutions.map((solution) => (
            <SolutionCard key={solution.slug} solution={solution} locale={locale} learnMoreLabel={t('learn_more')} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            prefetch={false}
            href="/solutions"
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            {t('view_all')} <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
