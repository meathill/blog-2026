/**
 * WordPress REST API 客户端
 * 支持通过 IP 访问源站，Host 头使用域名
 */

// 从环境变量获取配置
const WP_API_BASE = process.env.WORDPRESS_API_URL || 'https://blog.meathill.com/wp-json/wp/v2';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.meathill.com';
// 可选：通过 IP 访问源站
const WP_ORIGIN_IP = process.env.WP_ORIGIN_IP; // 例如: "123.45.67.89"

export interface WPPost {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  categories: number[];
  tags: number[];
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
    'wp:term'?: Array<Array<{ id: number; name: string; slug: string }>>;
  };
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WPTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

/**
 * 发起 WordPress API 请求
 * 支持通过 IP 访问，Host 头使用域名
 */
async function wpFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let url = `${WP_API_BASE}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  // 如果配置了源站 IP，通过 IP 访问并设置 Host 头
  if (WP_ORIGIN_IP) {
    const siteHost = new URL(SITE_URL).host;
    url = url.replace(siteHost, WP_ORIGIN_IP);
    (headers as Record<string, string>)['Host'] = siteHost;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    next: {
      revalidate: 300, // 5 分钟缓存
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * 获取文章列表
 */
export async function getPosts(params?: {
  page?: number;
  perPage?: number;
  categories?: number[];
  tags?: number[];
  search?: string;
}): Promise<{ posts: WPPost[]; total: number; totalPages: number }> {
  const searchParams = new URLSearchParams();
  searchParams.set('_embed', 'true');
  searchParams.set('per_page', String(params?.perPage || 10));
  searchParams.set('page', String(params?.page || 1));

  if (params?.categories?.length) {
    searchParams.set('categories', params.categories.join(','));
  }
  if (params?.tags?.length) {
    searchParams.set('tags', params.tags.join(','));
  }
  if (params?.search) {
    searchParams.set('search', params.search);
  }

  const response = await fetch(`${WP_API_BASE}/posts?${searchParams}`, {
    headers: WP_ORIGIN_IP ? { Host: new URL(SITE_URL).host } : {},
    next: { revalidate: 300 },
  });

  const posts = await response.json();
  const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);

  return { posts, total, totalPages };
}

/**
 * 获取单篇文章
 */
export async function getPost(slug: string): Promise<WPPost | null> {
  const posts = await wpFetch<WPPost[]>(`/posts?slug=${encodeURIComponent(slug)}&_embed=true`);
  return posts[0] || null;
}

/**
 * 获取分类列表
 */
export async function getCategories(): Promise<WPCategory[]> {
  return wpFetch<WPCategory[]>('/categories?per_page=100');
}

/**
 * 获取标签列表
 */
export async function getTags(params?: { perPage?: number }): Promise<WPTag[]> {
  return wpFetch<WPTag[]>(`/tags?per_page=${params?.perPage || 100}&orderby=count&order=desc`);
}

/**
 * 从 HTML 中提取纯文本摘要
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * 计算阅读时间（分钟）
 */
export function calculateReadingTime(content: string): number {
  const text = stripHtml(content);
  const wordCount = text.length; // 中文按字符计算
  const wordsPerMinute = 400; // 中文阅读速度
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}
