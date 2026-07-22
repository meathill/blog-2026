import { cache } from 'react';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { wpFetch, getAccessHeaders, getBasicAuthHeader } from './client';
import { WPPost } from './types';

export const getPosts = cache(
  async (params?: {
    page?: number;
    perPage?: number;
    categories?: number[];
    tags?: number[];
    author?: number;
    search?: string;
    embed?: boolean;
    fields?: string[];
  }): Promise<{ posts: WPPost[]; total: number; totalPages: number }> => {
    const searchParams = new URLSearchParams();
    const { embed = true, fields, ...rest } = params || {};

    if (embed) {
      searchParams.set('_embed', 'true');
    }
    if (fields && fields.length > 0) {
      searchParams.set('_fields', fields.join(','));
    }
    searchParams.set('per_page', String(params?.perPage || 10));
    searchParams.set('page', String(params?.page || 1));

    if (params?.categories?.length) {
      searchParams.set('categories', params.categories.join(','));
    }
    if (params?.tags?.length) {
      searchParams.set('tags', params.tags.join(','));
    }
    if (params?.author) {
      searchParams.set('author', String(params.author));
    }
    if (params?.search) {
      searchParams.set('search', params.search);
    }

    const { env } = await getCloudflareContext({ async: true });
    const headers = getAccessHeaders(env);
    const url = `${env.WORDPRESS_API_URL}/posts?${searchParams}`;

    const response = await fetch(url, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      if (response.status === 400) {
        const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);
        return { posts: [], total, totalPages };
      }
      const text = await response.text();
      console.error('[WP API] Error Body:', text);
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const posts: WPPost[] = await response.json();
    const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);

    return { posts, total, totalPages };
  },
);

export const getPost = cache(async (slug: string, options?: RequestInit): Promise<WPPost | null> => {
  const posts = await wpFetch<WPPost[]>(`/posts?slug=${encodeURIComponent(slug)}&_embed=true`, options);
  return posts[0] || null;
});

export async function getPostById(id: number, options?: RequestInit): Promise<WPPost | null> {
  const { env } = await getCloudflareContext({ async: true });
  const headers = {
    ...getAccessHeaders(env),
    ...(options?.headers || {}),
  };

  const response = await fetch(`${env.WORDPRESS_API_URL}/posts/${id}?_embed=true`, {
    ...options,
    headers,
    next: {
      revalidate: options?.cache === 'no-store' ? 0 : 300,
      ...options?.next,
    },
    cache: options?.cache,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    console.error('[WP API] Error Body:', text);
    throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const getPostsByCategory = cache(
  async (
    categoryId: number,
    page = 1,
    perPage = 20,
  ): Promise<{ posts: WPPost[]; total: number; totalPages: number }> => {
    const { env } = await getCloudflareContext({ async: true });
    const headers = getAccessHeaders(env);
    const url = `${env.WORDPRESS_API_URL}/posts?categories=${categoryId}&page=${page}&per_page=${perPage}&_embed=true`;

    const response = await fetch(url, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      if (response.status === 400) {
        const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);
        return { posts: [], total, totalPages };
      }
      const text = await response.text();
      console.error('[WP API] Error Body:', text);
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const posts: WPPost[] = await response.json();
    const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);

    return { posts, total, totalPages };
  },
);

export const getPostsByTag = cache(
  async (tagId: number, page = 1, perPage = 20): Promise<{ posts: WPPost[]; total: number; totalPages: number }> => {
    const { env } = await getCloudflareContext({ async: true });
    const headers = getAccessHeaders(env);
    const url = `${env.WORDPRESS_API_URL}/posts?tags=${tagId}&page=${page}&per_page=${perPage}&_embed=true`;

    const response = await fetch(url, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      if (response.status === 400) {
        const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
        const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);
        return { posts: [], total, totalPages };
      }
      const text = await response.text();
      console.error('[WP API] Error Body:', text);
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const posts: WPPost[] = await response.json();
    const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);

    return { posts, total, totalPages };
  },
);

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

// SEO/OG 描述目标长度：110–160 字符（Ahrefs/搜索引擎摘要下限 110，OG 卡片上限 160）。
// issue #4 曾决策 excerpt 一律优先、不凑长度；2026-07 Ahrefs 复查发现 1458 个可索引页
// 描述过短，修订为：excerpt ≥110 仍原样优先；不足 110 时以 excerpt 开头拼接正文补足，
// 保住手写摘要的 CTR 又满足长度下限。极短（<20）视为无摘要，直接用正文。
export function buildPostDescription(post: WPPost): string {
  const TARGET_MAX = 160;
  const MIN_LENGTH = 110;
  const EXCERPT_MIN_USABLE = 20;
  const excerpt = stripHtml(post.excerpt?.rendered ?? '');
  const body = stripHtml(post.content?.rendered ?? '');

  if (excerpt.length >= MIN_LENGTH) {
    return excerpt.slice(0, TARGET_MAX);
  }
  // 无摘要 / 极短摘要 / WP 自动摘要（即正文开头）：直接用正文，避免开头重复
  if (excerpt.length < EXCERPT_MIN_USABLE || body.startsWith(excerpt.slice(0, EXCERPT_MIN_USABLE))) {
    return body.slice(0, TARGET_MAX) || excerpt;
  }
  const glue = /[。.!?！？…]$/.test(excerpt) ? '' : '。';
  return `${excerpt}${glue}${body}`.slice(0, TARGET_MAX);
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
