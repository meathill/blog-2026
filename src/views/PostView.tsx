import { apps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import AppCard from '@/components/AppCard';
import {
  calculateReadingTime,
  formatDate,
  stripHtml,
  processContent,
  buildPostDescription,
  getTags,
  WPTag,
  WPPost,
  getCategories,
} from '@/lib/wordpress';
import CodeHighlight from '@/components/CodeHighlight';
import AwesomeComment from '@/components/AwesomeComment';
import { getDb } from '@/lib/db';
import { SITE_URL } from '@/lib/constants';
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqJsonLd } from '@/lib/seo/jsonld';
import { PostToc } from '@/components/posts/post-toc';
import { extractTOC, extractFaq, hasCodeBlocks } from '@/lib/post-utils';
import FeaturedImage from '@/components/posts/featured-image';
import PostBreadcrumb from '@/components/posts/post-breadcrumb';
import PostHeader from '@/components/posts/post-header';
import PostFooter from '@/components/posts/post-footer';
import RelatedPosts from '@/components/posts/related-posts';

interface PostViewProps {
  post: WPPost;
  locale: string;
}

// 查找关联的 App
async function findRelatedApp(tags: WPTag[], categories: { slug: string }[]) {
  const db = await getDb();

  // 优先通过 app: 标签查找
  const appTag = tags.find((t) => t.name.startsWith('app:'));
  if (appTag) {
    const appSlug = appTag.name.replace('app:', '');
    const app = await db.select().from(apps).where(eq(apps.slug, appSlug)).get();
    if (app) return app;
  }

  // 其次通过分类 slug 查找
  for (const category of categories) {
    const app = await db.select().from(apps).where(eq(apps.slug, category.slug)).get();
    if (app) return app;
  }

  return null;
}

const PROSE_CLASSES = `prose prose-invert prose-lg max-w-none
  prose-headings:text-[var(--text-primary)] prose-headings:scroll-mt-24
  prose-p:text-[var(--text-secondary)]
  prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
  prose-strong:text-[var(--text-primary)]
  prose-code:text-[var(--accent)] prose-code:bg-[var(--surface)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
  prose-code:before:content-none prose-code:after:content-none
  prose-pre:bg-[var(--surface)] prose-pre:border prose-pre:border-[var(--surface-border)] prose-pre:p-0
  prose-img:rounded-xl
  prose-blockquote:border-l-[var(--accent)] prose-blockquote:text-[var(--text-muted)]
  prose-li:text-[var(--text-secondary)]`;

export default async function PostView({ post, locale }: PostViewProps) {
  const title = stripHtml(post.title.rendered);
  const readingTime = calculateReadingTime(post.content.rendered);
  const dateFormatted = formatDate(post.date);
  // 仅当更新时间比发布时间晚 1 天以上才展示「更新于」，避免每次保存都误报新鲜度
  const isMeaningfullyUpdated =
    !!post.modified && new Date(post.modified).getTime() - new Date(post.date).getTime() > 24 * 60 * 60 * 1000;
  const updatedFormatted = isMeaningfullyUpdated ? formatDate(post.modified) : undefined;
  const processedContent = processContent(post.content.rendered);
  const toc = extractTOC(processedContent, stripHtml);
  const needsCodeHighlight = hasCodeBlocks(processedContent);

  // 并发获取分类和标签
  const [allCategories, allTags] = await Promise.all([
    post.categories?.length ? getCategories() : Promise.resolve([]),
    post.tags?.length ? getTags({ include: post.tags }) : Promise.resolve([] as WPTag[]),
  ]);
  const tags = allTags.filter((tag) => tag.name?.trim());
  const categories = post.categories?.length ? allCategories.filter((cat) => post.categories.includes(cat.id)) : [];

  const relatedApp = await findRelatedApp(tags, categories);
  const thumbnail = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

  // 结构化数据：规范 URL 需与页面 canonical 一致（按 post.categories[0] 取主分类）
  const baseUrl = locale === 'en' ? `${SITE_URL}/en` : SITE_URL;
  const primaryCategory = post.categories?.length
    ? allCategories.find((cat) => cat.id === post.categories[0])
    : undefined;
  const categorySlug = primaryCategory ? decodeURIComponent(primaryCategory.slug) : 'uncategorized';
  const canonicalUrl = `${baseUrl}/posts/${categorySlug}/${post.slug}`;
  const ogImage = thumbnail || `${SITE_URL}/api/og/post?slug=${post.slug}`;
  const faqPairs = extractFaq(processedContent);

  const articleJsonLd = buildArticleJsonLd({
    title,
    description: buildPostDescription(post),
    url: canonicalUrl,
    datePublished: post.date,
    dateModified: post.modified,
    image: ogImage,
    locale,
    keywords: tags.map((tag) => tag.name),
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: '首页', url: baseUrl },
    primaryCategory
      ? { name: primaryCategory.name, url: `${baseUrl}/category/${primaryCategory.slug}` }
      : { name: '全部文章', url: `${baseUrl}/posts` },
    { name: title, url: canonicalUrl },
  ]);
  const faqJsonLd = buildFaqJsonLd(faqPairs);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 结构化数据
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`lg:flex lg:gap-8 ${toc.length === 0 ? 'lg:justify-center' : ''}`}>
          <PostToc items={toc} />

          {/* Main Content */}
          <article className="flex-1 max-w-3xl">
            <PostBreadcrumb title={title} categories={categories} />

            <PostHeader
              title={title}
              dateFormatted={dateFormatted}
              updatedFormatted={updatedFormatted}
              readingTime={readingTime}
              categories={categories}
              tags={tags}
            />

            {/* Featured App */}
            {relatedApp && (
              <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider mb-4">
                  Related App
                </h3>
                <AppCard app={relatedApp} />
              </div>
            )}

            {/* Featured Image */}
            {thumbnail && <FeaturedImage src={thumbnail} alt={title} />}

            {/* Article Content */}
            <div className={PROSE_CLASSES} dangerouslySetInnerHTML={{ __html: processedContent }} />

            <RelatedPosts post={post} />

            <PostFooter categories={categories} tags={tags} />

            <AwesomeComment />
          </article>
        </div>
      </div>
      {needsCodeHighlight && <CodeHighlight />}
    </div>
  );
}
