import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { Pagination } from '@/components/Pagination';
import { PostListItem } from '@/components/posts/post-list-item';
import { getCategoryBySlug, getPostsByCategory, calculateReadingTime, formatDate, stripHtml } from '@/lib/wordpress';
import { parseCategorySlug } from '@/lib/category-slug';
import { getPostPath } from '@/lib/post-utils';
import { SITE_URL } from '@/lib/constants';

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { categoryPath, pageNum } = parseCategorySlug(slug);
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  if (categoryPath.length === 0) {
    return { title: t('category_not_found') };
  }

  const actualSlug = categoryPath[categoryPath.length - 1];
  const category = await getCategoryBySlug(actualSlug);

  if (!category) {
    return { title: t('category_not_found') };
  }

  const basePath = `/category/${categoryPath.join('/')}`;
  const pagePath = pageNum > 1 ? `${basePath}/page/${pageNum}` : basePath;
  const zhUrl = `${SITE_URL}${pagePath}`;
  const enUrl = `${SITE_URL}/en${pagePath}`;
  const canonical = locale === 'en' ? enUrl : zhUrl;

  const title =
    pageNum > 1
      ? t('category_page_title', { name: category.name, num: pageNum })
      : t('category_title', { name: category.name });
  const description = t('category_description', { name: category.name });

  return {
    title,
    description,
    // 分类首页保留索引；分页（/page/N, N>1）为薄内容，noindex
    ...(pageNum > 1 ? { robots: { index: false, follow: true } } : {}),
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
          {(() => {
            // 当前页已知分类 slug，作为 getPostPath 的兜底（embed 缺失时仍规范）
            const categorySlugById = new Map<number, string>([[category.id, decodeURIComponent(category.slug)]]);
            return posts.map((post) => {
              const title = stripHtml(post.title.rendered);
              const readingTime = calculateReadingTime(post.content.rendered);
              const dateFormatted = formatDate(post.date);

              return (
                <PostListItem
                  key={post.id}
                  href={getPostPath(post, categorySlugById)}
                  title={title}
                  dateText={dateFormatted}
                  readingTimeText={`${readingTime} 分钟`}
                />
              );
            });
          })()}
        </ul>

        {posts.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">该分类暂无文章</div>}

        <Pagination currentPage={pageNum} totalPages={totalPages} baseUrl={baseUrl} />
      </div>
    </div>
  );
}
