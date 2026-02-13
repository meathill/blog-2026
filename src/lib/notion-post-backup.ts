import { notionPostBackups } from '@/db/schema';
import { getDb } from '@/lib/db';
import type { NotionPost } from '@/lib/notion';
import { desc, eq, inArray, sql } from 'drizzle-orm';

const SYNC_TIME_TOLERANCE_MS = 60_000;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export interface NotionBackupPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  tags: string[];
  categories: string[];
  date: string | null;
  content: string;
  coverImage: string | null;
  lastUpdateTime: Date;
  publishedAt: Date | null;
}

export interface NotionBackupPostListItem extends NotionBackupPost {
  needsSyncToWordPress: boolean;
}

export interface NotionBackupPostListResult {
  posts: NotionBackupPostListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function parseDateOrFallback(value: string, fallback: Date): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed;
}

export function shouldSyncToWordPress(lastUpdateTime: Date, publishedAt: Date | null): boolean {
  if (!publishedAt) {
    return true;
  }
  return lastUpdateTime.getTime() > publishedAt.getTime() + SYNC_TIME_TOLERANCE_MS;
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

export async function upsertNotionPostsToBackup(posts: NotionPost[]): Promise<number> {
  if (posts.length === 0) {
    return 0;
  }

  const db = await getDb();
  const now = new Date();
  const existingRows = await db
    .select({
      id: notionPostBackups.id,
      lastUpdateTime: notionPostBackups.lastUpdateTime,
    })
    .from(notionPostBackups)
    .where(
      inArray(
        notionPostBackups.id,
        posts.map((post) => post.id),
      ),
    );
  const existingById = new Map(existingRows.map((row) => [row.id, row.lastUpdateTime]));
  let upsertedCount = 0;

  for (const post of posts) {
    const lastUpdateTime = parseDateOrFallback(post.lastEditedTime, now);
    const existingLastUpdateTime = existingById.get(post.id);

    // 本地备份已经是同版本或更新版本时，跳过写入。
    if (existingLastUpdateTime && existingLastUpdateTime.getTime() >= lastUpdateTime.getTime()) {
      continue;
    }

    await db
      .insert(notionPostBackups)
      .values({
        id: post.id,
        title: post.title,
        slug: post.slug || '',
        status: post.status || 'Ready',
        tags: JSON.stringify(post.tags || []),
        categories: JSON.stringify(post.categories || []),
        date: post.date || null,
        content: post.content || '',
        coverImage: post.coverImage || null,
        lastUpdateTime,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: notionPostBackups.id,
        set: {
          title: post.title,
          slug: post.slug || '',
          status: post.status || 'Ready',
          tags: JSON.stringify(post.tags || []),
          categories: JSON.stringify(post.categories || []),
          date: post.date || null,
          content: post.content || '',
          coverImage: post.coverImage || null,
          lastUpdateTime,
          updatedAt: now,
        },
      });

    upsertedCount += 1;
  }

  return upsertedCount;
}

export async function getBackupPostsPendingSync(): Promise<NotionBackupPost[]> {
  const db = await getDb();
  const rows = await db.select().from(notionPostBackups).orderBy(desc(notionPostBackups.lastUpdateTime));

  return rows
    .filter((row) => shouldSyncToWordPress(row.lastUpdateTime, row.publishedAt))
    .map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      tags: parseJsonArray(row.tags),
      categories: parseJsonArray(row.categories),
      date: row.date,
      content: row.content,
      coverImage: row.coverImage,
      lastUpdateTime: row.lastUpdateTime,
      publishedAt: row.publishedAt,
    }));
}

export async function listBackupPosts(options?: {
  page?: number;
  pageSize?: number;
}): Promise<NotionBackupPostListResult> {
  const db = await getDb();
  const pageSize = normalizePageSize(options?.pageSize);
  const requestedPage = normalizePageNumber(options?.page);

  const countRow = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(notionPostBackups)
    .get();
  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select()
    .from(notionPostBackups)
    .orderBy(desc(notionPostBackups.lastUpdateTime))
    .limit(pageSize)
    .offset(offset);

  const posts: NotionBackupPostListItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    tags: parseJsonArray(row.tags),
    categories: parseJsonArray(row.categories),
    date: row.date,
    content: row.content,
    coverImage: row.coverImage,
    lastUpdateTime: row.lastUpdateTime,
    publishedAt: row.publishedAt,
    needsSyncToWordPress: shouldSyncToWordPress(row.lastUpdateTime, row.publishedAt),
  }));

  return {
    posts,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function markBackupPostPublished(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date();

  await db
    .update(notionPostBackups)
    .set({
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(notionPostBackups.id, id));
}
