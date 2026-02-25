import type { TocItem } from '@/components/posts/post-toc';

/**
 * 从处理后的 HTML 内容中提取标题生成 TOC
 */
export function extractTOC(html: string, stripHtmlFn: (s: string) => string): TocItem[] {
  const headingRegex = /<h([2-4])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[2-4]>/gi;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    toc.push({
      level: parseInt(match[1], 10),
      id: match[2],
      text: stripHtmlFn(match[3]),
    });
  }

  return toc;
}

/**
 * 检查 HTML 内容是否包含代码块（<pre> 标签）
 */
export function hasCodeBlocks(html: string): boolean {
  return /<pre[\s>]/i.test(html);
}
