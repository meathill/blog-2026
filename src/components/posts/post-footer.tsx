import Link from 'next/link';
import type { WPCategory, WPTag } from '@/lib/wordpress';

interface PostFooterProps {
  categories: WPCategory[];
  tags: WPTag[];
}

export default function PostFooter({ categories, tags }: PostFooterProps) {
  return (
    <>
      {/* Sponsor Section */}
      <div className="mt-12 p-8 rounded-2xl glass glow text-center">
        <h3 className="text-xl font-bold text-gradient mb-4">觉得文章有帮助？</h3>
        <p className="text-[var(--text-secondary)] mb-6">如果我的分享对你有所启发，欢迎通过赞助来支持我持续创作。</p>
        <Link
          prefetch={false}
          href="https://github.com/sponsors/meathill"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          ❤️ 赞助我
        </Link>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-[var(--surface-border)]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <Link
            prefetch={false}
            href="/posts"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-nowrap"
          >
            返回文章列表
          </Link>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  prefetch={false}
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--surface-border)] hover:border-[var(--accent)]/30 transition-all"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 w-1/2">
              {tags.map((tag) => (
                <Link
                  prefetch={false}
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--surface-border)] hover:border-[var(--accent)]/30 transition-all"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </footer>
    </>
  );
}
