import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CalendarIcon, ClockIcon } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { getTagBySlug, getPostsByTag, calculateReadingTime, formatDate, stripHtml } from '@/lib/wordpress';

interface TagPageProps {
  params: Promise<{ slug: string; num: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug, num } = await params;
  let tag = await getTagBySlug(slug);

  if (!tag) {
    const normalizedSlug = slug.toLowerCase().replace(/\./g, '-');
    tag = await getTagBySlug(normalizedSlug);
  }

  if (!tag) {
    return {
      title: '标签未找到',
    };
  }

  return {
    title: `${tag.name} - 文章标签 - 第 ${num} 页`,
    description: `查看 ${tag.name} 标签下的所有文章 - 第 ${num} 页`,
  };
}

export default async function TagPageNum({ params }: TagPageProps) {
  const { slug, num } = await params;
  const pageNum = parseInt(num, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    notFound();
  }

  if (pageNum === 1) {
    redirect(`/tag/${slug}`);
  }

  let tag = await getTagBySlug(slug);
  if (!tag) {
    const normalizedSlug = slug.toLowerCase().replace(/\./g, '-');
    tag = await getTagBySlug(normalizedSlug);
  }

  if (!tag) {
    notFound();
  }

  const { posts, totalPages } = await getPostsByTag(tag.id, pageNum, 50);

  if (pageNum > totalPages && totalPages > 0) {
    notFound();
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8"
        >
          <ArrowLeftIcon size={16} />
          返回文章列表
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-responsive-title mb-4">
            <span className="text-gradient">标签：{tag.name}</span>
          </h1>
          <p className="text-[var(--text-secondary)]">
            共 {tag.count} 篇文章
            {totalPages > 1 && `，当前第 ${pageNum}/${totalPages} 页`}
          </p>
        </header>

        {/* Posts List */}
        <ul className="space-y-4">
          {posts.map((post) => {
            const title = stripHtml(post.title.rendered);
            const readingTime = calculateReadingTime(post.content.rendered);
            const dateFormatted = formatDate(post.date);
            const localSlug = post.slug;

            return (
              <li key={post.id}>
                <Link
                  href={`/posts/${localSlug}`}
                  className="group block p-4 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] hover:border-[var(--accent)]/30 transition-all card-hover"
                >
                  <h2 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-2">
                    {title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon size={14} />
                      {dateFormatted}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon size={14} />
                      {readingTime} 分钟
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {posts.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">该标签暂无文章</div>}

        <Pagination currentPage={pageNum} totalPages={totalPages} baseUrl={`/tag/${slug}`} />
      </div>
    </div>
  );
}
