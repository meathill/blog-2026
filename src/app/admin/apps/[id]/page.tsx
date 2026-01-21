import AppForm from '@/components/admin/AppForm';
import DeleteAppButton from '@/components/admin/DeleteAppButton';
import { updateApp, deleteApp } from '@/actions/apps';
import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

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
        <DeleteAppButton action={deleteAction} />
      </div>
      <AppForm initialData={app} action={updateAction} />
    </div>
  );
}
