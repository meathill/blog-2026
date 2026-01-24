import AppForm from '@/components/admin/AppForm';
import { createApp } from '@/actions/apps';
import { getTags } from '@/actions/tags';

export default async function NewAppPage() {
  const allTags = await getTags();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New App</h1>
      <AppForm action={createApp} allTags={allTags} />
    </div>
  );
}
