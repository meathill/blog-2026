import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { PostListItem } from '@/components/posts/post-list-item';
import { getTagBySlug, getPostsByTag, calculateReadingTime, formatDate, stripHtml } from '@/lib/wordpress';
import { resolveBySlugWithNormalizedFallback } from '@/lib/tag-slug';
import { SITE_URL } from '@/lib/constants';

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await resolveBySlugWithNormalizedFallback(slug, getTagBySlug);

  if (!tag) {
    return {
      title: '标签未找到',
    };
  }

  const canonicalUrl = `${SITE_URL}/tag/${slug}`;

  return {
    title: `${tag.name} - 文章标签`,
    description: `查看 ${tag.name} 标签下的所有文章`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        zh: canonicalUrl,
        en: `${SITE_URL}/en/tag/${slug}`,
      },
    },
    openGraph: {
      title: `${tag.name} - 文章标签`,
      description: `查看 ${tag.name} 标签下的所有文章`,
      url: canonicalUrl,
    },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const tag = await resolveBySlugWithNormalizedFallback(slug, getTagBySlug);

  if (!tag) {
    notFound();
  }

  const { posts, totalPages } = await getPostsByTag(tag.id, 1, 50);

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
          <p className="text-[var(--text-secondary)]">共 {tag.count} 篇文章</p>
        </header>

        {/* Posts List */}
        <ul className="space-y-4">
          {posts.map((post) => {
            const title = stripHtml(post.title.rendered);
            const readingTime = calculateReadingTime(post.content.rendered);
            const dateFormatted = formatDate(post.date);

            return (
              <PostListItem
                key={post.id}
                href={`/posts/${post.slug}`}
                title={title}
                dateText={dateFormatted}
                readingTimeText={`${readingTime} 分钟`}
              />
            );
          })}
        </ul>

        {posts.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">该标签暂无文章</div>}

        <Pagination currentPage={1} totalPages={totalPages} baseUrl={`/tag/${slug}`} />
      </div>
    </div>
  );
}
