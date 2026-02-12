import Link from 'next/link';
import { CalendarIcon, ClockIcon } from 'lucide-react';

interface PostListItemProps {
  href: string;
  title: string;
  dateText: string;
  readingTimeText: string;
}

export function PostListItem({ href, title, dateText, readingTimeText }: PostListItemProps) {
  return (
    <li>
      <Link
        href={href}
        className="group block rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-4 transition-all card-hover hover:border-[var(--accent)]/30"
      >
        <h2 className="mb-2 font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
          {title}
        </h2>
        <div className="flex items-center gap-4 text-[var(--text-muted)] text-sm">
          <span className="inline-flex items-center gap-1">
            <CalendarIcon size={14} />
            {dateText}
          </span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon size={14} />
            {readingTimeText}
          </span>
        </div>
      </Link>
    </li>
  );
}
