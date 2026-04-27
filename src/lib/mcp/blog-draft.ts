import { marked, type Tokens } from 'marked';
import { revalidatePath } from 'next/cache';

export interface DraftContent {
  blocksJson: string;
  markdown: string;
  html: string;
}

export async function buildDraftContentFromMarkdown(markdown: string): Promise<DraftContent> {
  const trimmed = markdown ?? '';
  const html = trimmed ? await marked.parse(trimmed, { async: true }) : '';
  const blocks = markdownToBlocks(trimmed);
  return {
    blocksJson: JSON.stringify(blocks),
    markdown: trimmed,
    html,
  };
}

interface InlineStyle {
  bold?: true;
  italic?: true;
  code?: true;
}

interface TextNode {
  type: 'text';
  text: string;
  styles: InlineStyle;
}

interface LinkNode {
  type: 'link';
  href: string;
  content: TextNode[];
}

type InlineContent = TextNode | LinkNode;

interface BaseBlock {
  id: string;
  type: string;
  props: Record<string, string | number>;
  content: InlineContent[];
  children: BaseBlock[];
}

const PARAGRAPH_PROPS = {
  textColor: 'default',
  backgroundColor: 'default',
  textAlignment: 'left',
};

function makeBlock(
  type: string,
  content: InlineContent[],
  props: Record<string, string | number> = PARAGRAPH_PROPS,
  children: BaseBlock[] = [],
): BaseBlock {
  return { id: crypto.randomUUID(), type, props, content, children };
}

function emptyParagraph(): BaseBlock {
  return makeBlock('paragraph', []);
}

function markdownToBlocks(markdown: string): BaseBlock[] {
  if (!markdown.trim()) return [emptyParagraph()];
  const tokens = marked.lexer(markdown);
  const blocks: BaseBlock[] = [];
  for (const token of tokens) {
    pushBlocks(blocks, tokenToBlocks(token));
  }
  return blocks.length > 0 ? blocks : [emptyParagraph()];
}

function pushBlocks(target: BaseBlock[], next: BaseBlock[]) {
  for (const b of next) target.push(b);
}

function tokenToBlocks(token: Tokens.Generic): BaseBlock[] {
  switch (token.type) {
    case 'heading': {
      const t = token as Tokens.Heading;
      const level = Math.min(Math.max(t.depth, 1), 3);
      return [
        makeBlock('heading', inlineFromTokens(t.tokens || []), {
          ...PARAGRAPH_PROPS,
          level,
        }),
      ];
    }
    case 'paragraph': {
      const t = token as Tokens.Paragraph;
      return [makeBlock('paragraph', inlineFromTokens(t.tokens || []))];
    }
    case 'code': {
      const t = token as Tokens.Code;
      return [
        makeBlock(
          'codeBlock',
          [{ type: 'text', text: t.text, styles: {} }],
          { language: t.lang || 'text' },
        ),
      ];
    }
    case 'blockquote': {
      const t = token as Tokens.Blockquote;
      const inner: BaseBlock[] = [];
      for (const child of t.tokens || []) pushBlocks(inner, tokenToBlocks(child));
      // BlockNote's default schema doesn't ship a blockquote block; render as
      // italic paragraphs so the visual cue survives.
      return inner.map((b) =>
        b.type === 'paragraph'
          ? { ...b, content: applyStyle(b.content, { italic: true }) }
          : b,
      );
    }
    case 'list': {
      const t = token as Tokens.List;
      const itemType = t.ordered ? 'numberedListItem' : 'bulletListItem';
      const out: BaseBlock[] = [];
      for (const item of t.items) {
        const itemTokens = item.tokens || [];
        // First inline-ish token becomes the item content; nested blocks become children.
        let content: InlineContent[] = [];
        const children: BaseBlock[] = [];
        let consumedFirstText = false;
        for (const child of itemTokens) {
          if (!consumedFirstText && (child.type === 'text' || child.type === 'paragraph')) {
            const sub = (child as Tokens.Text | Tokens.Paragraph).tokens || [];
            content = inlineFromTokens(sub);
            consumedFirstText = true;
            continue;
          }
          pushBlocks(children, tokenToBlocks(child));
        }
        if (!consumedFirstText && itemTokens.length === 0) {
          content = [{ type: 'text', text: item.text, styles: {} }];
        }
        out.push(makeBlock(itemType, content, PARAGRAPH_PROPS, children));
      }
      return out;
    }
    case 'hr':
      return [emptyParagraph()];
    case 'space':
      return [];
    case 'html': {
      const t = token as Tokens.HTML;
      const text = (t.text || '').trim();
      if (!text) return [];
      return [makeBlock('paragraph', [{ type: 'text', text, styles: {} }])];
    }
    default: {
      const raw = (token as { raw?: string }).raw || '';
      const text = raw.trim();
      if (!text) return [];
      return [makeBlock('paragraph', [{ type: 'text', text, styles: {} }])];
    }
  }
}

function inlineFromTokens(tokens: Tokens.Generic[]): InlineContent[] {
  const out: InlineContent[] = [];
  for (const t of tokens) walkInline(t, {}, out);
  return mergeAdjacentText(out);
}

function walkInline(token: Tokens.Generic, styles: InlineStyle, out: InlineContent[]) {
  switch (token.type) {
    case 'text': {
      const t = token as Tokens.Text;
      if (t.tokens && t.tokens.length > 0) {
        for (const sub of t.tokens) walkInline(sub, styles, out);
      } else {
        out.push({ type: 'text', text: decodeEntities(t.text), styles });
      }
      return;
    }
    case 'strong': {
      const t = token as Tokens.Strong;
      const next = { ...styles, bold: true as const };
      for (const sub of t.tokens || []) walkInline(sub, next, out);
      return;
    }
    case 'em': {
      const t = token as Tokens.Em;
      const next = { ...styles, italic: true as const };
      for (const sub of t.tokens || []) walkInline(sub, next, out);
      return;
    }
    case 'codespan': {
      const t = token as Tokens.Codespan;
      out.push({ type: 'text', text: decodeEntities(t.text), styles: { ...styles, code: true } });
      return;
    }
    case 'link': {
      const t = token as Tokens.Link;
      const inner: InlineContent[] = [];
      for (const sub of t.tokens || []) walkInline(sub, styles, inner);
      const textNodes = inner.filter((n): n is TextNode => n.type === 'text');
      out.push({ type: 'link', href: t.href, content: textNodes.length > 0 ? textNodes : [{ type: 'text', text: t.text, styles }] });
      return;
    }
    case 'br': {
      out.push({ type: 'text', text: '\n', styles });
      return;
    }
    case 'del': {
      const t = token as Tokens.Del;
      for (const sub of t.tokens || []) walkInline(sub, styles, out);
      return;
    }
    case 'image': {
      const t = token as Tokens.Image;
      out.push({ type: 'text', text: t.text || t.href, styles });
      return;
    }
    case 'html': {
      const t = token as Tokens.HTML;
      out.push({ type: 'text', text: decodeEntities(t.text), styles });
      return;
    }
    default: {
      const raw = (token as { raw?: string; text?: string }).text || (token as { raw?: string }).raw || '';
      if (raw) out.push({ type: 'text', text: decodeEntities(raw), styles });
    }
  }
}

function mergeAdjacentText(nodes: InlineContent[]): InlineContent[] {
  const out: InlineContent[] = [];
  for (const n of nodes) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.type === 'text' &&
      n.type === 'text' &&
      JSON.stringify(prev.styles) === JSON.stringify(n.styles)
    ) {
      prev.text += n.text;
    } else {
      out.push(n);
    }
  }
  return out;
}

function applyStyle(content: InlineContent[], extra: InlineStyle): InlineContent[] {
  return content.map((n) =>
    n.type === 'text'
      ? { ...n, styles: { ...n.styles, ...extra } }
      : { ...n, content: n.content.map((tn) => ({ ...tn, styles: { ...tn.styles, ...extra } })) },
  );
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function revalidateBlogAdminPaths(id?: string) {
  revalidatePath('/admin/blog');
  revalidatePath('/admin/blog/new');
  if (id) revalidatePath(`/admin/blog/${id}`);
}
