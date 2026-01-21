import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import AppCard from '@/components/AppCard';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function FeaturedApps() {
  const db = await getDb();
  const featuredApps = await db
    .select()
    .from(apps)
    .where(eq(apps.status, 'published'))
    .orderBy(desc(apps.createdAt))
    .limit(3);

  if (featuredApps.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Apps & Tools
            </h2>
            <p className="mt-2 text-muted-foreground">Small utilities I built for fun and profit.</p>
          </div>

          <Link
            href="/app"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            View All Apps <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/app"
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
          >
            View All Apps <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
