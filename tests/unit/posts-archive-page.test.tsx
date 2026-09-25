import { beforeEach, describe, expect, it, vi } from 'vitest';
import ArchivePageNum from '../../src/app/[locale]/(public)/posts/page/[num]/page';
import * as navigation from 'next/navigation';
import * as wordpress from '../../src/lib/wordpress';

vi.mock('../../src/lib/wordpress', () => ({
  getPosts: vi.fn(),
  getCategories: vi.fn(),
}));

vi.mock('../../src/components/posts/post-list', () => ({
  PostList: () => <div data-testid="post-list">PostList</div>,
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

describe('ArchivePageNum', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render archive page for valid page numbers', async () => {
    (wordpress.getPosts as any).mockResolvedValue({
      posts: [{ id: 1 }],
      total: 800,
      totalPages: 40,
    });
    (wordpress.getCategories as any).mockResolvedValue([]);

    const result = await ArchivePageNum({
      params: Promise.resolve({
        locale: 'zh',
        num: '3',
      }),
    });

    expect(wordpress.getPosts).toHaveBeenCalledWith({
      page: 3,
      perPage: 20,
    });
    expect(wordpress.getCategories).toHaveBeenCalled();
    expect(navigation.redirect).not.toHaveBeenCalled();
    expect(navigation.notFound).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should permanently redirect out-of-range pages to the last page', async () => {
    (wordpress.getPosts as any).mockResolvedValue({
      posts: [],
      total: 800,
      totalPages: 40,
    });

    await expect(ArchivePageNum({ params: Promise.resolve({ locale: 'zh', num: '61' }) })).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(navigation.permanentRedirect).toHaveBeenCalledWith('/posts/page/40');
    expect(wordpress.getCategories).not.toHaveBeenCalled();
  });

  it('should permanently redirect out-of-range en pages to /en/posts when total is unknown', async () => {
    (wordpress.getPosts as any).mockResolvedValue({ posts: [], total: 0, totalPages: 0 });

    await expect(ArchivePageNum({ params: Promise.resolve({ locale: 'en', num: '7' }) })).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(navigation.permanentRedirect).toHaveBeenCalledWith('/en/posts');
  });

  it('should permanently redirect page 1 to /posts', async () => {
    await expect(ArchivePageNum({ params: Promise.resolve({ locale: 'zh', num: '1' }) })).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(navigation.permanentRedirect).toHaveBeenCalledWith('/posts');
    expect(wordpress.getPosts).not.toHaveBeenCalled();
  });

  it('should return notFound for invalid page numbers', async () => {
    await ArchivePageNum({
      params: Promise.resolve({
        locale: 'zh',
        num: '0',
      }),
    });

    expect(navigation.notFound).toHaveBeenCalled();
    expect(wordpress.getPosts).not.toHaveBeenCalled();
  });
});
