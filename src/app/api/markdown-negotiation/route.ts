import { type NextRequest, NextResponse } from 'next/server';
import { resolvePathMarkdown } from '@/lib/seo/markdown-negotiation';

export const dynamic = 'force-dynamic';

function createMarkdownHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/markdown; charset=utf-8',
    Vary: 'Accept',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  };
}

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get('path');

  if (!path) {
    return new NextResponse('Bad Request: missing path', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', Vary: 'Accept' },
    });
  }

  const markdown = await resolvePathMarkdown(path);
  if (!markdown) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', Vary: 'Accept' },
    });
  }

  return new NextResponse(markdown, {
    status: 200,
    headers: createMarkdownHeaders(),
  });
}

export async function HEAD(request: NextRequest): Promise<Response> {
  const res = await GET(request);
  return new Response(null, {
    status: res.status,
    headers: res.headers,
  });
}
