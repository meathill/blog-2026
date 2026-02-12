'use client';

import { useEffect, useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeaderNavLink } from '@/components/layout/header/header-nav-link';
import type { NavItem } from '@/components/layout/header/types';

interface MobileNavProps {
  items: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}

const MOBILE_TOP_LEVEL_LINK_CLASS_NAME =
  'flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all';
const MOBILE_CHILD_LINK_CLASS_NAME =
  'block px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors';

export function MobileNav({ items, isOpen, onClose }: MobileNavProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setExpandedItems([]);
    }
  }, [isOpen]);

  function toggleExpand(label: string) {
    setExpandedItems((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]));
  }

  return (
    <div
      className={cn(
        'md:hidden overflow-hidden transition-all duration-300',
        isOpen ? 'max-h-[80vh] mt-4 overflow-y-auto' : 'max-h-0',
      )}
    >
      <nav className="flex flex-col gap-1 py-4 border-t border-[var(--surface-border)]">
        {items.map((item) =>
          item.children ? (
            <div key={item.label}>
              <button
                className="flex items-center justify-between w-full px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all rounded-lg"
                onClick={() => toggleExpand(item.label)}
              >
                {item.label}
                <ChevronDownIcon
                  size={16}
                  className={cn('transition-transform', expandedItems.includes(item.label) && 'rotate-180')}
                />
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  expandedItems.includes(item.label) ? 'max-h-96' : 'max-h-0',
                )}
              >
                <div className="pl-4 py-1">
                  {item.children.map((child) => (
                    <HeaderNavLink
                      key={child.href + child.label}
                      item={child}
                      className={MOBILE_CHILD_LINK_CLASS_NAME}
                      onClick={onClose}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <HeaderNavLink key={item.href} item={item} className={MOBILE_TOP_LEVEL_LINK_CLASS_NAME} onClick={onClose} />
          ),
        )}
      </nav>
    </div>
  );
}
