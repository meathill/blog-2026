import { ArrowRightIcon, CalendarIcon, ClockIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { calculateReadingTime, formatDate, stripHtml } from '@/lib/wordpress';
import { cn } from '@/lib/utils';
import { WPPost } from '@/lib/wordpress/types';

interface PostCardProps {
  post: WPPost;
  featured?: boolean;
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const title = stripHtml(post.title.rendered);
  const excerpt = stripHtml(post.excerpt.rendered).slice(0, 100);
  const date = formatDate(post.date);
  const readingTime = calculateReadingTime(post.content.rendered);
  const slug = post.slug;

  // 获取标签 (wp:term[1] 通常是标签，[0] 是分类)
  // @ts-ignore
  const tags = post._embedded?.['wp:term']?.[1] || [];

  // 获取缩略图
  const thumbnail = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

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

      {/* 缩略图 */}
      {thumbnail && (
        <div className="mb-4 overflow-hidden rounded-t-xl -mx-6 -mt-6 md:-mx-8 md:-mt-8">
          <Link href={`/posts/${slug}`}>
            <img
              src={thumbnail}
              alt={title}
              className="w-full object-cover transition-transform group-hover:scale-105 h-48 md:h-64"
            />
          </Link>
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((tag: any) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="px-3 py-1 text-xs font-medium rounded-md bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-colors z-10 relative"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* 标题 */}
      <h3
        className={cn(
          'font-bold mb-3 group-hover:text-gradient transition-all',
          featured ? 'text-xl md:text-2xl' : 'text-lg',
        )}
      >
        <Link href={`/posts/${slug}`} className="hover:no-underline text-[var(--text-primary)]">
          {title}
        </Link>
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
      </div>

      {/* 悬浮时显示的阅读更多 */}
      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/posts/${slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:gap-2 transition-all"
        >
          阅读全文
          <ArrowRightIcon size={14} />
        </Link>
      </div>
    </article>
  );
}
