import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarIcon, ClockIcon, TagIcon, FolderIcon } from 'lucide-react';
import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import AppCard from '@/components/AppCard';
import {
  getPost,
  getCategories,
  calculateReadingTime,
  formatDate,
  stripHtml,
  processContent,
  WPCategory,
  getTags,
  WPTag,
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

// 从 HTML 内容中提取标题生成 TOC
function extractTOC(html: string): Array<{ id: string; text: string; level: number }> {
  const headingRegex = /<h([2-4])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[2-4]>/gi;
  const toc: Array<{ id: string; text: string; level: number }> = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    toc.push({
      level: parseInt(match[1], 10),
      id: match[2],
      text: match[3].trim(),
    });
  }

  return toc;
}

// ... (existing imports, but I will put them at top via allow multiple or just standard replacement if I can, but imports are at top. I'll use multi_replace to handle imports and content)

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
  const processedContent = processContent(post.content.rendered);
  const toc = extractTOC(processedContent);

  // 获取分类名称
  let categories: WPCategory[] = [];
  if (post.categories && post.categories.length > 0) {
    const allCategories = await getCategories();
    categories = allCategories.filter((cat) => post.categories.includes(cat.id));
  }

  // 获取标签
  let tags: WPTag[] = [];
  if (post.tags && post.tags.length > 0) {
    tags = await getTags({ include: post.tags });
  }

  // check for app tag
  let relatedApp = null;
  const appTag = tags.find((t) => t.name.startsWith('app:'));
  if (appTag) {
    const appSlug = appTag.name.replace('app:', '');
    const db = await getDb();
    relatedApp = await db.select().from(apps).where(eq(apps.slug, appSlug)).get();
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className={`lg:flex lg:gap-8 ${toc.length === 0 ? 'lg:justify-center' : ''}`}>
          {/* Left Sidebar - TOC (宽屏显示) */}
          {toc.length > 0 && (
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <nav className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">目录</h2>
                <ul className="space-y-2 text-sm">
                  {toc.map((item) => (
                    <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 0.75}rem` }}>
                      <a
                        href={`#${item.id}`}
                        className="block py-1 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors line-clamp-2"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          {/* Main Content */}
          <article className="flex-1 max-w-3xl">
            {/* Breadcrumb */}
            <nav className="mb-8 flex items-center text-sm text-[var(--text-muted)]">
              <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
                首页
              </Link>
              <span className="mx-2">/</span>
              {categories.length > 0 ? (
                <Link
                  href={`/category/${categories[0].slug}`}
                  className="hover:text-[var(--text-primary)] transition-colors"
                >
                  {categories[0].name}
                </Link>
              ) : (
                <Link href="/posts" className="hover:text-[var(--text-primary)] transition-colors">
                  全部文章
                </Link>
              )}
              <span className="mx-2">/</span>
              <span className="text-[var(--text-primary)] font-medium truncate">{title}</span>
            </nav>

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
                    <FolderIcon size={14} />
                    {categories.map((cat) => cat.name).join(', ')}
                  </span>
                )}
                {tags.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <TagIcon size={14} />
                    {tags.map((tag) => tag.name).join(', ')}
                  </span>
                )}
              </div>
            </header>

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
            {post._embedded?.['wp:featuredmedia']?.[0]?.source_url && (
              <div className="mb-8 overflow-hidden rounded-xl">
                <img
                  src={post._embedded['wp:featuredmedia'][0].source_url}
                  alt={title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* ... rest of content ... */}
            <div
              className="prose prose-invert prose-lg max-w-none
                prose-headings:text-[var(--text-primary)] prose-headings:scroll-mt-24
                prose-p:text-[var(--text-secondary)]
                prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-[var(--text-primary)]
                prose-code:text-[var(--accent)] prose-code:bg-[var(--surface)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-[var(--surface)] prose-pre:border prose-pre:border-[var(--surface-border)]
                prose-img:rounded-xl
                prose-blockquote:border-l-[var(--accent)] prose-blockquote:text-[var(--text-muted)]
                prose-li:text-[var(--text-secondary)]
              "
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-[var(--surface-border)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Link
                  href="/posts"
                  className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
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
      </div>
    </div>
  );
}
