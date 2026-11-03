import { ArrowUpRightIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';

const FRIEND_LINKS = [{ name: 'Roland', url: 'https://ro.cafe', domain: 'ro.cafe' }];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Friends' });
  const zhUrl = `${SITE_URL}/friend`;
  const enUrl = `${SITE_URL}/en/friend`;
  const canonical = locale === 'en' ? enUrl : zhUrl;

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical,
      languages: { zh: zhUrl, en: enUrl, 'x-default': zhUrl },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: canonical,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      alternateLocale: locale === 'en' ? 'zh_CN' : 'en_US',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
  };
}

export async function generateStaticParams() {
  return [];
}

export default async function FriendsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Friends' });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">{t('title')}</h1>
        <p className="mt-6 text-lg text-[var(--text-secondary)]">{t('description')}</p>
      </header>
      <ul className="divide-y divide-[var(--surface-border)] border-y border-[var(--surface-border)]">
        {FRIEND_LINKS.map((friend) => (
          <li key={friend.url} className="flex flex-wrap items-center justify-between gap-4 py-6">
            <a
              href={friend.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm text-xl font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              {friend.name}
              <ArrowUpRightIcon size={20} aria-hidden="true" />
            </a>
            <span className="text-sm text-[var(--text-secondary)]">{friend.domain}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
