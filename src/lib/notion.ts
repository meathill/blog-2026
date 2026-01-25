import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { marked } from 'marked';

export interface NotionPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  tags: string[];
  categories: string[]; // Added
  date?: string;
  content: string; // HTML
}

export function getNotionClient(env: CloudflareEnv) {
  const client = new Client({
    auth: env.NOTION_API_KEY,
    fetch: fetch, // Explicitly use fetch for Cloudflare Workers
  });
  console.log('[Notion] Client created:', !!client, 'Keys:', Object.keys(client));
  if (client.databases) {
    console.log('[Notion] client.databases exists');
  } else {
    console.error('[Notion] client.databases MISSING');
  }

  const n2m = new NotionToMarkdown({ notionClient: client });
  return { client, n2m };
}

/**
 * Fetch "Ready" posts from Notion Database
 */
export async function fetchReadyPosts(env: CloudflareEnv): Promise<NotionPost[]> {
  const { client, n2m } = await getNotionClient(env);

  if (!env.NOTION_DATABASE_ID) {
    throw new Error('NOTION_DATABASE_ID is missing');
  }

  // Format UUID with dashes if needed (Notion API usually expects 8-4-4-4-12)
  const dbId = env.NOTION_DATABASE_ID.replace(
    /^([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{4})([0-9a-f]{12})$/i,
    '$1-$2-$3-$4-$5',
  );
  console.log('[Notion] Querying Database:', dbId);

  // Fallback to native fetch because SDK query method is missing in Cloudflare Workers
  const url = `https://api.notion.com/v1/databases/${dbId}/query`;
  console.log('[Notion] Fetching URL:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: {
        property: 'Status',
        status: {
          equals: 'Ready',
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[Notion] Fetch Error:', response.status, text);
    throw new Error(`Notion API Error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as any;
  const results = data.results || [];

  const posts: NotionPost[] = [];

  for (const page of results) {
    if (!('properties' in page)) continue;

    // Parse Properties
    const props = page.properties;

    // @ts-ignore
    const title = props.Name?.title?.[0]?.plain_text || 'Untitled';
    // @ts-ignore
    const slug = props.Slug?.rich_text?.[0]?.plain_text || '';
    // @ts-ignore
    const tags = props.Tags?.multi_select?.map((t: any) => t.name) || [];
    // @ts-ignore
    // Support Select or Multi-select for Categories
    const categories: string[] = [];
    if (props.Categories?.type === 'multi_select') {
      // @ts-ignore
      categories.push(...props.Categories.multi_select.map((c: any) => c.name));
    } else if (props.Categories?.type === 'select' && props.Categories.select) {
      // @ts-ignore
      categories.push(props.Categories.select.name);
    }

    // @ts-ignore
    const date = props.Date?.date?.start || new Date().toISOString();

    // Convert Content
    const mdBlocks = await n2m.pageToMarkdown(page.id);
    const mdString = n2m.toMarkdownString(mdBlocks);
    const htmlContent = await marked(mdString.parent);

    posts.push({
      id: page.id,
      title,
      slug,
      status: 'Ready',
      tags,
      categories,
      date,
      content: htmlContent,
    });
  }

  return posts;
}

/**
 * Update Notion Page Status (e.g. to "Published")
 */
export async function updateNotionPostStatus(env: CloudflareEnv, pageId: string, status: string) {
  const { client } = await getNotionClient(env);
  await client.pages.update({
    page_id: pageId,
    properties: {
      Status: {
        status: {
          name: status,
        },
      },
    },
  });
}
