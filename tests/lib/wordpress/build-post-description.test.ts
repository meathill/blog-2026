import { describe, it, expect } from 'vitest';
import { buildPostDescription } from '../../../src/lib/wordpress/posts';
import type { WPPost } from '../../../src/lib/wordpress/types';

function makePost(partial: { excerpt?: string; content?: string }): WPPost {
  return {
    id: 1,
    date: '2026-01-01',
    modified: '2026-01-01',
    slug: 'demo',
    title: { rendered: 'Demo' },
    excerpt: { rendered: partial.excerpt ?? '' },
    content: { rendered: partial.content ?? '' },
    categories: [],
    tags: [],
    featured_media: 0,
  };
}

describe('buildPostDescription', () => {
  it('短于 110 的手写摘要以摘要开头、拼接正文补足长度（2026-07 修订 #4 决策）', () => {
    const excerpt =
      'Vercel 与 Cloudflare 部署网站怎么选？从价格、冷启动、带宽费用、函数运行时到 Next.js 支持全面对比，给出不同项目规模与预算下的选型建议（2026 更新）。';
    expect(excerpt.length).toBeLessThan(110);
    expect(excerpt.length).toBeGreaterThanOrEqual(20);

    const desc = buildPostDescription(
      makePost({
        excerpt: `<p>${excerpt}</p>`,
        content:
          '<p>随着 Vibe coding 兴起，我们有越来越多的项目基于 Next.js + OpenNext 构建，部署在 Cloudflare Workers 上。这套方案性能强悍、成本极低，堪称目前全栈开发的“版本答案”。但是，很多同学（包括我自己）从 Vercel、Docker 或者 VPS 迁移过来时，都会掉进同一个坑</p>',
      }),
    );

    // 摘要在前保住 CTR，正文补足到 110–160
    expect(desc.startsWith(excerpt)).toBe(true);
    expect(desc.length).toBeGreaterThanOrEqual(110);
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).toContain('随着 Vibe coding');
  });

  it('达到 110 的摘要原样优先，不拼接正文', () => {
    const excerpt = `本文对比 Vercel 与 Cloudflare 的价格、冷启动、带宽费用、函数运行时与 Next.js 支持，${'补充说明'.repeat(15)}`;
    expect(excerpt.length).toBeGreaterThanOrEqual(110);

    const desc = buildPostDescription(makePost({ excerpt: `<p>${excerpt}</p>`, content: '<p>正文开头</p>' }));
    expect(desc).toBe(excerpt.slice(0, 160));
    expect(desc).not.toContain('正文开头');
  });

  it('WP 自动摘要（正文开头截取）不重复拼接', () => {
    const body = '这是一段正文开头，WordPress 会自动截取它作为摘要，后面还有更多内容继续展开细节。'.repeat(3);
    const autoExcerpt = `${body.slice(0, 55)}…`;
    const desc = buildPostDescription(makePost({ excerpt: `<p>${autoExcerpt}</p>`, content: `<p>${body}</p>` }));
    expect(desc).toBe(body.slice(0, 160));
  });

  it('超长 excerpt 截断到 160', () => {
    const long = '测'.repeat(200);
    const desc = buildPostDescription(makePost({ excerpt: long }));
    expect(desc.length).toBe(160);
  });

  it('空 excerpt 用正文兜底', () => {
    const desc = buildPostDescription(
      makePost({
        excerpt: '',
        content: '<p>正文开头足够长用来生成描述，补充一些文字凑到超过二十个字符。</p>',
      }),
    );
    expect(desc).toContain('正文开头');
  });

  it('极短 excerpt（<20）用正文兜底', () => {
    const desc = buildPostDescription(
      makePost({
        excerpt: '太短了',
        content: '<p>这是足够长的正文内容，应该被用作描述而不是那句太短的摘要。</p>',
      }),
    );
    expect(desc).toContain('足够长的正文');
  });
});
