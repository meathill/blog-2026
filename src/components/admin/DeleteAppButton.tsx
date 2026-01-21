'use client';

import { Trash2 } from 'lucide-react';

interface DeleteAppButtonProps {
  action: (formData: FormData) => Promise<void>;
}

export default function DeleteAppButton({ action }: DeleteAppButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('Are you sure you want to delete this app?')) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-2 text-red-600 hover:text-red-700 px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium"
      >
        <Trash2 size={16} />
        Delete App
      </button>
    </form>
  );
}
