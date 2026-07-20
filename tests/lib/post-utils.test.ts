import { describe, it, expect } from 'vitest';
import {
  extractTOC,
  hasCodeBlocks,
  hasMermaidBlocks,
  extractFaq,
  selectRelatedPosts,
  getPostPath,
  getPrimaryCategorySlug,
} from '../../src/lib/post-utils';

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

  describe('hasMermaidBlocks', () => {
    it('检测到 language-mermaid class 返回 true', () => {
      expect(hasMermaidBlocks('<pre><code class="language-mermaid">flowchart TD</code></pre>')).toBe(true);
    });

    it('class 里还有其它值时也能命中', () => {
      expect(hasMermaidBlocks('<pre><code class="hljs language-mermaid foo">x</code></pre>')).toBe(true);
    });

    it('没有 language-mermaid 时返回 false', () => {
      expect(hasMermaidBlocks('<pre><code class="language-javascript">const x = 1;</code></pre>')).toBe(false);
    });

    it('空字符串返回 false', () => {
      expect(hasMermaidBlocks('')).toBe(false);
    });
  });

  describe('extractFaq', () => {
    it('从「常见问题（FAQ）」区块提取问答对', () => {
      const html = `
        <h2 id="intro">引言</h2>
        <p>正文</p>
        <h2 id="faq">常见问题（FAQ）</h2>
        <h3>Worker 有什么限制？</h3>
        <p>CPU 时间和内存有上限。</p>
        <h3>如何调试？</h3>
        <p>使用 wrangler tail。</p>
      `;
      const faq = extractFaq(html);
      expect(faq).toHaveLength(2);
      expect(faq[0]).toEqual({ question: 'Worker 有什么限制？', answer: 'CPU 时间和内存有上限。' });
      expect(faq[1].question).toBe('如何调试？');
    });

    it('英文 FAQ 标题也能命中（大小写不敏感）', () => {
      const html = '<h2>FAQ</h2><h3>Q?</h3><p>A.</p>';
      expect(extractFaq(html)).toEqual([{ question: 'Q?', answer: 'A.' }]);
    });

    it('FAQ 区块在下一个 h2 处结束', () => {
      const html = `
        <h2>常见问题</h2>
        <h3>Q1?</h3><p>A1.</p>
        <h2>后续章节</h2>
        <h3>不应计入</h3><p>X</p>
      `;
      const faq = extractFaq(html);
      expect(faq).toHaveLength(1);
      expect(faq[0].question).toBe('Q1?');
    });

    it('无 FAQ 区块返回空数组', () => {
      expect(extractFaq('<h2>引言</h2><p>无 FAQ</p>')).toEqual([]);
    });

    it('忽略带标签的标题并清理 HTML', () => {
      const html = '<h2 id="faq">常见问题</h2><h3><strong>问</strong>题？</h3><p>答<em>案</em>。</p>';
      expect(extractFaq(html)).toEqual([{ question: '问题？', answer: '答案。' }]);
    });
  });

  describe('selectRelatedPosts', () => {
    const current = { slug: 'current', tags: [1, 2, 3] };

    it('剔除自身并按共享标签数降序', () => {
      const candidates = [
        { slug: 'current', tags: [1, 2, 3] },
        { slug: 'a', tags: [9] },
        { slug: 'b', tags: [1, 2] },
        { slug: 'c', tags: [1] },
      ];
      const result = selectRelatedPosts(current, candidates, 3);
      expect(result.map((p) => p.slug)).toEqual(['b', 'c', 'a']);
    });

    it('按 slug 去重', () => {
      const candidates = [
        { slug: 'a', tags: [1] },
        { slug: 'a', tags: [1] },
        { slug: 'b', tags: [2] },
      ];
      const result = selectRelatedPosts(current, candidates, 5);
      expect(result.map((p) => p.slug)).toEqual(['a', 'b']);
    });

    it('截取前 n 篇', () => {
      const candidates = [
        { slug: 'a', tags: [1] },
        { slug: 'b', tags: [2] },
        { slug: 'c', tags: [3] },
      ];
      expect(selectRelatedPosts(current, candidates, 2)).toHaveLength(2);
    });

    it('无共享标签时仍返回候选顺序的前 n 篇（分类兜底）', () => {
      const noTagCurrent = { slug: 'current', tags: [] };
      const candidates = [
        { slug: 'a', tags: [9] },
        { slug: 'b', tags: [8] },
      ];
      expect(selectRelatedPosts(noTagCurrent, candidates, 3).map((p) => p.slug)).toEqual(['a', 'b']);
    });
  });

  describe('getPostPath / getPrimaryCategorySlug', () => {
    it('优先用 _embedded 主分类拼规范路径', () => {
      const post = {
        slug: 'hello-world',
        categories: [2],
        _embedded: {
          'wp:term': [[{ id: 2, name: 'Next.js', slug: 'next-js' }]],
        },
      };
      expect(getPrimaryCategorySlug(post)).toBe('next-js');
      expect(getPostPath(post)).toBe('/posts/next-js/hello-world');
    });

    it('无 embed 时用 categorySlugById 兜底', () => {
      const post = { slug: 'hello-world', categories: [5] };
      const map = new Map<number, string>([[5, 'cloudflare-worker']]);
      expect(getPostPath(post, map)).toBe('/posts/cloudflare-worker/hello-world');
    });

    it('都没有时回落 uncategorized', () => {
      expect(getPostPath({ slug: 'orphan' })).toBe('/posts/uncategorized/orphan');
    });
  });
});
