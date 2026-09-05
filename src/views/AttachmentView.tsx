import { CalendarIcon, DownloadIcon } from 'lucide-react';
import Link from 'next/link';
import { formatDate, stripHtml, WPMedia } from '@/lib/wordpress';

interface AttachmentViewProps {
  media: WPMedia;
  parentPostSlug?: string;
}

export default function AttachmentView({ media, parentPostSlug }: AttachmentViewProps) {
  const title = stripHtml(media.title.rendered);
  const dateFormatted = formatDate(media.date);
  const description = media.description?.rendered; // Keep HTML for description if needed, or strip it? Typically description is HTML.
  const caption = media.caption?.rendered;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center text-sm text-[var(--text-muted)]">
            <Link prefetch={false} href="/" className="hover:text-[var(--text-primary)] transition-colors">
              首页
            </Link>
            <span className="mx-2">/</span>
            {parentPostSlug ? (
              <>
                <Link
                  prefetch={false}
                  href={`/posts/${parentPostSlug}`}
                  className="hover:text-[var(--text-primary)] transition-colors"
                >
                  返回文章
                </Link>
                <span className="mx-2">/</span>
              </>
            ) : (
              <>
                <Link prefetch={false} href="/posts" className="hover:text-[var(--text-primary)] transition-colors">
                  全部文章
                </Link>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-[var(--text-primary)] font-medium truncate">{title}</span>
          </nav>

          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4 leading-tight">{title}</h1>
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1">
                <CalendarIcon size={14} />
                {dateFormatted}
              </span>
              {media.media_type === 'file' && (
                <span className="inline-flex items-center gap-1">
                  <DownloadIcon size={14} />
                  <a href={media.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    下载原文件
                  </a>
                </span>
              )}
            </div>
          </header>

          <div className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl overflow-hidden p-4 mb-8">
            {media.media_type === 'image' ? (
              <div className="flex justify-center">
                <img
                  src={media.source_url}
                  alt={title}
                  className="max-w-full h-auto rounded-lg"
                  width={media.media_details.width}
                  height={media.media_details.height}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <DownloadIcon size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
                <p className="text-[var(--text-secondary)] mb-4">此附件为文件类型</p>
                <a
                  href={media.source_url}
                  className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--accent)] hover:bg-[var(--accent)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                >
                  下载 {title}
                </a>
              </div>
            )}
            {caption && (
              <div
                className="mt-4 p-4 text-sm text-[var(--text-secondary)] text-center italic border-t border-[var(--surface-border)]"
                dangerouslySetInnerHTML={{ __html: caption }}
              />
            )}
          </div>

          {description && (
            <div className="prose prose-invert prose-lg max-w-none">
              <h3>说明</h3>
              <div dangerouslySetInnerHTML={{ __html: description }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
