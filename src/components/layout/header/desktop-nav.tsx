'use client';

import { useRef, useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeaderNavLink } from '@/components/layout/header/header-nav-link';
import type { NavItem } from '@/components/layout/header/types';

interface DesktopNavProps {
  items: NavItem[];
}

const TOP_LEVEL_LINK_CLASS_NAME =
  'text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium';
const DROPDOWN_LINK_CLASS_NAME =
  'block px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors';

function DesktopDropdownMenu({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    if (closeDelayTimerRef.current) {
      clearTimeout(closeDelayTimerRef.current);
    }
    setIsOpen(true);
  }

  function handleMouseLeave() {
    closeDelayTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }

  function handleToggleClick() {
    setIsOpen((prev) => !prev);
  }

  function handleItemClick() {
    setIsOpen(false);
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium"
        onClick={handleToggleClick}
      >
        {item.label}
        <ChevronDownIcon size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>
      <div
        className={cn(
          'absolute top-full left-0 mt-2 min-w-48 rounded-lg glass border border-[var(--surface-border)] shadow-lg overflow-hidden transition-all duration-200',
          isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2',
        )}
      >
        {item.children?.map((child) => (
          <HeaderNavLink
            key={child.href + child.label}
            item={child}
            className={DROPDOWN_LINK_CLASS_NAME}
            onClick={handleItemClick}
          />
        ))}
      </div>
    </div>
  );
}

export function DesktopNav({ items }: DesktopNavProps) {
  return (
    <nav className="hidden md:flex items-center gap-6">
      {items.map((item) =>
        item.children ? (
          <DesktopDropdownMenu key={item.label} item={item} />
        ) : (
          <HeaderNavLink key={item.href} item={item} className={TOP_LEVEL_LINK_CLASS_NAME} />
        ),
      )}
    </nav>
  );
}
