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
  it('90 字 SEO 摘要应优先使用（不再要求 ≥110）', () => {
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

    expect(desc).toBe(excerpt);
    expect(desc.startsWith('随着 Vibe coding')).toBe(false);
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
