import { describe, it, expect } from 'vitest';
import { processContent } from '@/lib/wordpress/content';

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

  // --- Ahrefs 修复：死链解链 ---

  it('should unwrap legacy attachment page links but keep inner content', () => {
    const input =
      '<a href="http://blog.meathill.com/life/my-son.html/attachment/wp_20130627_0041"><img src="/x.jpg" alt=""></a>';
    expect(processContent(input)).toBe('<img src="/x.jpg" alt="">');
  });

  it('should unwrap links to dead subdomains', () => {
    const input =
      '前往 <a href="http://serial.meathill.com/tag/actionscript3-plugin-pattern/">系列教程</a> 和 <a href="http://qiniu.meathill.com/video/father-2018.mp4">视频</a>';
    expect(processContent(input)).toBe('前往 系列教程 和 视频');
  });

  it('should unwrap wp-admin links', () => {
    const input = '<a href="https://blog.meathill.com/wp-admin/post.php?post=1&amp;action=edit">编辑</a>';
    expect(processContent(input)).toBe('编辑');
  });

  it('should unwrap blog.meathill.com/wp-content media links (not publicly reachable)', () => {
    const input = '<a href="http://blog.meathill.com/wp-content/uploads/2017/01/2017.mp4">看视频</a>';
    expect(processContent(input)).toBe('看视频');
  });

  // --- Ahrefs 修复：http → https 与裸域名 ---

  it('should upgrade http meathill links to https', () => {
    const input = '<a href="http://www.meathill.com/">首页</a> <a href="http://hsm.meathill.com/">HSM</a>';
    expect(processContent(input)).toBe(
      '<a href="https://meathill.com/">首页</a> <a href="https://hsm.meathill.com/">HSM</a>',
    );
  });

  it('should prepend https to scheme-less bare domain links', () => {
    const input = '<a href="segmentfault.com">SF</a> <a href="www.cdnjs.com/libraries">cdnjs</a>';
    expect(processContent(input)).toBe(
      '<a href="https://segmentfault.com">SF</a> <a href="https://www.cdnjs.com/libraries">cdnjs</a>',
    );
  });

  it('should NOT touch normal absolute/relative/anchor links', () => {
    const input =
      '<a href="https://example.com/a">a</a> <a href="/posts/tech/x">b</a> <a href="#section">c</a> <a href="mailto:a@b.com">d</a> <a href="article.html">e</a>';
    expect(processContent(input)).toBe(input);
  });

  // --- Ahrefs 修复：wp-content 图片走 Image Resizing 管线 ---

  it('should route wp-content images through cdn-cgi image proxy', () => {
    const prefix = '/cdn-cgi/image/fit=scale-down,format=auto,width=1200,quality=65';
    const input =
      '<img src="https://meathill.com/wp-content/uploads/2012/08/list.png"><img src="/wp-content/uploads/2016/06/1.png">';
    expect(processContent(input)).toBe(
      `<img src="${prefix}/https://blog.meathill.com/wp-content/uploads/2012/08/list.png">` +
        `<img src="${prefix}/https://blog.meathill.com/wp-content/uploads/2016/06/1.png">`,
    );
  });

  it('should not double-wrap images already on the cdn-cgi pipeline', () => {
    const input =
      '<img src="/cdn-cgi/image/fit=scale-down,format=auto,width=1200,quality=65/https://blog.meathill.com/wp-content/uploads/2018/02/IMG_1853.jpg">';
    expect(processContent(input)).toBe(input);
  });
});
