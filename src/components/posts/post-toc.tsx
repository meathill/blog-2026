'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface PostTocProps {
  items: TocItem[];
}

const HEADING_OFFSET_PX = 140;

export function PostToc({ items }: PostTocProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  const headingIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    if (headingIds.length === 0) {
      setActiveId(null);
      return;
    }

    const headingElements = headingIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element instanceof HTMLElement);

    if (headingElements.length === 0) {
      setActiveId(headingIds[0] ?? null);
      return;
    }

    function updateActiveHeading() {
      let nextActiveId = headingElements[0].id;
      for (const heading of headingElements) {
        if (heading.getBoundingClientRect().top <= HEADING_OFFSET_PX) {
          nextActiveId = heading.id;
        } else {
          break;
        }
      }
      setActiveId((prev) => (prev === nextActiveId ? prev : nextActiveId));
    }

    if (window.location.hash) {
      const hashId = window.location.hash.slice(1);
      if (headingIds.includes(hashId)) {
        setActiveId(hashId);
      }
    } else {
      updateActiveHeading();
    }

    function handleHashChange() {
      const hashId = window.location.hash.slice(1);
      if (headingIds.includes(hashId)) {
        setActiveId(hashId);
      }
    }

    let rafId = 0;
    function handleScrollOrResize() {
      if (rafId !== 0) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        updateActiveHeading();
        rafId = 0;
      });
    }

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [headingIds]);

  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="hidden lg:block lg:w-64 shrink-0">
      <nav className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pe-1">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">目录</h2>
        <ul className="space-y-1.5 text-sm">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 0.75}rem` }}>
                <a
                  href={`#${item.id}`}
                  className={cn(
                    'block rounded border-l-2 border-transparent py-1 pe-2 ps-2 text-[var(--text-muted)] transition-colors',
                    'hover:text-[var(--accent)]',
                    isActive && 'border-[var(--accent)] text-[var(--accent)]',
                  )}
                  aria-current={isActive ? 'location' : undefined}
                >
                  <span className="line-clamp-2">{item.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 pt-6 border-t border-[var(--surface-border)]">
          <a
            href="#awesome-comment"
            className={cn(
              'block rounded border-l-2 border-transparent py-1 pe-2 ps-2 text-sm text-[var(--text-muted)] transition-colors',
              'hover:text-[var(--accent)]',
            )}
          >
            参与讨论
          </a>
        </div>
      </nav>
    </aside>
  );
}
