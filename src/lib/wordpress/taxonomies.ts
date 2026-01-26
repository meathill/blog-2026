import { wpFetch, getAccessHeaders, getBasicAuthHeader } from './client';
import { WPCategory, WPTag } from './types';

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

export async function getTagBySlug(slug: string): Promise<WPTag | null> {
  const tags = await wpFetch<WPTag[]>(`/tags?slug=${encodeURIComponent(slug)}`);
  return tags[0] || null;
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
