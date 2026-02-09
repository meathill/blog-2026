import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ExternalLink, Github, TagIcon } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { marked } from 'marked';
import { getAppTags } from '@/actions/tags';
import AwesomeComment from '@/components/AwesomeComment';
import { getCategoryBySlug, getPostsByCategory } from '@/lib/wordpress';
import PostCard from '@/components/PostCard';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const db = await getDb();
  const app = await db.select().from(apps).where(eq(apps.slug, slug)).get();

  if (!app) {
    return {
      title: 'App Not Found',
    };
  }

  return {
    title: app.name,
    description: app.description,
    openGraph: {
      title: app.name,
      description: app.description || '',
      images: app.icon ? [app.icon] : [],
    },
  };
}

export default async function AppDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const db = await getDb();
  const app = await db.select().from(apps).where(eq(apps.slug, slug)).get();

  if (!app || app.status !== 'published') {
    notFound();
  }

  const tags = await getAppTags(app.id);

  // Convert markdown to HTML
  const contentHtml = app.content ? await marked(app.content) : '';

  const category = await getCategoryBySlug(slug);
  let recentPosts: any[] = [];
  if (category) {
    recentPosts = await getPostsByCategory(category.id, 1, 3);
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <nav className="mb-8 flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          首页
        </Link>
        <span className="mx-2">/</span>
        <Link href="/app" className="hover:text-foreground transition-colors">
          Apps
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium truncate">{app.name}</span>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="shrink-0">
            {app.icon ? (
              <img
                src={app.icon}
                alt={app.name}
                className="h-24 w-24 md:h-32 md:w-32 rounded-2xl object-cover shadow-lg ring-1 ring-black/5 dark:ring-white/10"
              />
            ) : (
              <div className="flex h-24 w-24 md:h-32 md:w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-4xl shadow-lg">
                {app.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-grow">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{app.name}</h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-6 leading-relaxed">{app.description}</p>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 text-sm font-medium"
                  >
                    <TagIcon size={14} className="opacity-70" />
                    {tag.name}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              {app.url && (
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-amber-500 hover:shadow-amber-500/30 hover:-translate-y-0.5"
                >
                  Launch App <ExternalLink size={18} />
                </a>
              )}
              {app.repoUrl && (
                <a
                  href={app.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-6 py-3 text-base font-semibold text-zinc-900 shadow-lg transition-all hover:bg-zinc-200 hover:-translate-y-0.5 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                >
                  Source Code <Github size={18} />
                </a>
              )}
            </div>
          </div>
        </div>

        {contentHtml && (
          <div className="mt-12 md:mt-16 prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        )}

        {recentPosts.length > 0 && (
          <div className="mt-16 border-t border-zinc-200 dark:border-zinc-800 pt-16">
            <h2 className="text-2xl font-bold mb-8">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        <AwesomeComment />
      </div>
    </div>
  );
}
