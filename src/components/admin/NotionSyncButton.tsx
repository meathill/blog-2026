'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { triggerNotionSync } from '@/app/actions/sync';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function NotionSyncButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    try {
      const result = await triggerNotionSync();
      if (result.success) {
        router.refresh();
        toast.success('Sync Completed', {
          description: `Processed ${result.logs.length} operations.`,
        });
      } else {
        toast.error('Sync Failed', {
          description: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      toast.error('Sync Error', { description: 'Failed to invoke sync action' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleSync} disabled={loading} className="gap-2 bg-amber-600 hover:bg-amber-500" variant="default">
      <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      {loading ? 'Syncing...' : 'Sync Notion'}
    </Button>
  );
}
