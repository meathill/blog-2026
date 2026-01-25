import Link from 'next/link';
import { Plus, ExternalLink, Pencil as PencilIcon } from 'lucide-react';
import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { NotionSyncButton } from '@/components/admin/NotionSyncButton';

export default async function AdminDashboard() {
  const db = await getDb();
  const allApps = await db.select().from(apps).orderBy(desc(apps.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Apps</h2>
        <div className="flex gap-2">
          <NotionSyncButton />
          <Link
            href="/admin/apps/new"
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
          >
            <Plus size={16} />
            Create App
          </Link>
        </div>
      </div>

      {allApps.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500">No apps found. Create your first app!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allApps.map((app) => (
            <div
              key={app.id}
              className="relative group rounded-lg border border-border bg-card text-card-foreground p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {app.icon && <img src={app.icon} alt={app.name} className="w-10 h-10 rounded" />}
                  <div>
                    <h3 className="font-semibold">{app.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        app.status === 'published'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : app.status === 'draft'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>
                <Link href={`/admin/apps/${app.id}`} className="p-2 text-muted-foreground hover:text-amber-600">
                  <PencilIcon size={16} />
                </Link>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{app.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>/{app.slug}</span>
                {app.url && (
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 hover:text-amber-600"
                  >
                    View <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
