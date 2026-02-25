import { apps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import AppCard from '@/components/AppCard';
import {
  calculateReadingTime,
  formatDate,
  stripHtml,
  processContent,
  getTags,
  WPTag,
  WPPost,
  getCategories,
} from '@/lib/wordpress';
import CodeHighlight from '@/components/CodeHighlight';
import AwesomeComment from '@/components/AwesomeComment';
import { getDb } from '@/lib/db';
import { PostToc } from '@/components/posts/post-toc';
import { extractTOC, hasCodeBlocks } from '@/lib/post-utils';
import FeaturedImage from '@/components/posts/featured-image';
import PostBreadcrumb from '@/components/posts/post-breadcrumb';
import PostHeader from '@/components/posts/post-header';
import PostFooter from '@/components/posts/post-footer';

interface PostViewProps {
  post: WPPost;
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
  prose-pre:bg-[var(--surface)] prose-pre:border prose-pre:border-[var(--surface-border)] prose-pre:p-0
  prose-img:rounded-xl
  prose-blockquote:border-l-[var(--accent)] prose-blockquote:text-[var(--text-muted)]
  prose-li:text-[var(--text-secondary)]`;

export default async function PostView({ post }: PostViewProps) {
  const title = stripHtml(post.title.rendered);
  const readingTime = calculateReadingTime(post.content.rendered);
  const dateFormatted = formatDate(post.date);
  const processedContent = processContent(post.content.rendered);
  const toc = extractTOC(processedContent, stripHtml);
  const needsCodeHighlight = hasCodeBlocks(processedContent);

  // 并发获取分类和标签
  const [allCategories, tags] = await Promise.all([
    post.categories?.length ? getCategories() : Promise.resolve([]),
    post.tags?.length ? getTags({ include: post.tags }) : Promise.resolve([] as WPTag[]),
  ]);
  const categories = post.categories?.length ? allCategories.filter((cat) => post.categories.includes(cat.id)) : [];

  const relatedApp = await findRelatedApp(tags, categories);
  const thumbnail = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`lg:flex lg:gap-8 ${toc.length === 0 ? 'lg:justify-center' : ''}`}>
          <PostToc items={toc} />

          {/* Main Content */}
          <article className="flex-1 max-w-3xl">
            <PostBreadcrumb title={title} categories={categories} />

            <PostHeader
              title={title}
              dateFormatted={dateFormatted}
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

            <PostFooter categories={categories} tags={tags} />

            <AwesomeComment />
          </article>
        </div>
      </div>
      {needsCodeHighlight && <CodeHighlight />}
    </div>
  );
}
