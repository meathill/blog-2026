'use client';

import { Link } from '@/i18n/routing';
import { useState, useEffect } from 'react';
import { SearchIcon, MenuIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';
import { DesktopNav } from '@/components/layout/header/desktop-nav';
import { MobileNav } from '@/components/layout/header/mobile-nav';
import { getHeaderNavItems } from '@/components/layout/header/nav-items';
import type { NavItem } from '@/components/layout/header/types';

interface NavigationResponse {
  items?: NavItem[];
}

export default function Header({ initialNavItems }: { initialNavItems?: NavItem[] }) {
  const t = useTranslations('Header');
  const locale = useLocale();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [customNavItems, setCustomNavItems] = useState<NavItem[] | null>(null);
  const defaultNavItems = getHeaderNavItems({
    about: t('about'),
    apps: t('apps'),
    tech: t('tech'),
    works: t('works'),
    resources: t('resources'),
  });
  const navItems = customNavItems ?? initialNavItems ?? defaultNavItems;

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (initialNavItems) return;

    let isCancelled = false;
    setCustomNavItems(null);

    async function loadNavigation() {
      try {
        const response = await fetch(`/api/navigation?locale=${encodeURIComponent(locale)}&section=header`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as NavigationResponse;
        if (isCancelled || !Array.isArray(data.items) || data.items.length === 0) {
          return;
        }
        setCustomNavItems(data.items);
      } catch {
        // Keep default navigation silently when request fails.
      }
    }

    loadNavigation();
    return () => {
      isCancelled = true;
    };
  }, [locale]);

  function toggleMobileMenu() {
    setIsMobileMenuOpen((prev) => !prev);
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'glass backdrop-blur-md py-3' : 'bg-transparent py-5',
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-gradient hover:opacity-80 transition-opacity">
            山维空间
          </Link>

          {/* Desktop Navigation */}
          <DesktopNav items={navItems} />

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search Button */}
            <Link
              href="/search"
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all"
              aria-label={t('search')}
            >
              <SearchIcon size={18} />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all"
              onClick={toggleMobileMenu}
              aria-label={t('toggle_menu')}
            >
              {isMobileMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileNav items={navItems} isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
      </div>
    </header>
  );
}
