import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, TagIcon } from 'lucide-react';
import {
  getPost,
  getCategories,
  calculateReadingTime,
  formatDate,
  stripHtml,
  processContent,
  WPCategory,
} from '@/lib/wordpress';

interface PostPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugStr = slug[slug.length - 1]; // 取最后一段作为 slug
  const post = await getPost(slugStr);

  if (!post) {
    return {
      title: '文章未找到',
    };
  }

  const title = stripHtml(post.title.rendered);
  const description = stripHtml(post.excerpt.rendered).slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const slugStr = slug[slug.length - 1];
  const post = await getPost(slugStr);

  if (!post) {
    notFound();
  }

  const title = stripHtml(post.title.rendered);
  const readingTime = calculateReadingTime(post.content.rendered);
  const dateFormatted = formatDate(post.date);

  // 获取分类名称
  let categories: WPCategory[] = [];
  if (post.categories && post.categories.length > 0) {
    const allCategories = await getCategories();
    categories = allCategories.filter((cat) => post.categories.includes(cat.id));
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <article className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <Link
          href="/posts"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8"
        >
          <ArrowLeftIcon size={16} />
          返回文章列表
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4 leading-tight">{title}</h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <CalendarIcon size={14} />
              {dateFormatted}
            </span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon size={14} />
              {readingTime} 分钟阅读
            </span>
            {categories.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <TagIcon size={14} />
                {categories.map((cat) => cat.name).join(', ')}
              </span>
            )}
          </div>
        </header>

        {/* Article Content */}
        <div
          className="prose prose-invert prose-lg max-w-none
            prose-headings:text-[var(--text-primary)]
            prose-p:text-[var(--text-secondary)]
            prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[var(--text-primary)]
            prose-code:text-[var(--accent)] prose-code:bg-[var(--surface)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-[var(--surface)] prose-pre:border prose-pre:border-[var(--surface-border)]
            prose-img:rounded-xl
            prose-blockquote:border-l-[var(--accent)] prose-blockquote:text-[var(--text-muted)]
            prose-li:text-[var(--text-secondary)]
          "
          dangerouslySetInnerHTML={{ __html: processContent(post.content.rendered) }}
        />

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-[var(--surface-border)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeftIcon size={16} />
              返回文章列表
            </Link>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--surface-border)] hover:border-[var(--accent)]/30 transition-all"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}
