import { describe, it, expect } from 'vitest';
import { extractTOC, hasCodeBlocks } from '../../src/lib/post-utils';

describe('post-utils', () => {
  describe('extractTOC', () => {
    const identity = (s: string) => s;

    it('应该从 HTML 中提取 h2-h4 标题', () => {
      const html = `
        <h2 id="intro">Introduction</h2>
        <p>Some content</p>
        <h3 id="sub">Sub Section</h3>
        <h4 id="deep">Deep Section</h4>
      `;
      const toc = extractTOC(html, identity);
      expect(toc).toHaveLength(3);
      expect(toc[0]).toEqual({ level: 2, id: 'intro', text: 'Introduction' });
      expect(toc[1]).toEqual({ level: 3, id: 'sub', text: 'Sub Section' });
      expect(toc[2]).toEqual({ level: 4, id: 'deep', text: 'Deep Section' });
    });

    it('应该清理标题中的 HTML 标签', () => {
      const html = '<h2 id="test"><strong>Bold</strong> Title</h2>';
      const stripFn = (s: string) => s.replace(/<[^>]+>/g, '');
      const toc = extractTOC(html, stripFn);
      expect(toc).toHaveLength(1);
      expect(toc[0].text).toBe('Bold Title');
    });

    it('应该跳过没有 id 的标题', () => {
      const html = '<h2>No ID</h2><h2 id="has-id">Has ID</h2>';
      const toc = extractTOC(html, identity);
      expect(toc).toHaveLength(1);
      expect(toc[0].id).toBe('has-id');
    });

    it('空内容返回空数组', () => {
      expect(extractTOC('', identity)).toEqual([]);
    });

    it('不应提取 h1 和 h5+ 标题', () => {
      const html = '<h1 id="h1">H1</h1><h5 id="h5">H5</h5><h2 id="h2">H2</h2>';
      const toc = extractTOC(html, identity);
      expect(toc).toHaveLength(1);
      expect(toc[0].level).toBe(2);
    });
  });

  describe('hasCodeBlocks', () => {
    it('检测到 <pre> 标签返回 true', () => {
      expect(hasCodeBlocks('<pre><code>const x = 1;</code></pre>')).toBe(true);
    });

    it('检测到 <pre class="..."> 返回 true', () => {
      expect(hasCodeBlocks('<pre class="language-js"><code>x</code></pre>')).toBe(true);
    });

    it('没有 <pre> 标签返回 false', () => {
      expect(hasCodeBlocks('<p>Hello world</p>')).toBe(false);
    });

    it('空字符串返回 false', () => {
      expect(hasCodeBlocks('')).toBe(false);
    });

    it('不应匹配 <prefix> 等标签', () => {
      expect(hasCodeBlocks('<prefix>Not a pre</prefix>')).toBe(false);
    });
  });
});
