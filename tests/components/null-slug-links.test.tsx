import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PostCard from '@/components/PostCard';
import PostBreadcrumb from '@/components/posts/post-breadcrumb';
import PostFooter from '@/components/posts/post-footer';
import PostHeader from '@/components/posts/post-header';
import type { WPPost } from '@/lib/wordpress/types';

vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

describe('空 slug 不渲染链接', () => {
  it('文章头、尾和面包屑把空分类/标签显示成文字', () => {
    const categories = [{ id: 1, name: '前端', slug: null as unknown as string, count: 1 }];
    const tags = [{ id: 2, name: 'React', slug: null as unknown as string, count: 1 }];

    render(
      <>
        <PostHeader title="标题" dateFormatted="2026-01-01" readingTime={3} categories={categories} tags={tags} />
        <PostFooter categories={categories} tags={tags} />
        <PostBreadcrumb title="标题" categories={categories} />
      </>,
    );

    expect(screen.getAllByText('前端').length).toBeGreaterThan(0);
    expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    expect(document.querySelector('a[href="/category/null"]')).toBeNull();
    expect(document.querySelector('a[href="/tag/null"]')).toBeNull();
  });

  it('文章卡片在 slug 为空时不链到 /posts/.../null 或 /tag/null', () => {
    const post = {
      id: 1,
      date: '2026-01-01',
      modified: '2026-01-01',
      slug: null,
      title: { rendered: '无 slug' },
      excerpt: { rendered: '摘要' },
      content: { rendered: '<p>正文</p>' },
      categories: [],
      tags: [],
      featured_media: 0,
      _embedded: {
        'wp:term': [[], [{ id: 9, name: '空标签', slug: null }]],
      },
    } as unknown as WPPost;

    render(<PostCard post={post} />);

    expect(screen.getByRole('heading', { name: '无 slug' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '无 slug' })).not.toBeInTheDocument();
    expect(screen.getByText('空标签')).toBeInTheDocument();
    expect(document.querySelector('a[href*="null"]')).toBeNull();
  });
});
