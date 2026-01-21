import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import AppCard from '@/components/AppCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apps & Tools',
  description: 'Collection of useful small tools and apps built by Meathill.',
};

export default async function AppListPage() {
  const db = await getDb();
  const publishedApps = await db.select().from(apps).where(eq(apps.status, 'published')).orderBy(desc(apps.createdAt));

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-responsive-hero mb-6 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Apps & Tools
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          A collection of small utilities, experiments, and tools I've built.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {publishedApps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>

      {publishedApps.length === 0 && (
        <div className="text-center py-12 text-zinc-500 italic">More apps coming soon...</div>
      )}
    </div>
  );
}
