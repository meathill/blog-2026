import type { MetadataRoute } from 'next';
import { getPosts, getCategories, getTags } from '@/lib/wordpress';
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

  // 获取所有分类
  let categoryMap = new Map<number, string>();
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await getCategories();
    categories.forEach((cat) => {
      categoryMap.set(cat.id, cat.slug);
    });
    categoryPages = categories
      .filter((cat) => cat.count > 0)
      .map((cat) => ({
        url: `${SITE_URL}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
        alternates: {
          languages: {
            zh: `${SITE_URL}/category/${cat.slug}`,
            en: `${SITE_URL}/en/category/${cat.slug}`,
          },
        },
      }));
  } catch (error) {
    console.warn('Failed to fetch categories for sitemap, skipping...', error);
  }

  // 获取所有标签
  let tagPages: MetadataRoute.Sitemap = [];
  try {
    const tags = await getTags({ perPage: 100 });
    tagPages = tags
      .filter((tag) => tag.count > 0)
      .map((tag) => ({
        url: `${SITE_URL}/tag/${tag.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
        alternates: {
          languages: {
            zh: `${SITE_URL}/tag/${tag.slug}`,
            en: `${SITE_URL}/en/tag/${tag.slug}`,
          },
        },
      }));
  } catch (error) {
    console.warn('Failed to fetch tags for sitemap, skipping...', error);
  }

  // 获取所有文章
  let postPages: MetadataRoute.Sitemap = [];
  try {
    const firstPage = await getPosts({
      perPage: 100,
      embed: false,
      fields: ['slug', 'date', 'categories'],
    });
    const allPostsMap = new Map();
    firstPage.posts.forEach((post) => allPostsMap.set(post.slug, post));

    if (firstPage.totalPages > 1) {
      const remainingPages = Array.from({ length: firstPage.totalPages - 1 }, (_, i) => i + 2);
      const results = await Promise.all(
        remainingPages.map((page) =>
          getPosts({
            page,
            perPage: 100,
            embed: false,
            fields: ['slug', 'date', 'categories'],
          }),
        ),
      );
      results.forEach((result) => {
        result.posts.forEach((post) => allPostsMap.set(post.slug, post));
      });
    }

    postPages = Array.from(allPostsMap.values()).map((post: any) => {
      let categorySlug = 'uncategorized';
      if (post.categories && post.categories.length > 0) {
        const catId = post.categories.find((id: number) => categoryMap.has(id));
        if (catId) {
          categorySlug = categoryMap.get(catId)!;
        }
      }
      const url = `${SITE_URL}/posts/${categorySlug}/${post.slug}`;
      return {
        url,
        lastModified: new Date(post.date),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        alternates: {
          languages: {
            zh: url,
            en: `${SITE_URL}/en/posts/${categorySlug}/${post.slug}`,
          },
        },
      };
    });
  } catch (error) {
    console.warn('Failed to fetch posts for sitemap, skipping...', error);
  }

  // 获取所有 Apps
  let appPages: MetadataRoute.Sitemap = [];
  try {
    const db = await getDb();
    const allApps = await db.select().from(apps).where(eq(apps.status, 'published'));
    appPages = allApps.map((app) => ({
      url: `${SITE_URL}/app/${app.slug}`,
      lastModified: app.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.warn('Failed to fetch apps for sitemap, skipping...', error);
  }

  return [...staticPages, ...postPages, ...categoryPages, ...tagPages, ...appPages];
}
