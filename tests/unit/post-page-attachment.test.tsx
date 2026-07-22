import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostPage, { generateMetadata } from '../../src/app/[locale]/(public)/posts/[...slug]/page';
import * as wordpress from '../../src/lib/wordpress';

vi.mock('../../src/lib/wordpress', () => ({
  getPost: vi.fn(),
  getPostById: vi.fn(),
  getCategories: vi.fn(),
  getCategoryBySlug: vi.fn(),
  getMediaBySlug: vi.fn(),
  stripHtml: vi.fn((str: string) => str),
  buildPostDescription: vi.fn(() => 'desc'),
}));

vi.mock('../../src/views/PostView', () => ({
  default: () => <div data-testid="post-view">Post View</div>,
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  permanentRedirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('../../src/i18n/routing', () => ({
  routing: {
    defaultLocale: 'zh',
  },
}));

describe('PostPage Attachment Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://meathill.com';
  });

  it('attachment URL 应 301 到父文规范路径', async () => {
    (wordpress.getPost as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      slug: 'my-post',
      title: { rendered: 'Post' },
      categories: [10],
      date: '2023-01-01',
    });
    (wordpress.getCategories as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 10, slug: 'tech', name: 'Tech', count: 1 },
    ]);

    const params = Promise.resolve({
      locale: 'zh',
      slug: ['my-post', 'attachment', 'img_0509'],
    });

    await expect(PostPage({ params })).rejects.toThrow('REDIRECT:/posts/tech/my-post');
    expect(wordpress.getPost).toHaveBeenCalledWith('my-post');
  });

  it('带分类的 attachment URL 应 301 到父路径（去掉 attachment 段）', async () => {
    const params = Promise.resolve({
      locale: 'zh',
      slug: ['tech', 'my-post', 'attachment', 'img_0509'],
    });

    await expect(PostPage({ params })).rejects.toThrow('REDIRECT:/posts/tech/my-post');
    expect(wordpress.getPost).not.toHaveBeenCalled();
  });

  it('en locale 的 attachment 应带 /en 前缀', async () => {
    const params = Promise.resolve({
      locale: 'en',
      slug: ['tech', 'my-post', 'attachment', 'img_0509'],
    });

    await expect(PostPage({ params })).rejects.toThrow('REDIRECT:/en/posts/tech/my-post');
  });

  it('generateMetadata 对 attachment 使用父文 canonical + noindex', async () => {
    const params = Promise.resolve({
      locale: 'zh',
      slug: ['tech', 'my-post', 'attachment', 'img_0509'],
    });

    const meta = await generateMetadata({ params });

    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe('https://meathill.com/posts/tech/my-post');
    expect(meta.alternates?.languages?.en).toBe('https://meathill.com/en/posts/tech/my-post');
  });
});
