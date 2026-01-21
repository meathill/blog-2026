'use server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function uploadImage(formData: FormData) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error('Unauthorized');
  }

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  const { env } = await getCloudflareContext({ async: true });
  const key = `${crypto.randomUUID()}-${file.name}`;

  try {
    // @ts-ignore - BUCKET might not be strictly typed yet in some environments
    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const assetsUrl = env.NEXT_PUBLIC_ASSETS_URL || 'https://i.meathill.com';
    // Ensure no trailing slash
    const baseUrl = assetsUrl.endsWith('/') ? assetsUrl.slice(0, -1) : assetsUrl;
    const url = `${baseUrl}/${key}`;

    return { url };
  } catch (error) {
    console.error('Upload Error:', error);
    throw new Error('Failed to upload image');
  }
}
