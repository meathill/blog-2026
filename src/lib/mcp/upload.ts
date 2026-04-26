import { getCloudflareContext } from '@opennextjs/cloudflare';

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
]);
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

export class UploadError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

export interface UploadInput {
  bytes: Uint8Array | ArrayBuffer | ReadableStream<Uint8Array>;
  byteLength: number;
  contentType: string;
  filename?: string;
}

export interface UploadResult {
  key: string;
  url: string;
}

function pickExtension(contentType: string, filename?: string): string {
  if (filename) {
    const m = filename.match(/\.([a-zA-Z0-9]+)$/);
    if (m) return m[1].toLowerCase();
  }
  return MIME_EXT[contentType] || 'bin';
}

export async function uploadToR2(input: UploadInput): Promise<UploadResult> {
  if (!ALLOWED_MIME.has(input.contentType)) {
    throw new UploadError(`Unsupported content type: ${input.contentType}`, 415);
  }
  if (input.byteLength > MAX_UPLOAD_BYTES) {
    throw new UploadError(`File too large (max ${MAX_UPLOAD_BYTES} bytes)`, 413);
  }

  const { env } = await getCloudflareContext({ async: true });
  if (!env.BUCKET) {
    throw new UploadError('R2 bucket not configured', 500);
  }

  const ext = pickExtension(input.contentType, input.filename);
  const safeName = input.filename ? input.filename.replace(/[^a-zA-Z0-9._-]+/g, '-') : `upload.${ext}`;
  const key = `${crypto.randomUUID()}-${safeName}`;

  await env.BUCKET.put(key, input.bytes as ArrayBuffer | Uint8Array | ReadableStream, {
    httpMetadata: { contentType: input.contentType },
  });

  const assetsUrl = process.env.NEXT_PUBLIC_ASSETS_URL || 'https://i.meathill.com';
  const baseUrl = assetsUrl.endsWith('/') ? assetsUrl.slice(0, -1) : assetsUrl;
  return { key, url: `${baseUrl}/${key}` };
}

export async function fetchRemoteImage(sourceUrl: string): Promise<{
  bytes: ArrayBuffer;
  byteLength: number;
  contentType: string;
}> {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new UploadError('Invalid sourceUrl', 400);
  }
  if (parsed.protocol !== 'https:') {
    throw new UploadError('sourceUrl must use https', 400);
  }
  const res = await fetch(parsed.toString());
  if (!res.ok) throw new UploadError(`Fetch failed: ${res.status}`, 400);
  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_MIME.has(contentType)) {
    throw new UploadError(`Remote content type not allowed: ${contentType}`, 415);
  }
  const lengthHeader = res.headers.get('content-length');
  if (lengthHeader && Number(lengthHeader) > MAX_UPLOAD_BYTES) {
    throw new UploadError('Remote file too large', 413);
  }
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new UploadError('Remote file too large', 413);
  }
  return { bytes, byteLength: bytes.byteLength, contentType };
}
