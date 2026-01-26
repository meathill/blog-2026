import { getCloudflareContext } from '@opennextjs/cloudflare';

function getAccessHeaders(env: CloudflareEnv): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'User-Agent': 'Next.js Worker',
  };

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
      revalidate: options?.cache === 'no-store' ? 0 : 300,
      ...options?.next,
    },
    cache: options?.cache,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[WP API] Error Body:', text);
    throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

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

export async function getPost(slug: string, options?: RequestInit): Promise<WPPost | null> {
  const posts = await wpFetch<WPPost[]>(`/posts?slug=${encodeURIComponent(slug)}&_embed=true`, options);
  return posts[0] || null;
}

export async function getCategories(): Promise<WPCategory[]> {
  return wpFetch<WPCategory[]>('/categories?per_page=100');
}

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

export async function getCategoryBySlug(slug: string): Promise<WPCategory | null> {
  const categories = await wpFetch<WPCategory[]>(`/categories?slug=${encodeURIComponent(slug)}`);
  return categories[0] || null;
}

export async function getPostsByCategory(categoryId: number, page = 1, perPage = 20): Promise<WPPost[]> {
  return wpFetch<WPPost[]>(`/posts?categories=${categoryId}&page=${page}&per_page=${perPage}&_embed=true`);
}

export async function getTagBySlug(slug: string): Promise<WPTag | null> {
  const tags = await wpFetch<WPTag[]>(`/tags?slug=${encodeURIComponent(slug)}`);
  return tags[0] || null;
}

export async function getPostsByTag(tagId: number, page = 1, perPage = 20): Promise<WPPost[]> {
  return wpFetch<WPPost[]>(`/posts?tags=${tagId}&page=${page}&per_page=${perPage}&_embed=true`);
}

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

export function calculateReadingTime(content: string): number {
  const text = stripHtml(content);
  const wordCount = text.length;
  const wordsPerMinute = 400;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

export function processContent(html: string): string {
  return html
    .replace(/href="https?:\/\/blog\.meathill\.com\/[^"]*?(#[^"]+)"/g, 'href="$1"')
    .replace(/href="https?:\/\/blog\.meathill\.com\/([^"#]+)\.html"/g, 'href="/posts/$1"');
}

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

export async function verifyAuth(env: CloudflareEnv): Promise<any> {
  const url = `${env.WORDPRESS_API_URL}/users/me?context=edit`; // context=edit reveals roles
  const headers = {
    ...getAccessHeaders(env),
    ...getBasicAuthHeader(env),
  };

  console.log('[WP Auth Check] Request:', url);
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text();
    console.error('[WP Auth Check] Failed:', response.status, text);
    return { success: false, status: response.status, body: text };
  }

  const user = (await response.json()) as any;
  console.log('[WP Auth Check] Success. User:', user.name, 'Roles:', user.roles);
  return { success: true, user };
}

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

export async function updatePost(env: CloudflareEnv, id: number, postData: any): Promise<WPPost> {
  const url = `${env.WORDPRESS_API_URL}/posts/${id}`;
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
    throw new Error(`Failed to update post: ${response.status} ${text}`);
  }

  return response.json();
}

export async function uploadMedia(env: CloudflareEnv, buffer: ArrayBuffer, filename: string): Promise<any> {
  const url = `${env.WORDPRESS_API_URL}/media`;

  const headers = {
    ...getAccessHeaders(env),
    ...getBasicAuthHeader(env),
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Type': 'image/jpeg',
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

export async function createCategory(env: CloudflareEnv, name: string): Promise<WPCategory> {
  const url = `${env.WORDPRESS_API_URL}/categories`;
  const headers = {
    ...getAccessHeaders(env),
    ...getBasicAuthHeader(env),
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create category: ${response.status} ${text}`);
  }

  return response.json();
}

export async function createTag(env: CloudflareEnv, name: string): Promise<WPTag> {
  const url = `${env.WORDPRESS_API_URL}/tags`;
  const headers = {
    ...getAccessHeaders(env),
    ...getBasicAuthHeader(env),
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create tag: ${response.status} ${text}`);
  }

  return response.json();
}

export async function getOrCreateCategory(env: CloudflareEnv, name: string): Promise<WPCategory> {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  let category = await getCategoryBySlug(slug);
  if (!category) {
    console.log(`[WP] Category "${name}" not found (slug: ${slug}), creating...`);
    try {
      category = await createCategory(env, name);
    } catch (e: any) {
      const match = e.message.match(/"term_id":(\d+)/);
      if (match && match[1]) {
        const existingId = parseInt(match[1], 10);
        console.log(`[WP] Category "${name}" already exists (ID: ${existingId}), using existing.`);
        const url = `/categories?include=${existingId}`;
        const cats = await wpFetch<WPCategory[]>(url);
        if (cats.length > 0) category = cats[0];
      }

      if (!category) throw e;
    }
  }
  return category;
}

export async function getOrCreateTag(env: CloudflareEnv, name: string): Promise<WPTag> {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  let tag = await getTagBySlug(slug);
  if (!tag) {
    console.log(`[WP] Tag "${name}" not found (slug: ${slug}), creating...`);
    try {
      tag = await createTag(env, name);
    } catch (e: any) {
      // Check for term_exists error
      const match = e.message.match(/"term_id":(\d+)/);
      if (match && match[1]) {
        const existingId = parseInt(match[1], 10);
        console.log(`[WP] Tag "${name}" already exists (ID: ${existingId}), using existing.`);
        const existingTags = await getTags({ include: [existingId] });
        if (existingTags.length > 0) {
          tag = existingTags[0];
        }
      }

      if (!tag) {
        throw e;
      }
    }
  }
  return tag;
}
