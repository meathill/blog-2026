import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevUrl = currentPage === 2 ? baseUrl : `${baseUrl}/page/${currentPage - 1}`;
  const nextUrl = `${baseUrl}/page/${currentPage + 1}`;

  return (
    <nav className="mt-12 flex items-center justify-center gap-2">
      {currentPage > 1 ? (
        <Link
          href={prevUrl}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/30 transition-all"
        >
          <ChevronLeftIcon size={16} />
          上一页
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] cursor-not-allowed">
          <ChevronLeftIcon size={16} />
          上一页
        </span>
      )}

      <span className="px-4 py-2 text-sm text-[var(--text-secondary)]">
        {currentPage} / {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={nextUrl}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/30 transition-all"
        >
          下一页
          <ChevronRightIcon size={16} />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] cursor-not-allowed">
          下一页
          <ChevronRightIcon size={16} />
        </span>
      )}
    </nav>
  );
}
