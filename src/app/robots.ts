import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/search'],
    },
    sitemap: 'https://meathill.com/sitemap.xml',
  };
}
