import type { MetadataRoute } from 'next';
import { getPosts, getCategories } from '@/lib/wordpress';

const SITE_URL = 'https://meathill.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 获取所有文章
  const { posts } = await getPosts({ perPage: 100 });
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

  return [...staticPages, ...postPages, ...categoryPages];
}
