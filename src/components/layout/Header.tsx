import { BrandSiteSwitcher } from 'meathill-brand-react';
import { SearchIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { DesktopNav } from '@/components/layout/header/desktop-nav';
import HeaderClientShell from '@/components/layout/header/header-client-shell';
import type { NavItem } from '@/components/layout/header/types';
import { Link } from '@/i18n/routing';

interface HeaderProps {
  navItems: NavItem[];
}

export default async function Header({ navItems }: HeaderProps) {
  const t = await getTranslations('Header');
  const brand = (
    <Link
      href="/"
      className="text-xl font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
    >
      Meathill Studio
    </Link>
  );
  const searchButton = (
    <>
      <BrandSiteSwitcher currentSiteId="meathill" />
      <Link
        href="/search"
        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all"
        aria-label={t('search')}
      >
        <SearchIcon size={18} />
      </Link>
    </>
  );

  return (
    <HeaderClientShell
      items={navItems}
      toggleMenuLabel={t('toggle_menu')}
      brand={brand}
      desktopNav={<DesktopNav items={navItems} />}
      searchButton={searchButton}
    />
  );
}
