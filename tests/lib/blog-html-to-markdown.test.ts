import { describe, expect, it } from 'vitest';
import { htmlToMarkdown } from '@/lib/blog-html-to-markdown';

describe('htmlToMarkdown', () => {
  it('转换标题、加粗、斜体、行内代码、链接', () => {
    const html =
      '<h2>标题 Test</h2><p>Hello <strong>world</strong> and <em>emphasis</em>, <code>a * b</code>, <a href="https://example.com">link</a>.</p>';
    const markdown = htmlToMarkdown(html);

    expect(markdown).toContain('## 标题 Test');
    expect(markdown).toContain('**world**');
    expect(markdown).toContain('*emphasis*');
    expect(markdown).toContain('`a * b`');
    expect(markdown).toContain('[link](https://example.com)');
  });

  it('Gutenberg 图片结构（figure+img+figcaption）转成带 title 的 Markdown 图片', () => {
    const html =
      '<figure><img src="https://blog.meathill.com/a.jpg" alt="pic"><figcaption>a caption</figcaption></figure>';
    const markdown = htmlToMarkdown(html);

    expect(markdown.trim()).toBe('![pic](https://blog.meathill.com/a.jpg "a caption")');
  });

  it('无 figcaption 的图片不带 title', () => {
    const html = '<p><img src="https://blog.meathill.com/a.jpg" alt="pic"></p>';
    const markdown = htmlToMarkdown(html);

    expect(markdown.trim()).toBe('![pic](https://blog.meathill.com/a.jpg)');
  });

  it('转换有序/无序列表，包含嵌套列表', () => {
    const html = '<ul><li>one</li><li>two<ul><li>nested</li></ul></li></ul><ol><li>first</li><li>second</li></ol>';
    const markdown = htmlToMarkdown(html);

    expect(markdown).toContain('- one');
    expect(markdown).toContain('- two');
    expect(markdown).toContain('  - nested');
    expect(markdown).toContain('1. first');
    expect(markdown).toContain('2. second');
  });

  it('转换引用块', () => {
    const html = '<blockquote><p>quoted text</p></blockquote>';
    const markdown = htmlToMarkdown(html);

    expect(markdown.trim()).toBe('> quoted text');
  });

  it('转换带语言标注的代码块', () => {
    const html = '<pre><code class="language-js">const x = 1;\nconsole.log(x);</code></pre>';
    const markdown = htmlToMarkdown(html);

    expect(markdown).toContain('```js');
    expect(markdown).toContain('const x = 1;');
    expect(markdown).toContain('console.log(x);');
  });

  it('转换表格', () => {
    const html = '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>';
    const markdown = htmlToMarkdown(html);

    expect(markdown).toContain('| A | B |');
    expect(markdown).toContain('| --- | --- |');
    expect(markdown).toContain('| 1 | 2 |');
  });

  it('分隔线转成 ---', () => {
    expect(htmlToMarkdown('<hr>').trim()).toBe('---');
  });

  it('oEmbed 展开的 iframe 转成链接，不静默丢失', () => {
    const html = '<iframe src="https://www.youtube.com/embed/xyz"></iframe>';
    const markdown = htmlToMarkdown(html);

    expect(markdown.trim()).toBe('[嵌入内容](https://www.youtube.com/embed/xyz)');
  });

  it('未知包装标签（如 WordPress 的 wp-block-group div）原样展开子节点', () => {
    const html = '<div class="wp-block-group"><p>wrapped text</p></div>';
    const markdown = htmlToMarkdown(html);

    expect(markdown.trim()).toBe('wrapped text');
  });

  it('script/style 标签内容被丢弃', () => {
    const html = '<p>before</p><script>alert(1)</script><style>.a{color:red}</style><p>after</p>';
    const markdown = htmlToMarkdown(html);

    expect(markdown).not.toContain('alert');
    expect(markdown).not.toContain('color:red');
    expect(markdown).toContain('before');
    expect(markdown).toContain('after');
  });

  it('纯文本中的 markdown 特殊字符会被转义，避免被重新解析成语法', () => {
    const html = '<p>3 * 4 = 12, use snake_case and [brackets]</p>';
    const markdown = htmlToMarkdown(html);

    expect(markdown).toContain('3 \\* 4 = 12');
    expect(markdown).toContain('snake\\_case');
    expect(markdown).toContain('\\[brackets\\]');
  });

  it('空输入返回空字符串', () => {
    expect(htmlToMarkdown('')).toBe('');
    expect(htmlToMarkdown('   ')).toBe('');
  });
});
