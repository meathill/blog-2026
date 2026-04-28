import { describe, it, expect, vi } from 'vitest';
import { buildDraftContentFromMarkdown } from '../../src/lib/mcp/blog-draft';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

interface InlineText {
  type: 'text';
  text: string;
  styles: Record<string, true>;
}
interface InlineLink {
  type: 'link';
  href: string;
  content: InlineText[];
}
type Inline = InlineText | InlineLink;

interface TableCell {
  type: 'tableCell';
  props: { textAlignment: string; colspan: number; rowspan: number; [key: string]: unknown };
  content: Inline[];
}
interface TableContent {
  type: 'tableContent';
  columnWidths: (number | undefined)[];
  headerRows?: number;
  rows: { cells: TableCell[] }[];
}

interface Block {
  id: string;
  type: string;
  props: Record<string, string | number | boolean>;
  content?: Inline[] | TableContent;
  children: Block[];
}

async function blocksOf(md: string): Promise<Block[]> {
  const draft = await buildDraftContentFromMarkdown(md);
  return JSON.parse(draft.blocksJson) as Block[];
}

describe('blog-draft markdownToBlocks', () => {
  describe('table', () => {
    it('builds table block with header row + body rows', async () => {
      const md = '| A | B | C |\n| - | - | - |\n| 1 | 2 | 3 |\n| 4 | 5 | 6 |\n';
      const blocks = await blocksOf(md);
      expect(blocks).toHaveLength(1);
      const block = blocks[0];
      expect(block.type).toBe('table');
      const tc = block.content as TableContent;
      expect(tc.type).toBe('tableContent');
      expect(tc.columnWidths).toHaveLength(3);
      expect(tc.headerRows).toBe(1);
      expect(tc.rows).toHaveLength(3);
      expect(tc.rows[0].cells.map((c) => (c.content[0] as InlineText).text)).toEqual(['A', 'B', 'C']);
      expect(tc.rows[1].cells.map((c) => (c.content[0] as InlineText).text)).toEqual(['1', '2', '3']);
      expect(tc.rows[2].cells.map((c) => (c.content[0] as InlineText).text)).toEqual(['4', '5', '6']);
    });

    it('honors column alignment markers', async () => {
      const md = '| L | C | R |\n| :-- | :-: | --: |\n| 1 | 2 | 3 |\n';
      const blocks = await blocksOf(md);
      const tc = blocks[0].content as TableContent;
      const aligns = tc.rows[0].cells.map((c) => c.props.textAlignment);
      expect(aligns).toEqual(['left', 'center', 'right']);
      // Body row inherits alignment
      const bodyAligns = tc.rows[1].cells.map((c) => c.props.textAlignment);
      expect(bodyAligns).toEqual(['left', 'center', 'right']);
    });

    it('preserves inline formatting inside cells', async () => {
      const md = '| **bold** | [link](https://x) |\n| - | - |\n| `code` | ~~del~~ |\n';
      const blocks = await blocksOf(md);
      const tc = blocks[0].content as TableContent;
      // Header
      const headerFirst = tc.rows[0].cells[0].content[0] as InlineText;
      expect(headerFirst.styles.bold).toBe(true);
      const headerSecond = tc.rows[0].cells[1].content[0];
      expect(headerSecond.type).toBe('link');
      expect((headerSecond as InlineLink).href).toBe('https://x');
      // Body
      const bodyFirst = tc.rows[1].cells[0].content[0] as InlineText;
      expect(bodyFirst.styles.code).toBe(true);
      const bodySecond = tc.rows[1].cells[1].content[0] as InlineText;
      expect(bodySecond.styles.strike).toBe(true);
    });
  });

  describe('task list', () => {
    it('emits checkListItem with checked flag', async () => {
      const md = '- [x] done\n- [ ] todo\n';
      const blocks = await blocksOf(md);
      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe('checkListItem');
      expect(blocks[0].props.checked).toBe(true);
      expect(blocks[1].type).toBe('checkListItem');
      expect(blocks[1].props.checked).toBe(false);
      // Strips checkbox prefix from content
      expect(((blocks[0].content as Inline[])[0] as InlineText).text).toBe('done');
      expect(((blocks[1].content as Inline[])[0] as InlineText).text).toBe('todo');
    });

    it('keeps regular bullets when not a task list', async () => {
      const blocks = await blocksOf('- a\n- b\n');
      expect(blocks.map((b) => b.type)).toEqual(['bulletListItem', 'bulletListItem']);
      expect(blocks[0].props.checked).toBeUndefined();
    });
  });

  describe('strikethrough', () => {
    it('applies strike style', async () => {
      const blocks = await blocksOf('hello ~~world~~ end');
      expect(blocks).toHaveLength(1);
      const inline = blocks[0].content as Inline[];
      const struck = inline.find((n) => n.type === 'text' && n.text === 'world') as InlineText | undefined;
      expect(struck).toBeDefined();
      expect(struck!.styles.strike).toBe(true);
    });
  });

  describe('blockquote', () => {
    it('emits a quote block for single-paragraph blockquote', async () => {
      const blocks = await blocksOf('> hello quote\n');
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('quote');
      expect(blocks[0].children).toHaveLength(0);
      expect(((blocks[0].content as Inline[])[0] as InlineText).text).toBe('hello quote');
    });

    it('puts extra blocks into quote.children', async () => {
      const md = '> first paragraph\n>\n> - item one\n> - item two\n';
      const blocks = await blocksOf(md);
      expect(blocks).toHaveLength(1);
      const q = blocks[0];
      expect(q.type).toBe('quote');
      // first paragraph as inline content
      const inline = q.content as Inline[];
      expect((inline[0] as InlineText).text).toBe('first paragraph');
      // children contain bullet list items
      expect(q.children.length).toBeGreaterThanOrEqual(2);
      expect(q.children.every((c) => c.type === 'bulletListItem')).toBe(true);
    });
  });

  describe('divider', () => {
    it('emits a divider block for ---', async () => {
      const blocks = await blocksOf('before\n\n---\n\nafter\n');
      const types = blocks.map((b) => b.type);
      expect(types).toEqual(['paragraph', 'divider', 'paragraph']);
      expect(blocks[1].content).toBeUndefined();
    });
  });

  describe('heading depth', () => {
    it('preserves levels 4-6 instead of clamping to 3', async () => {
      const md = '# h1\n## h2\n### h3\n#### h4\n##### h5\n###### h6\n';
      const blocks = await blocksOf(md);
      expect(blocks.map((b) => b.props.level)).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('image block', () => {
    it('promotes a lone-image paragraph to an image block', async () => {
      const md = '![alt text](https://example.com/x.png "cap")';
      const blocks = await blocksOf(md);
      expect(blocks).toHaveLength(1);
      const b = blocks[0];
      expect(b.type).toBe('image');
      expect(b.props.url).toBe('https://example.com/x.png');
      expect(b.props.name).toBe('alt text');
      expect(b.props.caption).toBe('cap');
      expect(b.content).toBeUndefined();
    });

    it('keeps mixed-image paragraphs as paragraph', async () => {
      const md = 'pre ![a](https://x/y.png) post';
      const blocks = await blocksOf(md);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('paragraph');
    });
  });

  describe('basics & regression', () => {
    it('returns one empty paragraph for empty input', async () => {
      const blocks = await blocksOf('');
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('paragraph');
      expect(blocks[0].content).toEqual([]);
    });

    it('still produces html through marked.parse', async () => {
      const draft = await buildDraftContentFromMarkdown('# title\n\n| a | b |\n| - | - |\n| 1 | 2 |\n');
      expect(draft.html).toContain('<h1');
      expect(draft.html).toContain('<table');
    });
  });
});
