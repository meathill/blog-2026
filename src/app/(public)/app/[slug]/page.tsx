import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

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

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <Link
        href="/app"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-amber-600 mb-8 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to Apps
      </Link>

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
          </div>
        </div>

        {/* Future: Screenshots or more details could go here */}
      </div>
    </div>
  );
}
