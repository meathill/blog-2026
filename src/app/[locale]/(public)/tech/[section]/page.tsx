import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRightIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link, routing } from '@/i18n/routing';
import PostCard from '@/components/PostCard';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';
import { getPostPath } from '@/lib/post-utils';
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from '@/lib/seo/jsonld';
import { getAllTechSections, getTechSection, localize } from '@/lib/tech';
import { getTechSectionPosts } from '@/lib/tech-posts';
import { isTechSectionSlug, TECH_SECTION_SLUGS } from '@/lib/tech-sections';
import { stripHtml } from '@/lib/wordpress';

interface PageProps {
  params: Promise<{ locale: string; section: string }>;
}

export async function generateStaticParams() {
  const params: { locale: string; section: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of TECH_SECTION_SLUGS) {
      params.push({ locale, section: slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, section: sectionSlug } = await params;
  const t = await getTranslations({ locale, namespace: 'Tech' });
  const section = isTechSectionSlug(sectionSlug) ? getTechSection(sectionSlug) : null;

  if (!section) {
    return { title: t('notFoundTitle') };
  }

  const title = localize(section.title, locale);
  const description = localize(section.description, locale);
  const zhUrl = `${SITE_URL}/tech/${section.slug}`;
  const enUrl = `${SITE_URL}/en/tech/${section.slug}`;
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
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function TechSectionPage({ params }: PageProps) {
  const { locale, section: sectionSlug } = await params;
  const section = isTechSectionSlug(sectionSlug) ? getTechSection(sectionSlug) : null;

  if (!section) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'Tech' });
  const title = localize(section.title, locale);
  const intro = localize(section.intro, locale);
  const posts = await getTechSectionPosts(section);
  const otherSections = getAllTechSections().filter((other) => other.slug !== section.slug);
  const baseUrl = locale === 'en' ? `${SITE_URL}/en` : SITE_URL;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: t('home'), url: baseUrl },
    { name: t('title'), url: `${baseUrl}/tech` },
    { name: title, url: `${baseUrl}/tech/${section.slug}` },
  ]);
  const itemListJsonLd =
    posts.length > 0
      ? buildItemListJsonLd({
          name: title,
          description: intro,
          items: posts.map((post) => ({
            url: `${baseUrl}${getPostPath(post)}`,
            name: stripHtml(post.title.rendered),
          })),
        })
      : null;

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-8 flex items-center text-sm text-muted-foreground max-w-6xl mx-auto">
        <Link href="/" className="hover:text-foreground transition-colors">
          {t('home')}
        </Link>
        <span className="mx-2">/</span>
        <Link href="/tech" className="hover:text-foreground transition-colors">
          {t('title')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium truncate">{title}</span>
      </nav>

      <header className="max-w-3xl mx-auto mb-12">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
          <section.icon size={26} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">{intro}</p>
      </header>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto rounded-2xl border border-dashed border-[var(--surface-border)] p-10 text-center">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{t('emptyTitle')}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">{t('emptyDescription')}</p>
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 hover:-translate-y-0.5 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {t('browsePosts')} <ArrowRightIcon size={16} />
          </Link>

          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mb-3">
              {t('moreSections')}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {otherSections.map((other) => (
                <Link
                  key={other.slug}
                  href={`/tech/${other.slug}`}
                  className="text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
                >
                  {localize(other.title, locale)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
