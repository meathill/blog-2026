import { Metadata } from 'next';
import './about.css';
import {
  GithubIcon,
  YoutubeIcon,
  TwitterIcon,
  MailIcon,
  MapPinIcon,
  CalendarIcon,
  CodeIcon,
  DumbbellIcon,
  PlaneIcon,
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import AwesomeComment from '@/components/AwesomeComment';
import JsonLd from '@/components/JsonLd';
import { getAboutContent } from '@/actions/about';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';
import { buildBreadcrumbJsonLd, buildOrganizationJsonLd } from '@/lib/seo/jsonld';
import { marked } from 'marked';
import { demoteBodyH1, withImageAltFallback } from '@/lib/wordpress/content';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const canonicalUrl = `${SITE_URL}${locale === 'en' ? '/en' : ''}/about`;

  // title 只放页面名。根 layout 的 title.template 不再追加站名（issue #15：后缀把标题撑过 Bing 上限）。
  return {
    title: t('about_title'),
    description: t('about_description'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        zh: `${SITE_URL}/about`,
        en: `${SITE_URL}/en/about`,
        'x-default': `${SITE_URL}/about`,
      },
    },
    openGraph: {
      title: t('about_title'),
      description: t('about_og_description'),
      url: canonicalUrl,
      type: 'website',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

const socialLinks = [
  { href: 'https://github.com/meathill', label: 'GitHub', icon: GithubIcon, username: '@meathill' },
  { href: 'https://youtube.com/@meathill', label: 'YouTube', icon: YoutubeIcon, username: '@meathill' },
  { href: 'https://x.com/meathill1', label: 'X (Twitter)', icon: TwitterIcon, username: '@meathill1' },
  { href: 'mailto:meathill@gmail.com', label: 'Email', icon: MailIcon, username: 'meathill@gmail.com' },
];

// 技能条目与职业旅程文案按 locale 取自 messages/About；items 是技术名词，不翻译
const skills = [
  { categoryKey: 'skill_frontend', items: ['Vue.js', 'React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
  { categoryKey: 'skill_backend', items: ['Node.js', 'Python', 'PHP', 'MySQL', 'D1 / TiDB'] },
  { categoryKey: 'skill_cloud', items: ['Cloudflare Workers', 'R2', 'Hyperdrive', 'Docker'] },
  { categoryKey: 'skill_ai', items: ['OpenAI', 'Claude', 'Stripe', 'Supabase'] },
  { categoryKey: 'skill_mobile', items: ['React Native', 'Expo'] },
];

const timeline = [
  { year: '2006', eventKey: 'timeline_2006' },
  { year: '2012', eventKey: 'timeline_2012' },
  { year: '2015', eventKey: 'timeline_2015' },
  { year: '2017', eventKey: 'timeline_2017' },
  { year: '2023', eventKey: 'timeline_2023' },
  { year: '2025', eventKey: 'timeline_2025' },
];

// ISR：构建期不预渲染任何路径，首个请求渲染后写入增量缓存（R2），按 revalidate 过期后台重建。
// 空数组 + dynamicParams（默认 true）= 全部按需生成；不要在这里列路径，见 DEV_NOTE「全站 ISR」。
export async function generateStaticParams() {
  return [];
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'About' });
  const aboutContent = await getAboutContent(locale);

  const organizationJsonLd = buildOrganizationJsonLd();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: '首页', url: SITE_URL },
    { name: '关于', url: `${SITE_URL}${locale === 'en' ? '/en' : ''}/about` },
  ]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <section className="text-center mb-16">
          {/* Avatar */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 animate-pulse-glow" />
            <div className="relative w-full h-full rounded-full bg-[var(--surface)] border-4 border-[var(--background)] flex items-center justify-center text-4xl">
              🏋️
            </div>
          </div>

          <h1 className="text-responsive-title mb-4">
            <span className="text-gradient">Meathill</span>
          </h1>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--surface-border)] bg-[var(--surface)] px-4 py-1.5 text-sm text-[var(--text-secondary)]">
            {t('badge')}
          </div>

          <p className="text-xl text-[var(--text-secondary)] mb-6 max-w-2xl mx-auto">{t('hero_intro')}</p>

          {/* Quick Info */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <MapPinIcon size={14} />
              {t('location')}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarIcon size={14} />
              {t('since')}
            </span>
            <span className="inline-flex items-center gap-1">
              <CodeIcon size={14} />
              {t('role')}
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                <link.icon size={18} />
                <span className="text-sm">{link.username}</span>
              </a>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gradient mb-6">{t('about_title')}</h2>
          <div
            className="prose prose-invert max-w-none text-[var(--text-secondary)]"
            dangerouslySetInnerHTML={{
              __html: aboutContent?.content
                ? withImageAltFallback(demoteBodyH1(String(marked(aboutContent.content))), 'Meathill')
                : `<p>${t('fallback_intro')}</p>`,
            }}
          />
        </section>

        {/* GitHub Section */}
        {aboutContent?.githubContent && (
          <section className="mb-16">
            <h2 className="text-xl font-bold text-gradient mb-6">GitHub Profile</h2>
            <div
              className="prose prose-invert max-w-none p-6 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]"
              dangerouslySetInnerHTML={{
                __html: withImageAltFallback(demoteBodyH1(String(marked(aboutContent.githubContent))), 'Meathill'),
              }}
            />
          </section>
        )}

        {/* Skills Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gradient mb-6">{t('tech_stack_title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.categoryKey}
                className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]"
              >
                <h3 className="text-sm font-semibold text-[var(--accent)] mb-3">{t(skill.categoryKey)}</h3>
                <ul className="space-y-1">
                  {skill.items.map((item) => (
                    <li key={item} className="text-sm text-[var(--text-secondary)]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Hobbies Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gradient mb-6">{t('hobbies_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-xl glass glow">
              <div className="flex items-center gap-3 mb-4">
                <DumbbellIcon size={24} className="text-[var(--accent)]" />
                <h3 className="text-lg font-semibold">{t('powerlifting')}</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gradient">190kg</div>
                  <div className="text-xs text-[var(--text-muted)]">{t('squat')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gradient">130kg</div>
                  <div className="text-xs text-[var(--text-muted)]">{t('bench')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gradient">220kg</div>
                  <div className="text-xs text-[var(--text-muted)]">{t('deadlift')}</div>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]">
              <div className="flex items-center gap-3 mb-4">
                <PlaneIcon size={24} className="text-[var(--accent)]" />
                <h3 className="text-lg font-semibold">{t('travel')}</h3>
              </div>
              <p className="text-[var(--text-secondary)] text-sm">{t('travel_desc')}</p>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-gradient mb-6">{t('career_title')}</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--surface-border)]" />
            <ul className="space-y-6">
              {timeline.map((item) => (
                <li key={item.year} className="relative pl-12">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-[var(--surface)] border-2 border-[var(--accent)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                  </div>
                  <div className="text-sm text-[var(--accent)] font-medium">{item.year}</div>
                  <div className="text-[var(--text-secondary)]">{t(item.eventKey)}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact Section */}
        <section className="text-center">
          <h2 className="text-xl font-bold text-gradient mb-6">{t('contact_title')}</h2>
          <p className="text-[var(--text-secondary)] mb-6">{t('contact_desc')}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={`mailto:meathill@gmail.com?subject=${encodeURIComponent(`[Meathill LLC] ${t('mail_subject')}`)}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              ✉️ {t('cta_contact')}
            </a>
            <Link
              prefetch={false}
              href="/solutions"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
            >
              🧩 {t('cta_solutions')}
            </Link>
            <Link
              prefetch={false}
              href="/app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
            >
              🚀 {t('cta_products')}
            </Link>
          </div>
        </section>

        <AwesomeComment />
      </div>
    </div>
  );
}
