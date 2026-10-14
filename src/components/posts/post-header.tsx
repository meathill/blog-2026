import { CalendarIcon, ClockIcon, FolderIcon, RefreshCwIcon, TagIcon } from 'lucide-react';
import Link from 'next/link';
import { termPublicPath } from '@/lib/public-slug';
import type { WPCategory, WPTag } from '@/lib/wordpress';

interface PostHeaderProps {
  title: string;
  dateFormatted: string;
  updatedFormatted?: string;
  readingTime: number;
  categories: WPCategory[];
  tags: WPTag[];
}

export default function PostHeader({
  title,
  dateFormatted,
  updatedFormatted,
  readingTime,
  categories,
  tags,
}: PostHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4 leading-tight">{title}</h1>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1">
          <CalendarIcon size={14} />
          {dateFormatted}
        </span>
        {updatedFormatted && (
          <span className="inline-flex items-center gap-1" title="最后更新时间">
            <RefreshCwIcon size={14} />
            更新于 {updatedFormatted}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <ClockIcon size={14} />
          {readingTime} 分钟阅读
        </span>
        {categories.length > 0 && (
          <span className="inline-flex items-center gap-2">
            <FolderIcon size={14} />
            <span className="inline-flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const href = termPublicPath('category', cat.slug);
                if (!href) {
                  return <span key={cat.id}>{cat.name}</span>;
                }
                return (
                  <Link
                    prefetch={false}
                    key={cat.id}
                    href={href}
                    className="hover:text-[var(--accent)] transition-colors"
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </span>
          </span>
        )}
        {tags.length > 0 && (
          <span className="inline-flex items-center gap-2">
            <TagIcon size={14} />
            <span className="inline-flex flex-wrap items-center gap-2">
              {tags.map((tag) => {
                const href = termPublicPath('tag', tag.slug);
                if (!href) {
                  return <span key={tag.id}>{tag.name}</span>;
                }
                return (
                  <Link
                    prefetch={false}
                    href={href}
                    key={tag.id}
                    className="hover:text-[var(--accent)] transition-colors"
                  >
                    {tag.name}
                  </Link>
                );
              })}
            </span>
          </span>
        )}
      </div>
    </header>
  );
}
