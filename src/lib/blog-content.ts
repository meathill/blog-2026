import 'server-only';

import type { PartialBlock } from '@blocknote/core';
import { ServerBlockNoteEditor } from '@blocknote/server-util';
import { parseBlogBlocksJson } from '@/lib/blog-blocks';
import { hasMeaningfulBlogBlocks } from '@/lib/blog-post';

const serverEditor = ServerBlockNoteEditor.create();

export interface BlogContentSnapshot {
  blocks: PartialBlock[];
  blocksJson: string;
  markdown: string;
  html: string;
}

export async function buildBlogContentSnapshot(value: string | null | undefined): Promise<BlogContentSnapshot> {
  const blocks = parseBlogBlocksJson(value);
  if (blocks.length === 0 || !hasMeaningfulBlogBlocks(blocks)) {
    throw new Error('正文内容不能为空。');
  }

  const [html, markdown] = await Promise.all([
    serverEditor.blocksToHTMLLossy(blocks),
    serverEditor.blocksToMarkdownLossy(blocks),
  ]);

  return {
    blocks,
    blocksJson: JSON.stringify(blocks),
    markdown,
    html,
  };
}
