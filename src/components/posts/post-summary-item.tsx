import Link from 'next/link';
import { CalendarIcon, ClockIcon, TagIcon } from 'lucide-react';

type PostSummaryVariant = 'timeline' | 'search';

interface PostSummaryItemProps {
  href: string;
  title: string;
  dateText: string;
  readingTimeText: string;
  categoryText?: string;
  excerptText?: string;
  variant?: PostSummaryVariant;
}

export function PostSummaryItem({
  href,
  title,
  dateText,
  readingTimeText,
  categoryText,
  excerptText,
  variant = 'timeline',
}: PostSummaryItemProps) {
  if (variant === 'search') {
    return (
      <li>
        <Link
          href={href}
          className="group block rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-5 transition-all card-hover hover:border-[var(--accent)]/30"
        >
          <h3 className="mb-2 font-semibold text-[var(--text-primary)] text-lg transition-colors group-hover:text-[var(--accent)]">
            {title}
          </h3>
          {excerptText && <p className="mb-3 line-clamp-2 text-[var(--text-secondary)] text-sm">{excerptText}</p>}
          <div className="flex items-center gap-4 text-[var(--text-muted)] text-xs">
            <span className="inline-flex items-center gap-1">
              <CalendarIcon size={12} />
              {dateText}
            </span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon size={12} />
              {readingTimeText}
            </span>
            {categoryText && (
              <span className="inline-flex items-center gap-1">
                <TagIcon size={12} />
                {categoryText}
              </span>
            )}
          </div>
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        className="group block rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-4 transition-all card-hover hover:border-[var(--accent)]/30"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-shrink-0 items-center gap-1 text-[var(--text-muted)] text-sm sm:w-24">
            <CalendarIcon size={14} />
            {dateText}
          </div>

          <h3 className="flex-1 font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
            {title}
          </h3>

          <div className="flex items-center gap-3 text-[var(--text-muted)] text-xs">
            {categoryText && (
              <span className="inline-flex items-center gap-1">
                <TagIcon size={12} />
                {categoryText}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <ClockIcon size={12} />
              {readingTimeText}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
