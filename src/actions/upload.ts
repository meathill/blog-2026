'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function uploadImage(formData: FormData) {
  console.log('[Upload] Starting upload...');

  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    console.error('[Upload] No session found - user not authenticated');
    throw new Error('Unauthorized');
  }

  console.log('[Upload] User authenticated:', session.user?.email);

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  console.log('[Upload] File:', file.name, 'Size:', file.size, 'Type:', file.type);

  const { env } = await getCloudflareContext({ async: true });

  if (!env.BUCKET) {
    console.error('[Upload] BUCKET binding not found in env');
    throw new Error('R2 bucket not configured');
  }

  const key = `${crypto.randomUUID()}-${file.name}`;
  console.log('[Upload] Uploading to key:', key);

  try {
    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const assetsUrl = env.NEXT_PUBLIC_ASSETS_URL || 'https://i.meathill.com';
    const baseUrl = assetsUrl.endsWith('/') ? assetsUrl.slice(0, -1) : assetsUrl;
    const url = `${baseUrl}/${key}`;

    console.log('[Upload] Success! URL:', url);
    return { url };
  } catch (error: any) {
    console.error('[Upload] R2 put failed:', error?.message, error);
    throw new Error(`Failed to upload image: ${error?.message || 'Unknown error'}`);
  }
}
