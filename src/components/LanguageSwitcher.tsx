'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

export default function LanguageSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    // 保留 query string（如 /search?q=...、/app?tag=...），否则切语言后参数丢失
    const query = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(query ? `${pathname}${query}` : pathname, { locale: nextLocale });
  }

  return (
    <label className="flex gap-2 items-center text-sm text-muted-foreground">
      {t('label')}
      <select
        value={locale}
        className="bg-transparent border-none outline-none cursor-pointer hover:text-foreground transition-colors"
        onChange={onSelectChange}
      >
        <option value="en">{t('en')}</option>
        <option value="zh">{t('zh')}</option>
      </select>
    </label>
  );
}
