'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { syncNotionToWordPress } from '@/lib/sync-service';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function triggerNotionSync() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  const { env } = await getCloudflareContext({ async: true });
  return await syncNotionToWordPress(env);
}
