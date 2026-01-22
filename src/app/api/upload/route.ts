import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('[Upload API] Starting upload...');

  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      console.error('[Upload API] No session found - user not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Upload API] User authenticated:', session.user?.email);

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('[Upload API] File:', file.name, 'Size:', file.size, 'Type:', file.type);

    const { env } = await getCloudflareContext({ async: true });

    if (!env.BUCKET) {
      console.error('[Upload API] BUCKET binding not found in env');
      return NextResponse.json({ error: 'R2 bucket not configured' }, { status: 500 });
    }

    const key = `${crypto.randomUUID()}-${file.name}`;
    console.log('[Upload API] Uploading to key:', key);

    await env.BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const assetsUrl = env.NEXT_PUBLIC_ASSETS_URL || 'https://i.meathill.com';
    const baseUrl = assetsUrl.endsWith('/') ? assetsUrl.slice(0, -1) : assetsUrl;
    const url = `${baseUrl}/${key}`;

    console.log('[Upload API] Success! URL:', url);
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('[Upload API] Error:', error?.message, error);
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
