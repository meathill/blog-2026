import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { UploadError, uploadToR2 } from '@/lib/mcp/upload';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const { url } = await uploadToR2({
      bytes,
      byteLength: bytes.byteLength,
      contentType: file.type,
      filename: file.name,
    });

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error('[Upload API] Error:', message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
