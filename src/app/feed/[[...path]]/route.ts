import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const runtime = 'edge';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  try {
    const { env } = await getCloudflareContext({ async: true });

    // Example WORDPRESS_API_URL: https://blog.meathill.com/wp-json/wp/v2
    const apiUrl = env.WORDPRESS_API_URL;
    if (!apiUrl) {
      return new NextResponse('Missing WORDPRESS_API_URL environment variable', { status: 500 });
    }

    const { path } = await params;

    // Extract the origin URL
    const originUrl = new URL(apiUrl).origin;

    let feedUrl = `${originUrl}/feed/`;

    // If there are sub-paths, construct the origin feed URL correctly
    // e.g. /feed/tag/父亲节 -> Origin: /tag/父亲节/feed/
    if (path && path.length > 0) {
      const originalPath = path.map((segment) => encodeURIComponent(segment)).join('/');
      feedUrl = `${originUrl}/${originalPath}/feed/`;
    }

    const originResponse = await fetch(feedUrl, {
      next: { revalidate: 3600 },
      headers: {
        Accept: 'application/rss+xml, application/xml',
      },
    });

    if (!originResponse.ok) {
      console.error(`Failed to fetch nested feed from origin. URL: ${feedUrl}, Status: ${originResponse.status}`);
      return new NextResponse('Origin Feed Unavailable', { status: originResponse.status });
    }

    const xmlText = await originResponse.text();

    return new NextResponse(xmlText, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error proxying nested feed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
