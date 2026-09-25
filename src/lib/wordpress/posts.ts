import { cache } from 'react';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { wpFetch, getAccessHeaders, getBasicAuthHeader } from './client';
import { WPPost } from './types';

// Issue #13：线上 WP 的 found_posts 失真——X-WP-Total 恒等于「本页返回条数」、X-WP-TotalPages 恒为 1，
// 导致 `page>=2` 被 WP 以 rest_post_invalid_page_number（400）拒绝，列表分页、sitemap 全部截断在第一页。
// 对策：
// 1. 翻页一律用 `offset`（此时 WP 内部 paged=1，不会触发页码越界校验），数据本身总能取到；
// 2. 仅当「本页满载且 header 声称后面没有了」时才不信 header，用 `_fields=id` 从本页之后往下数出真实总数。
//    WP 恢复正常后 header 可信，该分支不会触发。
const COUNT_SCAN_PAGE_SIZE = 100;
const COUNT_SCAN_MAX_REQUESTS = 50;

type PostsFilter = {
  categories?: number[];
  tags?: number[];
  author?: number;
  search?: string;
  slug?: string[];
};

function applyFilter(searchParams: URLSearchParams, filter: PostsFilter) {
  if (filter.slug?.length) {
    searchParams.set('slug', filter.slug.join(','));
  }
  if (filter.categories?.length) {
    searchParams.set('categories', filter.categories.join(','));
  }
  if (filter.tags?.length) {
    searchParams.set('tags', filter.tags.join(','));
  }
  if (filter.author) {
    searchParams.set('author', String(filter.author));
  }
  if (filter.search) {
    searchParams.set('search', filter.search);
  }
}

async function countPostsFrom(
  apiUrl: string,
  headers: HeadersInit,
  filter: PostsFilter,
  startOffset: number,
): Promise<number> {
  let offset = startOffset;
  for (let i = 0; i < COUNT_SCAN_MAX_REQUESTS; i++) {
    const searchParams = new URLSearchParams();
    searchParams.set('_fields', 'id');
    applyFilter(searchParams, filter);
    searchParams.set('per_page', String(COUNT_SCAN_PAGE_SIZE));
    searchParams.set('offset', String(offset));
    const response = await fetch(`${apiUrl}/posts?${searchParams}`, {
      headers,
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      break;
    }
    const ids: unknown[] = await response.json();
    offset += ids.length;
    if (ids.length < COUNT_SCAN_PAGE_SIZE) {
      break;
    }
  }
  return offset;
}

export const getPosts = cache(
  async (
    params?: PostsFilter & {
      page?: number;
      perPage?: number;
      embed?: boolean;
      fields?: string[];
    },
  ): Promise<{ posts: WPPost[]; total: number; totalPages: number }> => {
    // 显式传入空数组即视为白名单为空，直接返回空结果，不发请求
    if (params?.slug && params.slug.length === 0) {
      return { posts: [], total: 0, totalPages: 0 };
    }

    const searchParams = new URLSearchParams();
    const { embed = true, fields } = params || {};
    const filter: PostsFilter = {
      categories: params?.categories,
      tags: params?.tags,
      author: params?.author,
      search: params?.search,
      slug: params?.slug,
    };

    if (embed) {
      searchParams.set('_embed', 'true');
    }
    if (fields && fields.length > 0) {
      searchParams.set('_fields', fields.join(','));
    }
    // 未显式传 perPage 时，按 slug 数量拉取（上限 100，WP per_page 最大值），避免默认分页截断白名单
    const defaultPerPage = params?.slug?.length ? Math.min(params.slug.length, 100) : 10;
    const perPage = params?.perPage || defaultPerPage;
    const page = params?.page && params.page > 1 ? params.page : 1;
    const offset = (page - 1) * perPage;
    applyFilter(searchParams, filter);
    searchParams.set('per_page', String(perPage));
    if (offset > 0) {
      searchParams.set('offset', String(offset));
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
        return { posts: [], total: 0, totalPages: 0 };
      }
      const text = await response.text();
      console.error('[WP API] Error Body:', text);
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const posts: WPPost[] = await response.json();
    let total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    const loaded = offset + posts.length;

    if (posts.length > 0 && posts.length < perPage) {
      // 未满载即最后一页，总数可精确得出
      total = loaded;
    } else if (posts.length === perPage && total <= loaded) {
      // 满载但 header 声称没有更多：header 不可信，往后数
      total = await countPostsFrom(env.WORDPRESS_API_URL, headers, filter, loaded);
    }

    return { posts, total, totalPages: total > 0 ? Math.ceil(total / perPage) : 0 };
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
  async (categoryId: number, page = 1, perPage = 20): Promise<{ posts: WPPost[]; total: number; totalPages: number }> =>
    getPosts({ categories: [categoryId], page, perPage }),
);

export const getPostsByTag = cache(
  async (tagId: number, page = 1, perPage = 20): Promise<{ posts: WPPost[]; total: number; totalPages: number }> =>
    getPosts({ tags: [tagId], page, perPage }),
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
