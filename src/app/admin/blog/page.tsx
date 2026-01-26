import { NotionSyncButton } from '@/components/admin/NotionSyncButton';

export default function BlogAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Blog Management</h2>
        <div className="flex gap-2">
          <NotionSyncButton />
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-500">Sync your latest posts from Notion. More features coming soon.</p>
      </div>
    </div>
  );
}
