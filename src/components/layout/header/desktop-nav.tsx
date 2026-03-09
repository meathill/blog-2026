import { ChevronDownIcon } from 'lucide-react';
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
  return (
    <details className="group relative">
      <summary className="flex list-none cursor-pointer items-center gap-1 text-[var(--text-secondary)] transition-colors text-sm font-medium hover:text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
        {item.label}
        <ChevronDownIcon size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute top-full left-0 z-20 mt-2 hidden min-w-48 overflow-hidden rounded-lg border border-[var(--surface-border)] glass shadow-lg group-open:block">
        {item.children?.map((child) => (
          <HeaderNavLink key={child.href + child.label} item={child} className={DROPDOWN_LINK_CLASS_NAME} />
        ))}
      </div>
    </details>
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
