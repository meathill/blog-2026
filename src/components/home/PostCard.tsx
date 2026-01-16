import { ArrowRightIcon, CalendarIcon, ClockIcon, EyeIcon, ExternalLinkIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PostCardProps {
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  category?: string;
  readingTime?: number;
  views?: number;
  featured?: boolean;
  isExternal?: boolean;
}

export default function PostCard({
  title,
  excerpt,
  slug,
  date,
  category,
  readingTime = 5,
  views,
  featured = false,
  isExternal = false,
}: PostCardProps) {
  const linkHref = isExternal ? slug : `/posts/${slug}`;
  const LinkComponent = isExternal ? 'a' : Link;
  const linkProps = isExternal ? { href: linkHref, target: '_blank', rel: 'noopener noreferrer' } : { href: linkHref };

  return (
    <article
      className={cn(
        'group relative rounded-2xl overflow-hidden card-hover',
        featured ? 'glass glow p-6 md:p-8' : 'bg-[var(--surface)] border border-[var(--surface-border)] p-5 md:p-6',
      )}
    >
      {/* 推荐标记 */}
      {featured && (
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-white">
            推荐
          </span>
        </div>
      )}

      {/* 分类标签 */}
      {category && (
        <div className="mb-4">
          <span className="px-3 py-1 text-xs font-medium rounded-md bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            {category}
          </span>
        </div>
      )}

      {/* 标题 */}
      <h3
        className={cn(
          'font-bold mb-3 group-hover:text-gradient transition-all',
          featured ? 'text-xl md:text-2xl' : 'text-lg',
        )}
      >
        <LinkComponent
          {...linkProps}
          className="hover:no-underline text-[var(--text-primary)] inline-flex items-start gap-2"
        >
          <span className="flex-1">{title}</span>
          {isExternal && <ExternalLinkIcon size={14} className="flex-shrink-0 mt-1 opacity-50" />}
        </LinkComponent>
      </h3>

      {/* 摘要 */}
      <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4 line-clamp-2">{excerpt}</p>

      {/* 元信息 */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1">
          <CalendarIcon size={12} />
          {date}
        </span>
        <span className="inline-flex items-center gap-1">
          <ClockIcon size={12} />
          {readingTime} 分钟
        </span>
        {views !== undefined && (
          <span className="inline-flex items-center gap-1">
            <EyeIcon size={12} />
            {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
          </span>
        )}
      </div>

      {/* 悬浮时显示的阅读更多 */}
      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <LinkComponent
          {...linkProps}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:gap-2 transition-all"
        >
          阅读全文
          <ArrowRightIcon size={14} />
        </LinkComponent>
      </div>
    </article>
  );
}
