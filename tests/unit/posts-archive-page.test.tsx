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
}));

vi.mock('../../src/i18n/routing', () => ({
  routing: {
    defaultLocale: 'zh',
  },
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

  it('should redirect out-of-range archive pages to the last page for default locale', async () => {
    (wordpress.getPosts as any).mockResolvedValue({
      posts: [],
      total: 800,
      totalPages: 40,
    });

    await ArchivePageNum({
      params: Promise.resolve({
        locale: 'zh',
        num: '61',
      }),
    });

    expect(navigation.redirect).toHaveBeenCalledWith('/posts/page/40');
    expect(wordpress.getCategories).not.toHaveBeenCalled();
  });

  it('should keep locale prefix when redirecting out-of-range English archive pages', async () => {
    (wordpress.getPosts as any).mockResolvedValue({
      posts: [],
      total: 800,
      totalPages: 40,
    });

    await ArchivePageNum({
      params: Promise.resolve({
        locale: 'en',
        num: '61',
      }),
    });

    expect(navigation.redirect).toHaveBeenCalledWith('/en/posts/page/40');
    expect(wordpress.getCategories).not.toHaveBeenCalled();
  });
});
