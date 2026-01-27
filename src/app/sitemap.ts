import type { MetadataRoute } from 'next';
import { getPosts, getCategories } from '@/lib/wordpress';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { apps } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const revalidate = 86400; // 1 day

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { env } = await getCloudflareContext({ async: true });
  const SITE_URL = env.NEXT_PUBLIC_SITE_URL;
  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/posts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/app`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 获取所有文章
  const { posts } = await getPosts({
    perPage: 100,
    embed: false,
    fields: ['slug', 'date'],
  });
  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 获取所有分类
  const categories = await getCategories();
  const categoryPages: MetadataRoute.Sitemap = categories
    .filter((cat) => cat.count > 0)
    .map((cat) => ({
      url: `${SITE_URL}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

  // 获取所有 Apps
  const db = await getDb();
  const allApps = await db.select().from(apps).where(eq(apps.status, 'published'));
  const appPages: MetadataRoute.Sitemap = allApps.map((app) => ({
    url: `${SITE_URL}/app/${app.slug}`,
    lastModified: app.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...postPages, ...categoryPages, ...appPages];
}
