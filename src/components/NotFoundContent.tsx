'use client';

import { ArrowLeftIcon, HomeIcon, SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function NotFoundContent() {
  const t = useTranslations('NotFound');

  return (
    <div data-blog-not-found="true" className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Number */}
        <div className="relative mb-8">
          <div className="text-[10rem] font-black text-gradient leading-none opacity-20">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">🤔</div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('title')}</h1>
        <p className="text-[var(--text-secondary)] mb-8">
          {t('description_1')}
          <br />
          {t('description_2')}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            prefetch={false}
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <HomeIcon size={18} />
            {t('back_home')}
          </Link>
          <Link
            prefetch={false}
            href="/posts"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-[var(--text-primary)] font-semibold hover:bg-[var(--surface-hover)] transition-all"
          >
            <SearchIcon size={18} />
            {t('browse_posts')}
          </Link>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-8 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeftIcon size={14} />
          {t('go_back')}
        </button>
      </div>
    </div>
  );
}
