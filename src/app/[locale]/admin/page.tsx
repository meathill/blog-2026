import Link from 'next/link';
import { Plus, ExternalLink, Pencil as PencilIcon } from 'lucide-react';
import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const APP_STATUS_VARIANT = {
  published: 'success',
  draft: 'warning',
  archived: 'secondary',
} as const;

export default async function AdminDashboard() {
  const db = await getDb();
  const allApps = await db.select().from(apps).orderBy(desc(apps.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">My Apps</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            管理你的应用和项目。创建新应用后可以在前台展示。
          </p>
        </div>
        <Button render={<Link href="/admin/apps/new" />}>
          <Plus className="size-4" />
          Create App
        </Button>
      </div>

      {allApps.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>还没有应用</CardTitle>
            <CardDescription>点击上方按钮创建你的第一个应用。</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allApps.map((app) => (
            <Card key={app.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {app.icon && <img src={app.icon} alt={app.name} className="size-10 rounded-lg" />}
                  <div className="space-y-1">
                    <CardTitle className="text-base">{app.name}</CardTitle>
                    <Badge variant={APP_STATUS_VARIANT[app.status as keyof typeof APP_STATUS_VARIANT] ?? 'outline'}>
                      {app.status}
                    </Badge>
                  </div>
                </div>
                <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                  <Button variant="ghost" size="icon-sm" render={<Link href={`/admin/apps/${app.id}`} />}>
                    <PencilIcon className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{app.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>/{app.slug}</span>
                  {app.url && (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1 transition hover:text-primary"
                    >
                      View <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
