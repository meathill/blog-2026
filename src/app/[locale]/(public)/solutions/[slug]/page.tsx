import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Link, routing } from '@/i18n/routing';
import { getAllSolutions, getSolutionBySlug, localize } from '@/lib/solutions';
import { getCategoryBySlug, getPostsByCategory } from '@/lib/wordpress';
import PostCard from '@/components/PostCard';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const solution of getAllSolutions()) {
      params.push({ locale, slug: solution.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SolutionDetail' });
  const solution = getSolutionBySlug(slug);
  if (!solution) {
    return { title: t('not_found_title') };
  }
  const title = localize(solution.title, locale);
  const description = localize(solution.tagline, locale);
  const zhUrl = `${SITE_URL}/solutions/${slug}`;
  const enUrl = `${SITE_URL}/en/solutions/${slug}`;
  const canonical = locale === 'en' ? enUrl : zhUrl;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { zh: zhUrl, en: enUrl, 'x-default': zhUrl },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function SolutionDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SolutionDetail' });
  const solution = getSolutionBySlug(slug);
  if (!solution) {
    notFound();
  }

  const Icon = solution.icon;
  const title = localize(solution.title, locale);
  const baseUrl = locale === 'en' ? `${SITE_URL}/en` : SITE_URL;

  let relatedPosts: Awaited<ReturnType<typeof getPostsByCategory>>['posts'] = [];
  if (solution.categorySlug) {
    try {
      const category = await getCategoryBySlug(solution.categorySlug);
      if (category) {
        const result = await getPostsByCategory(category.id, 1, 3);
        relatedPosts = result.posts;
      }
    } catch {
      // 相关文章拉取失败（如 WordPress 不可达）不应影响方案页主体
      relatedPosts = [];
    }
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('home'), item: baseUrl },
      { '@type': 'ListItem', position: 2, name: t('back_to_list'), item: `${baseUrl}/solutions` },
      { '@type': 'ListItem', position: 3, name: title, item: `${baseUrl}/solutions/${solution.slug}` },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav className="mb-8 flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          {t('home')}
        </Link>
        <span className="mx-2">/</span>
        <Link href="/solutions" className="hover:text-foreground transition-colors">
          {t('back_to_list')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium truncate">{title}</span>
      </nav>

      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <Icon size={26} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {localize(solution.tagline, locale)}
          </p>
        </header>

        <section className="mb-10 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600 mb-3">{t('problem_label')}</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">{localize(solution.problem, locale)}</p>
        </section>

        <section className="mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600 mb-4">{t('outcomes_label')}</h2>
          <ul className="space-y-3">
            {solution.outcomes.map((outcome) => (
              <li key={outcome.zh} className="flex items-start gap-3">
                <CheckIcon size={20} className="mt-0.5 shrink-0 text-amber-600" />
                <span className="text-[var(--text-secondary)] leading-relaxed">{localize(outcome, locale)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">{t('cta_title')}</h2>
          <p className="mb-6 opacity-90">{t('cta_desc')}</p>
          <a
            href={`mailto:meathill@gmail.com?subject=${encodeURIComponent(title)}`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-amber-700 shadow-lg transition-all hover:-translate-y-0.5"
          >
            {t('cta_button')} <ArrowRightIcon size={18} />
          </a>
        </section>

        {relatedPosts.length > 0 && (
          <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-16">
            <h2 className="text-2xl font-bold mb-8">{t('related_posts')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-16">
          <Link
            href="/solutions"
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-500"
          >
            ← {t('back_to_list')}
          </Link>
        </div>
      </div>
    </div>
  );
}
