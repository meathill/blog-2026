export const dynamic = 'force-static';

export function generateRobotsTxt(): string {
  return [
    'User-Agent: *',
    'Content-Signal: ai-train=no, search=yes, ai-input=yes',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /_next/',
    'Disallow: /search',
    '',
    'User-Agent: AhrefsSiteAudit',
    'User-Agent: AhrefsBot',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /_next/',
    'Disallow: /search',
    'Disallow: /tag/',
    'Disallow: /en/tag/',
    '',
    'Sitemap: https://meathill.com/sitemap.xml',
    '',
  ].join('\n');
}

export function GET(): Response {
  return new Response(generateRobotsTxt(), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
    },
  });
}
