/**
 * WordPress REST API 客户端
 * 使用 Cloudflare Zero Trust 鉴权访问源站
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * 获取 Cloudflare Access 认证头
 */
function getAccessHeaders(env: CloudflareEnv): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'User-Agent': 'Next.js Worker',
  };

  // 添加 Zero Trust 认证头
  const CF_ACCESS_CLIENT_ID = env.CF_ACCESS_CLIENT_ID || process.env.CF_ACCESS_CLIENT_ID;
  const CF_ACCESS_CLIENT_SECRET = env.CF_ACCESS_CLIENT_SECRET || process.env.CF_ACCESS_CLIENT_SECRET;
  if (CF_ACCESS_CLIENT_ID && CF_ACCESS_CLIENT_SECRET) {
    headers['CF-Access-Client-Id'] = CF_ACCESS_CLIENT_ID;
    headers['CF-Access-Client-Secret'] = CF_ACCESS_CLIENT_SECRET;
  }

  return headers;
}

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
  const { env } = await getCloudflareContext({ async: true });
  const url = `${env.WORDPRESS_API_URL}${endpoint}`;
  const headers: HeadersInit = {
    ...getAccessHeaders(env),
    ...(options?.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    next: {
      revalidate: 300, // 5 分钟缓存
    },
  });

  console.log('[WP API] Request:', url, 'Headers:', JSON.stringify(headers));
  console.log('[WP API] Response status:', response.status);

  if (!response.ok) {
    const text = await response.text();
    console.error('[WP API] Error Body:', text);
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

  const { env } = await getCloudflareContext({ async: true });
  const response = await fetch(`${env.WORDPRESS_API_URL}/posts?${searchParams}`, {
    headers: getAccessHeaders(env),
    next: { revalidate: 300 },
  });

  const posts: WPPost[] = await response.json();
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
export async function getTags(params?: { perPage?: number; include?: number[] }): Promise<WPTag[]> {
  const query = new URLSearchParams({
    per_page: String(params?.perPage || 100),
    orderby: 'count',
    order: 'desc',
  });

  if (params?.include?.length) {
    query.set('include', params.include.join(','));
  }

  return wpFetch<WPTag[]>(`/tags?${query.toString()}`);
}

/**
 * 通过 slug 获取分类
 */
export async function getCategoryBySlug(slug: string): Promise<WPCategory | null> {
  const categories = await wpFetch<WPCategory[]>(`/categories?slug=${encodeURIComponent(slug)}`);
  return categories[0] || null;
}

/**
 * 获取分类下的文章
 */
export async function getPostsByCategory(categoryId: number, page = 1, perPage = 20): Promise<WPPost[]> {
  return wpFetch<WPPost[]>(`/posts?categories=${categoryId}&page=${page}&per_page=${perPage}&_embed=true`);
}

/**
 * 通过 slug 获取标签
 */
export async function getTagBySlug(slug: string): Promise<WPTag | null> {
  const tags = await wpFetch<WPTag[]>(`/tags?slug=${encodeURIComponent(slug)}`);
  return tags[0] || null;
}

/**
 * 获取标签下的文章
 */
export async function getPostsByTag(tagId: number, page = 1, perPage = 20): Promise<WPPost[]> {
  return wpFetch<WPPost[]>(`/posts?tags=${tagId}&page=${page}&per_page=${perPage}&_embed=true`);
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

/**
 * 处理文章内容中的链接
 * - 将 blog.meathill.com 的完整 URL 锚点链接转为纯锚点
 * - 将 blog.meathill.com 的文章链接转为本地路由
 */
export function processContent(html: string): string {
  return (
    html
      // 将带锚点的完整 URL 替换为纯锚点（用于 TOC）
      .replace(/href="https?:\/\/blog\.meathill\.com\/[^"]*?(#[^"]+)"/g, 'href="$1"')
      // 将老博客文章链接转为本地路由
      .replace(/href="https?:\/\/blog\.meathill\.com\/([^"#]+)\.html"/g, 'href="/posts/$1"')
  );
}

/**
 * Basic Auth Header Helper
 */
function getBasicAuthHeader(env: CloudflareEnv): HeadersInit {
  const WP_USERNAME = env.WP_USERNAME || process.env.WP_USERNAME;
  const WP_APP_PASSWORD = env.WP_APP_PASSWORD || process.env.WP_APP_PASSWORD;
  if (!WP_USERNAME || !WP_APP_PASSWORD) {
    throw new Error('Missing WP_USERNAME or WP_APP_PASSWORD');
  }
  const auth = btoa(`${WP_USERNAME}:${WP_APP_PASSWORD}`);
  return {
    Authorization: `Basic ${auth}`,
  };
}

/**
 * Create a new post in WordPress
 */
export async function createPost(env: CloudflareEnv, postData: any): Promise<WPPost> {
  const url = `${env.WORDPRESS_API_URL}/posts`;
  const headers = {
    ...getAccessHeaders(env),
    ...getBasicAuthHeader(env),
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create post: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Update an existing post in WordPress
 */
export async function updatePost(env: CloudflareEnv, id: number, postData: any): Promise<WPPost> {
  const url = `${env.WORDPRESS_API_URL}/posts/${id}`;
  const headers = {
    ...getAccessHeaders(env),
    ...getBasicAuthHeader(env),
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method: 'POST', // WP REST API uses POST for updates (or PUT/PATCH)
    headers,
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to update post: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Upload Media to WordPress
 */
export async function uploadMedia(env: CloudflareEnv, buffer: ArrayBuffer, filename: string): Promise<any> {
  const url = `${env.WORDPRESS_API_URL}/media`;

  const headers = {
    ...getAccessHeaders(env),
    ...getBasicAuthHeader(env),
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Type': 'image/jpeg', // Default, should ideally be detected
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: buffer,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to upload media: ${response.status} ${text}`);
  }

  return response.json();
}
