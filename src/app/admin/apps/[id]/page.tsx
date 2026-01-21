import AppForm from '@/components/admin/AppForm';
import { updateApp, deleteApp } from '@/actions/apps';
import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default async function EditAppPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const app = await db.select().from(apps).where(eq(apps.id, id)).get();

  if (!app) {
    notFound();
  }

  const updateAction = updateApp.bind(null, id);
  const deleteAction = deleteApp.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit App</h1>
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (!confirm('Are you sure you want to delete this app?')) {
              e.preventDefault();
            }
          }}
        >
          <button className="flex items-center gap-2 text-red-600 hover:text-red-700 px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium">
            <Trash2 size={16} />
            Delete App
          </button>
        </form>
      </div>
      <AppForm initialData={app} action={updateAction} />
    </div>
  );
}
