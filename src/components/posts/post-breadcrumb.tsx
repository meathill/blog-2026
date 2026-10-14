import Link from 'next/link';
import { termPublicPath } from '@/lib/public-slug';
import type { WPCategory } from '@/lib/wordpress';

interface PostBreadcrumbProps {
  title: string;
  categories: WPCategory[];
}

export default function PostBreadcrumb({ title, categories }: PostBreadcrumbProps) {
  const category = categories[0];
  const categoryHref = category ? termPublicPath('category', category.slug) : null;

  return (
    <nav className="mb-8 flex items-center text-sm text-[var(--text-muted)]">
      <Link prefetch={false} href="/" className="hover:text-[var(--text-primary)] transition-colors">
        首页
      </Link>
      <span className="mx-2">/</span>
      {categoryHref ? (
        <Link prefetch={false} href={categoryHref} className="hover:text-[var(--text-primary)] transition-colors">
          {category?.name}
        </Link>
      ) : category ? (
        <span className="text-[var(--text-primary)]">{category.name}</span>
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
