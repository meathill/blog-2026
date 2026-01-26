import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { marked } from 'marked';

export interface NotionPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  tags: string[];
  categories: string[];
  date?: string;
  content: string;
  lastEditedTime: string; // ISO String
  coverImage?: string | null;
}

export function getNotionClient(env: CloudflareEnv) {
  const client = new Client({
    auth: env.NOTION_API_KEY,
    fetch: fetch,
  });
  console.log('[Notion] Client created:', !!client);

  const n2m = new NotionToMarkdown({ notionClient: client });
  return { client, n2m };
}

export async function fetchReadyPosts(env: CloudflareEnv): Promise<NotionPost[]> {
  const { n2m } = await getNotionClient(env);

  if (!env.NOTION_DATABASE_ID) {
    throw new Error('NOTION_DATABASE_ID is missing');
  }

  const dbId = env.NOTION_DATABASE_ID;
  console.log('[Notion] Querying Database:', dbId);

  const url = `https://api.notion.com/v1/databases/${dbId}/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: {
        or: [
          { property: 'Status', status: { equals: 'Ready' } },
          { property: 'Status', status: { equals: 'Published' } },
        ],
      },
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
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

    const props = page.properties;

    const lastEditedTime = page.last_edited_time;
    const lastPublished = props['published_at']?.date?.start;
    const status = props.Status?.status?.name;

    let coverImage = null;
    const thumbnailProp = props.Thumbnail;
    if (thumbnailProp) {
      if (thumbnailProp.type === 'files' && thumbnailProp.files.length > 0) {
        coverImage = thumbnailProp.files[0].file?.url || thumbnailProp.files[0].external?.url;
      }
    }
    if (!coverImage && page.cover) {
      if (page.cover.type === 'external') {
        coverImage = page.cover.external.url;
      } else if (page.cover.type === 'file') {
        coverImage = page.cover.file.url;
      }
    }

    if (status === 'Published') {
      if (lastPublished) {
        const edited = new Date(lastEditedTime).getTime();
        const published = new Date(lastPublished).getTime();
        if (edited <= published + 60000) {
          continue;
        }
        console.log(`[Notion] Post "${page.id}" Modified (${lastEditedTime}) > Published (${lastPublished}). Syncing.`);
      }
    }

    const titleProp = props['Doc name'] || props.Name || props.Title || props.title;
    const title = titleProp?.title?.[0]?.plain_text || 'Untitled';
    const slug = props.Slug?.rich_text?.[0]?.plain_text || '';
    const tags = props.Tags?.multi_select?.map((t: any) => t.name) || [];

    const categories: string[] = [];
    const catProp = props['Category'] || props.Categories;
    if (catProp?.type === 'multi_select') {
      categories.push(...catProp.multi_select.map((c: any) => c.name));
    } else if (catProp?.type === 'select' && catProp.select) {
      categories.push(catProp.select.name);
    }

    const date = props['published_at']?.date?.start || props.Date?.date?.start || new Date().toISOString();

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
      lastEditedTime,
      coverImage,
    });
  }

  return posts;
}

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
      published_at: {
        date: {
          start: new Date().toISOString(),
        },
      },
    },
  });
}
