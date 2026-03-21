'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { HeaderNavLink } from '@/components/layout/header/header-nav-link';
import type { NavItem } from '@/components/layout/header/types';

interface DesktopNavProps {
  items: NavItem[];
}

interface DesktopDropdownMenuProps {
  item: NavItem;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onToggle: () => void;
}

const TOP_LEVEL_LINK_CLASS_NAME =
  'text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium';
const DROPDOWN_TRIGGER_CLASS_NAME =
  'flex cursor-pointer items-center gap-1 bg-transparent text-[var(--text-secondary)] transition-colors text-sm font-medium hover:text-[var(--text-primary)]';
const DROPDOWN_LINK_CLASS_NAME =
  'block px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors';

function DesktopDropdownMenu({ item, isOpen, onClose, onOpen, onToggle }: DesktopDropdownMenuProps) {
  const panelId = useId();

  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        className={DROPDOWN_TRIGGER_CLASS_NAME}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        onFocus={onOpen}
      >
        {item.label}
        <ChevronDownIcon size={14} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {isOpen ? (
        <div className="absolute top-full left-0 z-20 pt-2">
          <div
            id={panelId}
            className="min-w-48 overflow-hidden rounded-lg border border-[var(--surface-border)] glass shadow-lg"
          >
            {item.children?.map((child) => (
              <HeaderNavLink
                key={child.href + child.label}
                item={child}
                className={DROPDOWN_LINK_CLASS_NAME}
                onClick={onClose}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DesktopNav({ items }: DesktopNavProps) {
  const [openItemLabel, setOpenItemLabel] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!openItemLabel) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node) || navRef.current?.contains(event.target)) {
        return;
      }

      setOpenItemLabel(null);
    }

    function handleFocusIn(event: FocusEvent) {
      if (!(event.target instanceof Node) || navRef.current?.contains(event.target)) {
        return;
      }

      setOpenItemLabel(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenItemLabel(null);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openItemLabel]);

  function openDropdown(label: string) {
    setOpenItemLabel(label);
  }

  function closeDropdown() {
    setOpenItemLabel(null);
  }

  function toggleDropdown(label: string) {
    setOpenItemLabel((prev) => (prev === label ? null : label));
  }

  return (
    <nav ref={navRef} className="hidden md:flex items-center gap-6">
      {items.map((item) =>
        item.children ? (
          <DesktopDropdownMenu
            key={item.label}
            item={item}
            isOpen={openItemLabel === item.label}
            onClose={closeDropdown}
            onOpen={() => openDropdown(item.label)}
            onToggle={() => toggleDropdown(item.label)}
          />
        ) : (
          <HeaderNavLink key={item.href} item={item} className={TOP_LEVEL_LINK_CLASS_NAME} />
        ),
      )}
    </nav>
  );
}
