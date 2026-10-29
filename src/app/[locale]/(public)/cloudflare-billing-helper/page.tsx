import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  AlarmClockIcon,
  ArrowRightIcon,
  BoxesIcon,
  CheckIcon,
  GaugeIcon,
  GithubIcon,
  LayersIcon,
  LockIcon,
  PuzzleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import JsonLd from '@/components/JsonLd';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from '@/lib/seo/jsonld';
import { GITHUB_URL, getBillingHelperContent } from '@/lib/billing-helper';

interface PageProps {
  params: Promise<{ locale: string }>;
}

// ISR：与全站一致，构建期不预渲染任何路径，首个请求渲染后写入增量缓存。
export async function generateStaticParams() {
  return [];
}

const PATH = '/cloudflare-billing-helper';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const content = getBillingHelperContent(locale);
  const zhUrl = `${SITE_URL}${PATH}`;
  const enUrl = `${SITE_URL}/en${PATH}`;
  const canonical = locale === 'en' ? enUrl : zhUrl;
  const title = `${content.title} ${content.titleHighlight}`;
  return {
    title,
    description: content.subtitle,
    alternates: {
      canonical,
      languages: { zh: zhUrl, en: enUrl, 'x-default': zhUrl },
    },
    openGraph: {
      title,
      description: content.subtitle,
      url: canonical,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

const FEATURE_ICONS = [GaugeIcon, AlarmClockIcon, WalletIcon, LayersIcon, TrendingUpIcon, ShieldCheckIcon];

export default async function BillingHelperLandingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SolutionDetail' });
  const content = getBillingHelperContent(locale);
  const baseUrl = locale === 'en' ? `${SITE_URL}/en` : SITE_URL;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: t('home'), url: baseUrl },
    { name: `${content.title} ${content.titleHighlight}`, url: `${baseUrl}${PATH}` },
  ]);
  const faqJsonLd = buildFaqJsonLd(content.faqs);

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}

      <nav className="mb-8 flex items-center text-sm text-muted-foreground">
        <Link prefetch={false} href="/" className="transition-colors hover:text-foreground">
          {t('home')}
        </Link>
        <span className="mx-2">/</span>
        <span className="truncate font-medium text-foreground">
          {content.title} {content.titleHighlight}
        </span>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-3xl text-center">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img
            src="/images/cloudflare-billing-helper/icon-128.png"
            alt=""
            width={56}
            height={56}
            className="rounded-2xl shadow-lg"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <PuzzleIcon size={14} aria-hidden="true" />
            {content.badge}
          </span>
        </div>
        <h1 className="mb-6 font-bold">
          <span className="mb-2 block text-2xl font-semibold text-muted-foreground md:text-3xl">{content.title}</span>
          <span className="block text-4xl md:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {content.titleHighlight}
            </span>
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
          {content.subtitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-6 py-3 font-semibold text-amber-50 transition-colors hover:bg-amber-800"
          >
            <GithubIcon size={18} aria-hidden="true" />
            {content.ctaPrimary}
          </a>
          <a
            href="#install"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-semibold transition-colors hover:bg-muted"
          >
            {content.ctaSecondary}
            <ArrowRightIcon size={18} aria-hidden="true" />
          </a>
        </div>
      </header>

      {/* 截图 */}
      <figure className="mx-auto mt-14 max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-border bg-muted/30 p-2 shadow-sm md:p-3">
          <img
            src="/images/cloudflare-billing-helper/panel.png"
            alt={content.screenshotAlt}
            width={2048}
            height={1112}
            className="h-auto w-full rounded-xl"
            loading="eager"
          />
        </div>
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">{content.screenshotCaption}</figcaption>
      </figure>

      {/* 痛点 */}
      <section className="mx-auto mt-20 max-w-5xl">
        <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">{content.problemTitle}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {content.problems.map((problem, index) => (
            <div key={problem.title} className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-amber-500/10 font-bold text-amber-700 dark:text-amber-300">
                {index + 1}
              </div>
              <h3 className="mb-2 font-semibold">{problem.title}</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{problem.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 功能 */}
      <section className="mx-auto mt-20 max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">{content.featuresTitle}</h2>
          <p className="mt-3 text-[var(--text-secondary)]">{content.featuresSubtitle}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.features.map((feature, index) => {
            const Icon = FEATURE_ICONS[index] ?? SparklesIcon;
            return (
              <div key={feature.title} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 按应用拆分 */}
      <section className="mx-auto mt-20 max-w-5xl rounded-2xl border border-border bg-muted/30 p-6 md:p-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="mb-4 text-2xl font-bold md:text-3xl">{content.breakdownTitle}</h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">{content.breakdownDesc}</p>
          </div>
          <ul className="space-y-3">
            {content.breakdownItems.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                <BoxesIcon size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 安装 */}
      <section id="install" className="mx-auto mt-20 max-w-3xl scroll-mt-24">
        <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">{content.installTitle}</h2>
        <ol className="space-y-4">
          {content.installSteps.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-xl border border-border bg-card p-5">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 font-semibold text-amber-700 dark:text-amber-300">
                {index + 1}
              </span>
              <div>
                <h3 className="mb-1 font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <pre className="mt-6 overflow-x-auto rounded-xl border border-border bg-zinc-950 p-5 text-sm text-zinc-100">
          <code>{content.installCode}</code>
        </pre>
      </section>

      {/* 隐私 */}
      <section className="mx-auto mt-20 max-w-3xl rounded-xl border border-emerald-600/20 bg-emerald-500/5 p-6 md:p-8">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
          <LockIcon size={20} className="text-emerald-600" aria-hidden="true" />
          {content.privacyTitle}
        </h2>
        <p className="leading-relaxed text-[var(--text-secondary)]">{content.privacyDesc}</p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]">
          {content.privacyBullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-2">
              <CheckIcon size={16} className="text-emerald-600" aria-hidden="true" />
              {bullet}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">{content.faqTitle}</h2>
        <dl className="divide-y divide-border rounded-xl border border-border bg-card">
          {content.faqs.map((faq) => (
            <div key={faq.question} className="p-5">
              <dt className="mb-2 font-semibold">{faq.question}</dt>
              <dd className="text-sm leading-relaxed text-[var(--text-secondary)]">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 底部 CTA */}
      <section className="mx-auto mt-20 max-w-3xl rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-center text-white shadow-lg md:p-12">
        <h2 className="mb-3 text-2xl font-bold md:text-3xl">{content.footerTitle}</h2>
        <p className="mb-6 text-amber-50/90">{content.footerDesc}</p>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-amber-700 transition-colors hover:bg-amber-50"
        >
          <GithubIcon size={18} aria-hidden="true" />
          {content.footerCta}
        </a>
      </section>
    </div>
  );
}
