import { type HTMLElement, type Node, NodeType, parse } from 'node-html-parser';

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

export function htmlToMarkdown(html: string): string {
  if (!html?.trim()) {
    return '';
  }

  const root = parse(html);
  const markdown = blocksToMarkdown(root.childNodes);
  return markdown ? `${markdown}\n` : '';
}

function blocksToMarkdown(nodes: Node[]): string {
  return nodes
    .map(nodeToMarkdown)
    .filter((block) => block.length > 0)
    .join('\n\n');
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === NodeType.TEXT_NODE) {
    return escapeMarkdownText(node.text.trim());
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) {
    return ''; // 注释节点等，忽略
  }

  const el = node as HTMLElement;
  if (HEADING_TAGS.has(el.tagName)) {
    const level = Number(el.tagName[1]);
    return `${'#'.repeat(level)} ${inline(el).trim()}`;
  }

  switch (el.tagName) {
    case 'P':
      return inline(el).trim();
    case 'FIGURE': {
      const img = el.querySelector('img');
      if (img) {
        return imageToMarkdown(img, el.querySelector('figcaption'));
      }
      return blocksToMarkdown(el.childNodes);
    }
    case 'IMG':
      return imageToMarkdown(el);
    case 'BLOCKQUOTE': {
      const inner = blocksToMarkdown(el.childNodes);
      return inner
        .split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n');
    }
    case 'PRE': {
      // <pre> 是 node-html-parser 的 block text element，内容默认不会被解析成子节点，
      // el.text 拿到的是原始未解析文本（其中的 <code> 标签只是字面字符）——重新 parse 一遍才能拿到真正的 <code> 元素。
      const inner = parse(el.text);
      const code = inner.querySelector('code');
      const lang = extractLang(code?.getAttribute('class') ?? el.getAttribute('class'));
      const text = code ? code.text : el.text;
      return `\`\`\`${lang}\n${text}\n\`\`\``;
    }
    case 'UL':
      return listToMarkdown(el, false);
    case 'OL':
      return listToMarkdown(el, true);
    case 'HR':
      return '---';
    case 'TABLE':
      return tableToMarkdown(el);
    case 'IFRAME': {
      // WordPress 把 [embed]/oEmbed 短代码展开成 iframe（视频、推文嵌入等），没有文本内容，
      // 如果落进下面的默认分支会静默丢失，单独处理成一个链接而不是让它无声消失。
      const src = el.getAttribute('src');
      return src ? `[嵌入内容](${src})` : '';
    }
    case 'SCRIPT':
    case 'STYLE':
      return '';
    default:
      // 未知包装标签（WordPress 的 wp-block-* 容器 div、短代码残留等）：原样展开子节点，
      // 不追求完美还原，这是预期内的已知限制。
      return el.childNodes.length > 0 ? blocksToMarkdown(el.childNodes) : '';
  }
}

function inline(el: HTMLElement): string {
  return el.childNodes.map(inlineNode).join('');
}

function inlineNode(node: Node): string {
  if (node.nodeType === NodeType.TEXT_NODE) {
    return escapeMarkdownText(node.text);
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) {
    return '';
  }

  const el = node as HTMLElement;
  switch (el.tagName) {
    case 'STRONG':
    case 'B':
      return `**${inline(el)}**`;
    case 'EM':
    case 'I':
      return `*${inline(el)}*`;
    case 'CODE':
      return `\`${el.text}\``;
    case 'DEL':
    case 'S':
    case 'STRIKE':
      return `~~${inline(el)}~~`;
    case 'A': {
      const href = el.getAttribute('href') ?? '';
      const text = inline(el);
      return href ? `[${text}](${href})` : text;
    }
    case 'BR':
      return '\n';
    case 'IMG':
      return imageToMarkdown(el);
    default:
      return inline(el);
  }
}

function imageToMarkdown(img: HTMLElement, figcaption?: HTMLElement | null): string {
  const src = img.getAttribute('src') ?? '';
  const alt = img.getAttribute('alt') ?? '';
  const caption = figcaption?.text.trim();

  return caption ? `![${alt}](${src} "${caption}")` : `![${alt}](${src})`;
}

function extractLang(classAttr: string | undefined): string {
  const match = classAttr?.match(/language-(\S+)/);
  return match?.[1] ?? '';
}

function listToMarkdown(list: HTMLElement, ordered: boolean): string {
  const items = list.children.filter((child) => child.tagName === 'LI');

  return items
    .map((item, index) => {
      const marker = ordered ? `${index + 1}.` : '-';
      const nestedLists = item.children.filter((child) => child.tagName === 'UL' || child.tagName === 'OL');
      const nestedMarkdown = nestedLists
        .map((nested) => listToMarkdown(nested, nested.tagName === 'OL'))
        .join('\n')
        .split('\n')
        .filter(Boolean)
        .map((line) => `  ${line}`)
        .join('\n');
      const directContent = inline(item).trim();

      return nestedMarkdown ? `${marker} ${directContent}\n${nestedMarkdown}` : `${marker} ${directContent}`;
    })
    .join('\n');
}

function tableToMarkdown(table: HTMLElement): string {
  const rows = table
    .querySelectorAll('tr')
    .map((row) => row.querySelectorAll('th, td').map((cell) => inline(cell).trim() || ' '));
  if (rows.length === 0) {
    return '';
  }

  const numCols = Math.max(...rows.map((row) => row.length));
  const toLine = (row: string[]) => `| ${Array.from({ length: numCols }, (_, i) => row[i] ?? ' ').join(' | ')} |`;
  const divider = `| ${Array.from({ length: numCols }, () => '---').join(' | ')} |`;

  return [toLine(rows[0]), divider, ...rows.slice(1).map(toLine)].join('\n');
}

function escapeMarkdownText(text: string): string {
  return text.replace(/([\\*_`[\]])/g, '\\$1');
}
