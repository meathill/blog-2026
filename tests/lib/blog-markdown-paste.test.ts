import { describe, expect, it } from 'vitest';
import { looksLikeMarkdownDocument } from '@/lib/blog-markdown-paste';

describe('blog-markdown-paste', () => {
  it('应该识别标题和代码块组成的 markdown', () => {
    expect(
      looksLikeMarkdownDocument(`
## 背景

\`\`\`ts
console.log('hello');
\`\`\`
      `),
    ).toBe(true);
  });

  it('应该识别多段纯文本并按 markdown 段落处理', () => {
    expect(
      looksLikeMarkdownDocument(`
第一段文字

第二段文字
      `),
    ).toBe(true);
  });

  it('应该识别列表和引用', () => {
    expect(
      looksLikeMarkdownDocument(`
- 第一项
- 第二项
> 引用
      `),
    ).toBe(true);
  });

  it('普通单行文本不应被误判', () => {
    expect(looksLikeMarkdownDocument('这是一行普通文本，没有 markdown 结构')).toBe(false);
  });
});
