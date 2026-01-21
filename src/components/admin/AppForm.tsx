'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define simpler props since we are using formData directly in actions for now,
// but for uncontrolled inputs we can just pass initialData.
interface AppFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    url: string | null;
    icon: string | null;
    status: 'published' | 'draft' | 'archived';
  };
  action: (formData: FormData) => Promise<void>;
}

export default function AppForm({ initialData, action }: AppFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      await action(formData);
    } catch (error) {
      console.error(error);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      action={handleSubmit}
      className="space-y-6 max-w-2xl bg-white p-6 rounded-lg shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
          <input
            name="name"
            defaultValue={initialData?.name}
            required
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Slug</label>
          <input
            name="slug"
            defaultValue={initialData?.slug}
            placeholder="Leave empty to auto-generate"
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
          <select
            name="status"
            defaultValue={initialData?.status || 'draft'}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:text-white"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">URL</label>
          <input
            name="url"
            type="url"
            defaultValue={initialData?.url || ''}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:text-white"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Icon URL</label>
          <input
            name="icon"
            defaultValue={initialData?.icon || ''}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:text-white"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={initialData?.description || ''}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:text-white"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save App
        </button>
      </div>
    </form>
  );
}
