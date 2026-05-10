import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import { blogPosts } from '@/db/schema';
import { getDb } from '@/lib/db';
import {
  type BlogPostListItem,
  type BlogPostListResult,
  type BlogPostRecord,
  type BlogPostStatus,
  parseStoredStringList,
  serializeBlogStringList,
  shouldSyncBlogPostToWordPress,
} from '@/lib/blog-post';

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

export interface SaveBlogPostInput {
  title: string;
  slug: string;
  excerpt: string;
  status: BlogPostStatus;
  coverImage: string | null;
  categories: string[];
  tags: string[];
  blocksJson: string;
  markdown: string;
  html: string;
}

export interface BlogPostPublishState {
  status: BlogPostStatus;
  wpPostId: number;
  wpSyncedAt: Date;
  publishedAt: Date;
}

export async function createBlogPostRecord(input: SaveBlogPostInput): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date();

  await ensureBlogSlugAvailable(input.slug);

  await db.insert(blogPosts).values({
    id,
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    status: input.status,
    coverImage: input.coverImage,
    categories: serializeBlogStringList(input.categories),
    tags: serializeBlogStringList(input.tags),
    blocksJson: input.blocksJson,
    markdown: input.markdown,
    html: input.html,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function updateBlogPostRecord(id: string, input: SaveBlogPostInput): Promise<void> {
  const db = await getDb();

  await ensureBlogPostExists(id);
  await ensureBlogSlugAvailable(input.slug, id);

  await db
    .update(blogPosts)
    .set({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      status: input.status,
      coverImage: input.coverImage,
      categories: serializeBlogStringList(input.categories),
      tags: serializeBlogStringList(input.tags),
      blocksJson: input.blocksJson,
      markdown: input.markdown,
      html: input.html,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));
}

export async function markBlogPostPublished(id: string, state: BlogPostPublishState): Promise<void> {
  const db = await getDb();

  await db
    .update(blogPosts)
    .set({
      status: state.status,
      wpPostId: state.wpPostId,
      wpSyncedAt: state.wpSyncedAt,
      publishedAt: state.publishedAt,
      updatedAt: state.wpSyncedAt,
    })
    .where(eq(blogPosts.id, id));
}

export async function getBlogPostRecord(id: string): Promise<BlogPostRecord | null> {
  const db = await getDb();
  const row = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();

  if (!row) {
    return null;
  }

  return mapBlogPostRecord(row);
}

export async function listBlogPostRecords(options?: { page?: number; pageSize?: number }): Promise<BlogPostListResult> {
  const db = await getDb();
  const pageSize = normalizePageSize(options?.pageSize);
  const requestedPage = normalizePageNumber(options?.page);

  const countRow = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(blogPosts)
    .get();

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select()
    .from(blogPosts)
    .orderBy(asc(sql<number>`case when ${blogPosts.status} = 'draft' then 0 else 1 end`), desc(blogPosts.updatedAt))
    .limit(pageSize)
    .offset(offset);
  const posts: BlogPostListItem[] = rows.map((row) => {
    const post = mapBlogPostRecord(row);

    return {
      ...post,
      needsSyncToWordPress: shouldSyncBlogPostToWordPress(post.status, post.updatedAt, post.wpSyncedAt),
    };
  });

  return {
    posts,
    total,
    page,
    pageSize,
    totalPages,
  };
}

async function ensureBlogSlugAvailable(slug: string, excludeId?: string): Promise<void> {
  const db = await getDb();
  const whereClause = excludeId ? and(eq(blogPosts.slug, slug), ne(blogPosts.id, excludeId)) : eq(blogPosts.slug, slug);
  const existing = await db.select({ id: blogPosts.id }).from(blogPosts).where(whereClause).get();

  if (existing) {
    throw new Error('Slug 已存在，请换一个。');
  }
}

async function ensureBlogPostExists(id: string): Promise<void> {
  const post = await getBlogPostRecord(id);
  if (!post) {
    throw new Error('文章不存在。');
  }
}

function normalizePageNumber(page: number | undefined): number {
  if (!page || Number.isNaN(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function normalizePageSize(pageSize: number | undefined): number {
  if (!pageSize || Number.isNaN(pageSize) || pageSize < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
}

function mapBlogPostRecord(row: typeof blogPosts.$inferSelect): BlogPostRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    status: row.status,
    coverImage: row.coverImage,
    categories: parseStoredStringList(row.categories),
    tags: parseStoredStringList(row.tags),
    blocksJson: row.blocksJson,
    markdown: row.markdown,
    html: row.html,
    wpPostId: row.wpPostId,
    wpSyncedAt: row.wpSyncedAt,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
