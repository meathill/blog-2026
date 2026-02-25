import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { PostListItem } from '@/components/posts/post-list-item';
import { getCategoryBySlug, getPostsByCategory, calculateReadingTime, formatDate, stripHtml } from '@/lib/wordpress';
import { parseCategorySlug } from '@/lib/category-slug';
import { SITE_URL } from '@/lib/constants';

interface CategoryPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { categoryPath, pageNum } = parseCategorySlug(slug);

  if (categoryPath.length === 0) {
    return { title: '分类未找到' };
  }

  const actualSlug = categoryPath[categoryPath.length - 1];
  const category = await getCategoryBySlug(actualSlug);

  if (!category) {
    return { title: '分类未找到' };
  }

  const siteUrl = SITE_URL;
  const basePath = `/category/${categoryPath.join('/')}`;
  const canonicalUrl = pageNum > 1 ? `${siteUrl}${basePath}/page/${pageNum}` : `${siteUrl}${basePath}`;

  const title = pageNum > 1 ? `${category.name} - 文章分类 - 第 ${pageNum} 页` : `${category.name} - 文章分类`;

  return {
    title,
    description: `查看 ${category.name} 分类下的所有文章`,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        zh: canonicalUrl,
        en: pageNum > 1 ? `${siteUrl}/en${basePath}/page/${pageNum}` : `${siteUrl}/en${basePath}`,
      },
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const { categoryPath, pageNum } = parseCategorySlug(slug);

  if (categoryPath.length === 0) {
    notFound();
  }

  // Page 1 should use the canonical URL without /page/1
  if (pageNum === 1 && slug.length > categoryPath.length) {
    redirect(`/category/${categoryPath.join('/')}`);
  }

  const actualSlug = categoryPath[categoryPath.length - 1];
  const category = await getCategoryBySlug(actualSlug);

  if (!category) {
    notFound();
  }

  const { posts, totalPages } = await getPostsByCategory(category.id, pageNum, 50);

  if (pageNum > 1 && pageNum > totalPages && totalPages > 0) {
    notFound();
  }

  const baseUrl = `/category/${categoryPath.join('/')}`;

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
            <span className="text-gradient">{category.name}</span>
          </h1>
          <p className="text-[var(--text-secondary)]">
            共 {category.count} 篇文章
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
                href={`/posts/${post.slug}`}
                title={title}
                dateText={dateFormatted}
                readingTimeText={`${readingTime} 分钟`}
              />
            );
          })}
        </ul>

        {posts.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">该分类暂无文章</div>}

        <Pagination currentPage={pageNum} totalPages={totalPages} baseUrl={baseUrl} />
      </div>
    </div>
  );
}
