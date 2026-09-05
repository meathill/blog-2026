import Link from 'next/link';
import type { WPCategory } from '@/lib/wordpress';

interface PostBreadcrumbProps {
  title: string;
  categories: WPCategory[];
}

export default function PostBreadcrumb({ title, categories }: PostBreadcrumbProps) {
  return (
    <nav className="mb-8 flex items-center text-sm text-[var(--text-muted)]">
      <Link prefetch={false} href="/" className="hover:text-[var(--text-primary)] transition-colors">
        首页
      </Link>
      <span className="mx-2">/</span>
      {categories.length > 0 ? (
        <Link
          prefetch={false}
          href={`/category/${categories[0].slug}`}
          className="hover:text-[var(--text-primary)] transition-colors"
        >
          {categories[0].name}
        </Link>
      ) : (
        <Link prefetch={false} href="/posts" className="hover:text-[var(--text-primary)] transition-colors">
          全部文章
        </Link>
      )}
      <span className="mx-2">/</span>
      <span className="text-[var(--text-primary)] font-medium truncate">{title}</span>
    </nav>
  );
}
