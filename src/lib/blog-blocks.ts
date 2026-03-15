import type { PartialBlock } from '@blocknote/core';
import { DEFAULT_BLOG_BLOCKS } from '@/lib/blog-post';

export function parseBlogBlocksJson(value: string | null | undefined): PartialBlock[] {
  if (!value || value.trim().length === 0) {
    throw new Error('正文内容不能为空。');
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error('正文内容格式无效。');
    }

    return parsed as PartialBlock[];
  } catch (error) {
    if (error instanceof Error && error.message === '正文内容格式无效。') {
      throw error;
    }

    throw new Error('正文内容不是合法的 Block JSON。');
  }
}

export function getInitialBlogBlocks(value: string | null | undefined): PartialBlock[] {
  if (!value || value.trim().length === 0) {
    return DEFAULT_BLOG_BLOCKS;
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_BLOG_BLOCKS;
    }

    return parsed as PartialBlock[];
  } catch {
    return DEFAULT_BLOG_BLOCKS;
  }
}
