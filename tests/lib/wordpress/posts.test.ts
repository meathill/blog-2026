import { describe, it, expect } from 'vitest';
import { processContent } from '@/lib/wordpress/posts';

describe('processContent', () => {
  it('should replace internal links', () => {
    const input = 'Check out <a href="https://blog.meathill.com/tech/some-post.html">this post</a>';
    const expected = 'Check out <a href="/posts/tech/some-post">this post</a>';
    expect(processContent(input)).toBe(expected);
  });

  it('should add id to headings if missing', () => {
    const input = '<h2>Title One</h2><p>Content</p><h3>Title Two</h3>';
    const expected = '<h2 id="title-one">Title One</h2><p>Content</p><h3 id="title-two">Title Two</h3>';
    expect(processContent(input)).toBe(expected);
  });

  it('should respect existing id', () => {
    const input = '<h2 id="existing-id">Title One</h2>';
    const expected = '<h2 id="existing-id">Title One</h2>';
    expect(processContent(input)).toBe(expected);
  });

  it('should handle Chinese characters in id', () => {
    const input = '<h2>中文标题</h2>';
    // slugify handles Chinese by default if not removed by regex?
    // Wait, by default slugify removes non-ascii unless configured?
    // Let's verify behavior. The manual regex kept Chinese.
    // If slugify strips Chinese without extra config, we need to check options.
    // However, I used `remove` option in replacement which explicitly *allows* Chinese range `\u4e00-\u9fa5`.
    // Wait, the regex `/[^\u4e00-\u9fa5a-zA-Z0-9\s-_]/g` defines what to REMOVE.
    // So it removes anything that is NOT Chinese, alphanumeric, space, dash, underscore.
    // Effectively keeping Chinese.

    // BUT slugify might convert Chinese to pinyin or strip it if not configured?
    // Actually `slugify` usually preserves unicode if `strict` is false.
    // Let's see.
    const expected = '<h2 id="中文标题">中文标题</h2>';
    expect(processContent(input)).toBe(expected);
  });

  it('should handle mixed characters and remove specials', () => {
    const input = '<h2>Title (with) [special] chars!</h2>';
    const expected = '<h2 id="title-with-special-chars">Title (with) [special] chars!</h2>';
    expect(processContent(input)).toBe(expected);
  });

  it('should turn <br> inside <pre><code> into newlines', () => {
    const input = '<pre data-language="ts"><code>line1<br>line2<br/>line3</code></pre>';
    const expected = '<pre data-language="ts"><code>line1\nline2\nline3</code></pre>';
    expect(processContent(input)).toBe(expected);
  });

  it('should not touch <br> outside <pre>', () => {
    const input = '<p>foo<br>bar</p>';
    expect(processContent(input)).toBe(input);
  });
});
