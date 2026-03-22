'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  // Track which headings have scrolled past the offset threshold
  const aboveSetRef = useRef<Set<string>>(new Set());

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

    // Handle initial hash
    if (window.location.hash) {
      const hashId = window.location.hash.slice(1);
      if (headingIds.includes(hashId)) {
        setActiveId(hashId);
      }
    }

    function handleHashChange() {
      const hashId = window.location.hash.slice(1);
      if (headingIds.includes(hashId)) {
        setActiveId(hashId);
      }
    }

    function pickActive() {
      const above = aboveSetRef.current;
      if (above.size === 0) {
        setActiveId(headingIds[0] ?? null);
        return;
      }
      // Find the last heading (in document order) that is above the threshold
      for (let i = headingIds.length - 1; i >= 0; i--) {
        if (above.has(headingIds[i])) {
          setActiveId(headingIds[i]);
          return;
        }
      }
    }

    // Use a negative top margin to trigger "above the offset" detection
    // When a heading crosses 140px from the top going up, it enters the intersection
    const observer = new IntersectionObserver(
      (entries) => {
        const above = aboveSetRef.current;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Heading has scrolled above the offset threshold
            above.add(entry.target.id);
          } else {
            // Check if the heading is below the threshold (scrolled back down)
            if (entry.boundingClientRect.top > HEADING_OFFSET_PX) {
              above.delete(entry.target.id);
            }
          }
        }
        pickActive();
      },
      {
        // Top boundary at -HEADING_OFFSET_PX means "140px from viewport top"
        // Bottom boundary at -100% + HEADING_OFFSET_PX makes the observable area
        // only the strip from top of viewport to HEADING_OFFSET_PX
        rootMargin: `0px 0px -${window.innerHeight - HEADING_OFFSET_PX}px 0px`,
        threshold: 0,
      },
    );

    for (const el of headingElements) {
      observer.observe(el);
    }

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      observer.disconnect();
      aboveSetRef.current.clear();
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
