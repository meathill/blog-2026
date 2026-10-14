import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { ogImageHeaders } from '@/lib/og/cache-headers';
import { getOrCreatePostOgJpeg, OG_SIZE, regeneratePostOg, transcodeToJpeg } from '@/lib/og/post-image';

// Image metadata
export const size = OG_SIZE;
export const contentType = 'image/jpeg';

function placeholder(text: string): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        fontSize: 48,
        background: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        color: 'white',
      }}
    >
      {text}
    </div>,
    { ...OG_SIZE },
  );
}

async function respondPlaceholder(text: string, status: number): Promise<Response> {
  const { bytes, contentType: type } = await transcodeToJpeg(placeholder(text));
  return new Response(bytes, {
    status,
    headers: ogImageHeaders(type, false),
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const refresh = searchParams.get('refresh') === '1';

  if (!slug) {
    return respondPlaceholder('Missing Slug', 400);
  }

  const image = refresh ? await regeneratePostOg(slug) : await getOrCreatePostOgJpeg(slug);

  if (!image) {
    return respondPlaceholder('Article Not Found', 404);
  }

  return new Response(image.bytes, {
    headers: ogImageHeaders(image.contentType, !refresh),
  });
}
