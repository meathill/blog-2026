import { cache } from 'react';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import slugify from 'slugify';
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
    .replace(/href="https?:\/\/blog\.meathill\.com\/([^"#]+)\.html"/g, 'href="/posts/$1"')
    .replace(/<h([2-4])([^>]*)>(.*?)<\/h[2-4]>/g, (match, level, attrs, content) => {
      // Check if id already exists
      if (attrs.includes('id=')) {
        return match;
      }

      // Generate id from content
      // 1. Remove HTML tags from content
      const text = content.replace(/<[^>]*>/g, '').trim();
      // 2. Generate safe id
      const id = slugify(text, { lower: true, remove: /[^\u4e00-\u9fa5a-zA-Z0-9\s-_]/g });

      return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
    });
}
