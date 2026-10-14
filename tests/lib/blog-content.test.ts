import { describe, expect, it } from 'vitest';
import { buildBlogContentSnapshot } from '@/lib/blog-content';

describe('buildBlogContentSnapshot', () => {
  const validBlocksJson = JSON.stringify([
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Hello world', styles: {} }],
    },
  ]);

  it('正确返回清洗后的 markdown 和规范化后的 html 链接', () => {
    const rawMarkdown = '欢迎访问 [友链博客](https://friend.com#__dofollow)';
    const rawHtml =
      '<p>欢迎访问 <a href="https://friend.com#__dofollow">友链博客</a> 和 <a href="https://google.com">Google</a></p>';

    const snapshot = buildBlogContentSnapshot(validBlocksJson, rawHtml, rawMarkdown);

    expect(snapshot.markdown).toBe('欢迎访问 [友链博客](https://friend.com)');
    expect(snapshot.html).toBe(
      '<p>欢迎访问 <a href="https://friend.com" target="_blank" rel="noopener">友链博客</a> 和 <a href="https://google.com" target="_blank" rel="noopener nofollow">Google</a></p>',
    );
  });

  it('如果内容为空或无实质内容抛错', () => {
    expect(() => buildBlogContentSnapshot('[]', '', '')).toThrow('正文内容不能为空。');
  });
});
