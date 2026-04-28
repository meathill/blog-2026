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
  strike?: true;
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

type CellAlignment = 'left' | 'center' | 'right';

interface TableCellNode {
  type: 'tableCell';
  props: {
    backgroundColor: string;
    textColor: string;
    textAlignment: CellAlignment;
    colspan: number;
    rowspan: number;
  };
  content: InlineContent[];
}

interface TableContent {
  type: 'tableContent';
  columnWidths: (number | undefined)[];
  headerRows?: number;
  headerCols?: number;
  rows: Array<{ cells: TableCellNode[] }>;
}

type BlockProps = Record<string, string | number | boolean>;

interface BaseBlock {
  id: string;
  type: string;
  props: BlockProps;
  content?: InlineContent[] | TableContent;
  children: BaseBlock[];
}

const PARAGRAPH_PROPS: BlockProps = {
  textColor: 'default',
  backgroundColor: 'default',
  textAlignment: 'left',
};

function makeBlock(
  type: string,
  content: InlineContent[] | TableContent | undefined,
  props: BlockProps = PARAGRAPH_PROPS,
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
      const level = Math.min(Math.max(t.depth, 1), 6);
      return [
        makeBlock('heading', inlineFromTokens(t.tokens || []), {
          ...PARAGRAPH_PROPS,
          level,
        }),
      ];
    }
    case 'paragraph': {
      const t = token as Tokens.Paragraph;
      const tokens = t.tokens || [];
      if (tokens.length === 1 && tokens[0].type === 'image') {
        const img = tokens[0] as Tokens.Image;
        return [
          makeBlock('image', undefined, {
            backgroundColor: 'default',
            textAlignment: 'left',
            url: img.href || '',
            name: img.text || '',
            caption: img.title || '',
            showPreview: true,
          }),
        ];
      }
      return [makeBlock('paragraph', inlineFromTokens(tokens))];
    }
    case 'code': {
      const t = token as Tokens.Code;
      return [makeBlock('codeBlock', [{ type: 'text', text: t.text, styles: {} }], { language: t.lang || 'text' })];
    }
    case 'blockquote': {
      const t = token as Tokens.Blockquote;
      const childTokens = t.tokens || [];
      let content: InlineContent[] = [];
      const children: BaseBlock[] = [];
      let consumedFirst = false;
      for (const child of childTokens) {
        if (!consumedFirst && child.type === 'paragraph') {
          const p = child as Tokens.Paragraph;
          content = inlineFromTokens(p.tokens || []);
          consumedFirst = true;
          continue;
        }
        pushBlocks(children, tokenToBlocks(child));
      }
      return [makeBlock('quote', content, { textColor: 'default', backgroundColor: 'default' }, children)];
    }
    case 'list': {
      const t = token as Tokens.List;
      const out: BaseBlock[] = [];
      for (const item of t.items) {
        const isTask = item.task === true;
        const itemType = isTask ? 'checkListItem' : t.ordered ? 'numberedListItem' : 'bulletListItem';
        const props: BlockProps = isTask ? { ...PARAGRAPH_PROPS, checked: item.checked === true } : PARAGRAPH_PROPS;

        const itemTokens = item.tokens || [];
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
        out.push(makeBlock(itemType, content, props, children));
      }
      return out;
    }
    case 'hr':
      return [makeBlock('divider', undefined, {})];
    case 'table': {
      const t = token as Tokens.Table;
      const numCols = Math.max(t.header.length, ...t.rows.map((r) => r.length), 1);
      const align = t.align || [];

      function cellAlignment(col: number): CellAlignment {
        const a = align[col];
        return a === 'center' || a === 'right' ? a : 'left';
      }
      function buildCells(cells: Tokens.TableCell[]): TableCellNode[] {
        const out: TableCellNode[] = [];
        for (let col = 0; col < numCols; col++) {
          const cell = cells[col];
          out.push({
            type: 'tableCell',
            props: {
              backgroundColor: 'default',
              textColor: 'default',
              textAlignment: cellAlignment(col),
              colspan: 1,
              rowspan: 1,
            },
            content: cell ? inlineFromTokens(cell.tokens || []) : [],
          });
        }
        return out;
      }

      const rows: Array<{ cells: TableCellNode[] }> = [
        { cells: buildCells(t.header) },
        ...t.rows.map((row) => ({ cells: buildCells(row) })),
      ];

      return [
        {
          id: crypto.randomUUID(),
          type: 'table',
          props: { textColor: 'default' },
          content: {
            type: 'tableContent',
            columnWidths: Array.from({ length: numCols }, () => undefined),
            headerRows: 1,
            rows,
          },
          children: [],
        },
      ];
    }
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
      out.push({
        type: 'link',
        href: t.href,
        content: textNodes.length > 0 ? textNodes : [{ type: 'text', text: t.text, styles }],
      });
      return;
    }
    case 'br': {
      out.push({ type: 'text', text: '\n', styles });
      return;
    }
    case 'del': {
      const t = token as Tokens.Del;
      const next = { ...styles, strike: true as const };
      for (const sub of t.tokens || []) walkInline(sub, next, out);
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
    if (prev && prev.type === 'text' && n.type === 'text' && JSON.stringify(prev.styles) === JSON.stringify(n.styles)) {
      prev.text += n.text;
    } else {
      out.push(n);
    }
  }
  return out;
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
