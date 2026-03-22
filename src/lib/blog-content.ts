import 'server-only';

import type { PartialBlock } from '@blocknote/core';
import { parseBlogBlocksJson } from '@/lib/blog-blocks';
import { hasMeaningfulBlogBlocks } from '@/lib/blog-post';

export interface BlogContentSnapshot {
  blocks: PartialBlock[];
  blocksJson: string;
  markdown: string;
  html: string;
}

export function buildBlogContentSnapshot(
  blocksJsonValue: string | null | undefined,
  html: string,
  markdown: string,
): BlogContentSnapshot {
  const blocks = parseBlogBlocksJson(blocksJsonValue);
  if (blocks.length === 0 || !hasMeaningfulBlogBlocks(blocks)) {
    throw new Error('正文内容不能为空。');
  }

  return {
    blocks,
    blocksJson: JSON.stringify(blocks),
    markdown,
    html,
  };
}
