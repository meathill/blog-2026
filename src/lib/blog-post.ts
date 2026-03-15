import type { PartialBlock } from '@blocknote/core';
import slugify from 'slugify';

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogPostRecord {
  id: string;
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
  wpPostId: number | null;
  wpSyncedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPostListItem extends BlogPostRecord {
  needsSyncToWordPress: boolean;
}

export interface BlogPostListResult {
  posts: BlogPostListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const BLOG_SYNC_TOLERANCE_MS = 60_000;
export const DEFAULT_BLOG_BLOCKS: PartialBlock[] = [{ type: 'paragraph', content: '' }];

export function normalizeBlogPostStatus(value: string | null | undefined): BlogPostStatus {
  if (value === 'published' || value === 'archived') {
    return value;
  }

  return 'draft';
}

export function parseStoredStringList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
}

export function parseBlogStringListInput(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  const items = value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(items));
}

export function serializeBlogStringList(items: string[]): string {
  return JSON.stringify(items);
}

export function buildBlogSlug(title: string, input?: string | null): string {
  const source = (input || '').trim() || title.trim();
  const slug = slugify(source.replace(/_+/g, '-'), {
    lower: true,
    strict: true,
    trim: true,
  })
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug) {
    throw new Error('标题无法自动生成 slug，请手动填写 slug。');
  }

  return slug;
}

export function shouldSyncBlogPostToWordPress(
  status: BlogPostStatus,
  updatedAt: Date,
  wpSyncedAt: Date | null,
): boolean {
  if (status !== 'published') {
    return false;
  }

  if (!wpSyncedAt) {
    return true;
  }

  return updatedAt.getTime() > wpSyncedAt.getTime() + BLOG_SYNC_TOLERANCE_MS;
}

export function hasMeaningfulBlogBlocks(blocks: PartialBlock[]): boolean {
  return blocks.some(hasMeaningfulBlogBlock);
}

function hasMeaningfulBlogBlock(block: PartialBlock): boolean {
  if (Array.isArray(block.children) && block.children.some(hasMeaningfulBlogBlock)) {
    return true;
  }

  if (block.type === 'divider' || block.type === 'image' || block.type === 'file' || block.type === 'audio') {
    return true;
  }

  if (typeof block.content === 'string') {
    return block.content.trim().length > 0;
  }

  if (!Array.isArray(block.content)) {
    return false;
  }

  return block.content.some((item) => {
    if (typeof item === 'string') {
      return item.trim().length > 0;
    }

    if (item && typeof item === 'object' && 'text' in item) {
      const text = item.text;
      return typeof text === 'string' && text.trim().length > 0;
    }

    return false;
  });
}
