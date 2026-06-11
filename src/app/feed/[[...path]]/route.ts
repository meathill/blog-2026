import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// 不要加 `export const runtime = 'edge'`:OpenNext Cloudflare 只打包 Node runtime
// 路由,edge runtime 的 route 不会进产物,线上会变成裸 500(2026-06-11 实测踩坑)

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

    // WP 的规范 feed URL 是无尾斜杠(/feed、/tag/x/feed),带斜杠会触发
    // canonical 301,Worker fetch 跟随重定向不可靠,这里直接请求规范形态
    let feedUrl = `${originUrl}/feed`;

    // If there are sub-paths, construct the origin feed URL correctly
    // e.g. /feed/tag/父亲节 -> Origin: /tag/父亲节/feed
    if (path && path.length > 0) {
      const originalPath = path.map((segment) => encodeURIComponent(segment)).join('/');
      feedUrl = `${originUrl}/${originalPath}/feed`;
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
    const message = error instanceof Error ? error.message : String(error);
    return new NextResponse(`Feed proxy error: ${message}`, { status: 500 });
  }
}
