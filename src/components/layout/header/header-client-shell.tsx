'use client';

import { useEffect, useState } from 'react';
import { MenuIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/layout/header/mobile-nav';
import type { NavItem } from '@/components/layout/header/types';

interface HeaderClientShellProps {
  items: NavItem[];
  toggleMenuLabel: string;
  brand: React.ReactNode;
  desktopNav: React.ReactNode;
  searchButton: React.ReactNode;
}

export default function HeaderClientShell({
  items,
  toggleMenuLabel,
  brand,
  desktopNav,
  searchButton,
}: HeaderClientShellProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <div className="flex items-center justify-between gap-4">
          {brand}
          {desktopNav}

          <div className="flex items-center gap-4">
            {searchButton}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all"
              onClick={toggleMobileMenu}
              aria-label={toggleMenuLabel}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        <MobileNav items={items} isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
      </div>
    </header>
  );
}
