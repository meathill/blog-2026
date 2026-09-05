import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link, routing } from '@/i18n/routing';
import { Github, TagIcon } from 'lucide-react';
import { getAllSkills, getLocalizedDescription, getSkillBySlug, getSkillSourceUrl } from '@/lib/skills';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  const skills = getAllSkills();
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const skill of skills) {
      params.push({ locale, slug: skill.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SkillDetail' });
  const skill = getSkillBySlug(slug);

  if (!skill) {
    return { title: t('not_found_title') };
  }

  const description = getLocalizedDescription(skill, locale);
  const zhUrl = `${SITE_URL}/skills/${slug}`;
  const enUrl = `${SITE_URL}/en/skills/${slug}`;
  const canonical = locale === 'en' ? enUrl : zhUrl;
  return {
    title: skill.name,
    description,
    keywords: ['Claude Code', 'Skill', skill.name, skill.package, ...skill.tags],
    alternates: {
      canonical,
      languages: {
        zh: zhUrl,
        en: enUrl,
        'x-default': zhUrl,
      },
    },
    openGraph: {
      title: skill.name,
      description,
      url: canonical,
      type: 'article',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      alternateLocale: locale === 'en' ? 'zh_CN' : 'en_US',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: skill.name,
      description,
    },
  };
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SkillDetail' });
  const skill = getSkillBySlug(slug);

  if (!skill) {
    notFound();
  }

  const description = getLocalizedDescription(skill, locale);
  const sourceUrl = getSkillSourceUrl(skill);
  const baseUrl = locale === 'en' ? `${SITE_URL}/en` : SITE_URL;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: skill.name,
    description,
    inLanguage: locale === 'en' ? 'en-US' : 'zh-CN',
    url: `${baseUrl}/skills/${skill.slug}`,
    author: {
      '@type': 'Person',
      name: 'meathill',
      url: SITE_URL,
    },
    keywords: ['Claude Code', 'Skill', skill.package, ...skill.tags],
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('home'), item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Skills', item: `${baseUrl}/skills` },
      { '@type': 'ListItem', position: 3, name: skill.name, item: `${baseUrl}/skills/${skill.slug}` },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav className="mb-8 flex items-center text-sm text-muted-foreground">
        <Link prefetch={false} href="/" className="hover:text-foreground transition-colors">
          {t('home')}
        </Link>
        <span className="mx-2">/</span>
        <Link prefetch={false} href="/skills" className="hover:text-foreground transition-colors">
          Skills
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium truncate">{skill.name}</span>
      </nav>

      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{skill.name}</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-6 leading-relaxed">{description}</p>

          <div className="flex flex-wrap gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 text-sm font-medium">
              <TagIcon size={14} className="opacity-70" />
              {t('package')}: {skill.package}
            </span>
            {skill.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-sm font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>

          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 hover:-translate-y-0.5 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {t('view_source')} <Github size={18} />
          </a>
        </header>

        <div className="mt-12 rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-3">{t('how_to_use_title')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{t('how_to_use_body')}</p>
        </div>

        <div className="mt-16">
          <Link
            prefetch={false}
            href="/skills"
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-500"
          >
            ← {t('back_to_list')}
          </Link>
        </div>
      </div>
    </div>
  );
}
