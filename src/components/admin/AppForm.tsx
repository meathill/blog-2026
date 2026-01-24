'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MarkdownEditor from './MarkdownEditor';
import TagSelector from './TagSelector';

// Define simpler props since we are using formData directly in actions for now,
// but for uncontrolled inputs we can just pass initialData.
interface AppFormProps {
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    content: string | null;
    url: string | null;
    repoUrl: string | null;
    icon: string | null;
    status: 'published' | 'draft' | 'archived';
  };
  action: (formData: FormData) => Promise<void>;
  allTags?: { id: string; name: string; slug: string }[];
  initialTags?: { id: string; name: string; slug: string }[];
}

export default function AppForm({ initialData, action, allTags = [], initialTags = [] }: AppFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use API route instead of Server Action for better compatibility
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = (await response.json()) as { url: string };

      // Update the icon input value
      const iconInput = document.getElementsByName('icon')[0] as HTMLInputElement;
      if (iconInput) {
        iconInput.value = data.url;
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error?.message || 'Please try again.'}`);
    } finally {
      setUploading(false);
    }
  };

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
      className="space-y-6 max-w-2xl bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-foreground">Name</label>
          <input
            name="name"
            defaultValue={initialData?.name}
            required
            className="mt-1 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Slug</label>
          <input
            name="slug"
            defaultValue={initialData?.slug}
            placeholder="Leave empty to auto-generate"
            className="mt-1 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Status</label>
          <select
            name="status"
            defaultValue={initialData?.status || 'draft'}
            className="mt-1 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-foreground focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="draft" className="bg-popover text-popover-foreground">
              Draft
            </option>
            <option value="published" className="bg-popover text-popover-foreground">
              Published
            </option>
            <option value="archived" className="bg-popover text-popover-foreground">
              Archived
            </option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-foreground">URL</label>
          <input
            name="url"
            type="url"
            defaultValue={initialData?.url || ''}
            className="mt-1 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-foreground">Icon URL</label>
          <div className="flex gap-2">
            <input
              name="icon"
              defaultValue={initialData?.icon || ''}
              className="mt-1 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
            <label className="flex items-center justify-center px-4 py-2 border border-input rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground">
              {uploading ? <Loader2 className="animate-spin" size={16} /> : <span className="text-sm">Upload</span>}
              <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-foreground">Description (Short)</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={initialData?.description || ''}
            className="mt-1 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="col-span-2">
          <MarkdownEditor name="content" defaultValue={initialData?.content || ''} rows={12} />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Repo URL</label>
          <input
            name="repoUrl"
            type="url"
            defaultValue={initialData?.repoUrl || ''}
            className="mt-1 block w-full rounded-lg border border-input bg-transparent px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="col-span-2">
          <TagSelector allTags={allTags} initialTags={initialTags} />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
