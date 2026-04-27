import { marked } from 'marked';
import { revalidatePath } from 'next/cache';

export interface DraftContent {
  blocksJson: string;
  markdown: string;
  html: string;
}

export async function buildDraftContentFromMarkdown(markdown: string): Promise<DraftContent> {
  const trimmed = markdown ?? '';
  const html = trimmed ? await marked.parse(trimmed, { async: true }) : '';
  const blocks = markdownToParagraphBlocks(trimmed);
  return {
    blocksJson: JSON.stringify(blocks),
    markdown: trimmed,
    html,
  };
}

function markdownToParagraphBlocks(markdown: string) {
  const segments = markdown.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  const items = segments.length > 0 ? segments : [''];
  return items.map((text) => ({
    id: crypto.randomUUID(),
    type: 'paragraph',
    props: {
      textColor: 'default',
      backgroundColor: 'default',
      textAlignment: 'left',
    },
    content: text
      ? [{ type: 'text', text, styles: {} }]
      : [],
    children: [],
  }));
}

export function revalidateBlogAdminPaths(id?: string) {
  revalidatePath('/admin/blog');
  revalidatePath('/admin/blog/new');
  if (id) revalidatePath(`/admin/blog/${id}`);
}
