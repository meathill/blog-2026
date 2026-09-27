import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { PostListItem } from '@/components/posts/post-list-item';
import { getTagBySlug, getPostsByTag, calculateReadingTime, formatDate, stripHtml } from '@/lib/wordpress';
import { resolveBySlugWithNormalizedFallback } from '@/lib/tag-slug';
import { getPostPath } from '@/lib/post-utils';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/constants';

interface TagPageProps {
  params: Promise<{ locale: string; slug: string; num: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, slug, num } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const tag = await resolveBySlugWithNormalizedFallback(slug, getTagBySlug);

  if (!tag) {
    return {
      title: t('tag_not_found'),
    };
  }

  const zhUrl = `${SITE_URL}/tag/${slug}/page/${num}`;
  const enUrl = `${SITE_URL}/en/tag/${slug}/page/${num}`;
  const canonical = locale === 'en' ? enUrl : zhUrl;
  const title = t('tag_page_title', { name: tag.name, num });
  const description = t('tag_page_description', { name: tag.name, num });

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: {
      canonical,
      languages: {
        zh: zhUrl,
        en: enUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

// ISR：构建期不预渲染任何路径，首个请求渲染后写入增量缓存（R2），按 revalidate 过期后台重建。
// 空数组 + dynamicParams（默认 true）= 全部按需生成；不要在这里列路径，见 DEV_NOTE「全站 ISR」。
export async function generateStaticParams() {
  return [];
}

export default async function TagPageNum({ params }: TagPageProps) {
  const { slug, num, locale } = await params;
  setRequestLocale(locale);
  const pageNum = parseInt(num, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    notFound();
  }

  if (pageNum === 1) {
    redirect(`/tag/${slug}`);
  }

  const tag = await resolveBySlugWithNormalizedFallback(slug, getTagBySlug);

  if (!tag) {
    notFound();
  }

  const { posts, totalPages } = await getPostsByTag(tag.id, pageNum, 50, true);

  if (pageNum > totalPages && totalPages > 0) {
    notFound();
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <Link
          prefetch={false}
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

            return (
              <PostListItem
                key={post.id}
                href={getPostPath(post)}
                title={title}
                dateText={dateFormatted}
                readingTimeText={`${readingTime} 分钟`}
              />
            );
          })}
        </ul>

        {posts.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">该标签暂无文章</div>}

        <Pagination currentPage={pageNum} totalPages={totalPages} baseUrl={`/tag/${slug}`} />
      </div>
    </div>
  );
}
