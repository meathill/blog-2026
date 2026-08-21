import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostPage, { generateStaticParams } from '../../src/app/[locale]/(public)/posts/[...slug]/page';
import * as navigation from 'next/navigation';
import * as wordpress from '../../src/lib/wordpress';

// Mock dependnecies
vi.mock('../../src/lib/wordpress', () => ({
  getPost: vi.fn(),
  getPostById: vi.fn(),
  getPosts: vi.fn(),
  getCategories: vi.fn(),
  getCategoryBySlug: vi.fn(),
  getMediaBySlug: vi.fn(),
  stripHtml: vi.fn((str) => str),
  buildPostDescription: vi.fn(() => 'desc'),
}));

vi.mock('../../src/views/PostView', () => ({
  default: () => null,
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

vi.mock('../../src/i18n/routing', () => ({
  routing: {
    locales: ['zh', 'en'],
    defaultLocale: 'zh',
  },
}));

describe('PostPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should NOT redirect when URL category slug (decoded) matches API category slug (encoded)', async () => {
    // Setup
    const encodedSlug = encodeURIComponent('直播'); // %E7%9B%B4%E6%92%AD
    const decodedSlug = '直播';
    const postSlug = 'my-amazing-post';

    const mockPost = {
      id: 1,
      title: { rendered: 'Test Post' },
      categories: [123],
      date: '2023-01-01',
    };

    const mockCategory = {
      id: 123,
      slug: encodedSlug, // API returns encoded slug
      name: 'Streaming',
    };

    (wordpress.getPost as any).mockResolvedValue(mockPost);
    (wordpress.getCategories as any).mockResolvedValue([mockCategory]);

    const params = Promise.resolve({
      locale: 'zh',
      slug: [decodedSlug, postSlug],
    });

    // Execute
    await PostPage({ params });

    // Verify
    expect(wordpress.getPost).toHaveBeenCalledWith(postSlug);
    // Should NOT redirect because '直播' == decodeURIComponent('%E7%9B%B4%E6%92%AD')
    expect(navigation.permanentRedirect).not.toHaveBeenCalled();
  });

  it('should redirect when category slug does not match', async () => {
    // Setup
    const postSlug = 'my-amazing-post';
    const mockPost = {
      id: 1,
      title: { rendered: 'Test Post' },
      categories: [123],
    };
    const mockCategory = {
      id: 123,
      slug: 'tech',
      name: 'Tech',
    };

    (wordpress.getPost as any).mockResolvedValue(mockPost);
    (wordpress.getCategories as any).mockResolvedValue([mockCategory]);

    const params = Promise.resolve({
      locale: 'zh',
      slug: ['wrong-category', postSlug],
    });

    // Execute
    try {
      await PostPage({ params });
    } catch (e) {
      // redirect throws an error in Next.js, catch it here if mock doesn't prevent flow (but mock should just record call)
    }

    // Verify
    expect(navigation.permanentRedirect).toHaveBeenCalledWith('/posts/tech/my-amazing-post');
  });

  it('should fall back to category redirect for single-segment legacy slug', async () => {
    (wordpress.getPost as any).mockResolvedValue(null);
    (wordpress.getCategoryBySlug as any).mockResolvedValue({ id: 5, slug: 'js', name: 'js' });
    (navigation.permanentRedirect as any).mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });

    const params = Promise.resolve({ locale: 'zh', slug: ['js'] });

    await expect(PostPage({ params })).rejects.toThrow('REDIRECT:/category/js');
    expect(wordpress.getMediaBySlug).not.toHaveBeenCalled();
  });

  it('should fall back to attachment parent post for single-segment media slug', async () => {
    (wordpress.getPost as any).mockResolvedValue(null);
    (wordpress.getCategoryBySlug as any).mockResolvedValue(null);
    (wordpress.getMediaBySlug as any).mockResolvedValue({ id: 99, slug: 'img_0224', post: 42 });
    (wordpress.getPostById as any).mockResolvedValue({
      id: 42,
      slug: 'travel-note',
      title: { rendered: 'Travel' },
      categories: [123],
    });
    (wordpress.getCategories as any).mockResolvedValue([{ id: 123, slug: 'travel', name: 'Travel' }]);
    (navigation.permanentRedirect as any).mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });

    const params = Promise.resolve({ locale: 'zh', slug: ['img_0224'] });

    await expect(PostPage({ params })).rejects.toThrow('REDIRECT:/posts/travel/travel-note');
  });

  it('should 404 when single-segment slug matches nothing', async () => {
    (wordpress.getPost as any).mockResolvedValue(null);
    (wordpress.getCategoryBySlug as any).mockResolvedValue(null);
    (wordpress.getMediaBySlug as any).mockResolvedValue(null);
    (navigation.notFound as any).mockImplementation(() => {
      throw new Error('NOT_FOUND');
    });

    const params = Promise.resolve({ locale: 'zh', slug: ['no-such-thing'] });

    await expect(PostPage({ params })).rejects.toThrow('NOT_FOUND');
    expect(navigation.permanentRedirect).not.toHaveBeenCalled();
  });

  it('should NOT redirect for CJK slugs (e.g. 学习)', async () => {
    // Setup
    const encodedSlug = '%E5%AD%A6%E4%B9%A0'; // 学习
    const decodedSlug = '学习';
    const postSlug = 'how-to-learn';

    const mockPost = {
      id: 1,
      title: { rendered: 'Learn' },
      categories: [123],
    };
    const mockCategory = {
      id: 123,
      slug: encodedSlug,
      name: 'Learn',
    };

    (wordpress.getPost as any).mockResolvedValue(mockPost);
    (wordpress.getCategories as any).mockResolvedValue([mockCategory]);

    const params = Promise.resolve({
      locale: 'zh',
      slug: [decodedSlug, postSlug],
    });

    await PostPage({ params });

    expect(navigation.permanentRedirect).not.toHaveBeenCalled();
  });

  describe('generateStaticParams', () => {
    it('should generate params for all locales and posts with primary category slug', async () => {
      (wordpress.getCategories as any).mockResolvedValue([
        { id: 10, slug: 'tech' },
        { id: 20, slug: 'ai' },
      ]);
      (wordpress.getPosts as any).mockResolvedValue({
        posts: [
          { slug: 'post-1', categories: [10] },
          { slug: 'post-2', categories: [20] },
          { slug: 'post-uncategorized', categories: [] },
        ],
        totalPages: 1,
      });

      const params = await generateStaticParams();
      expect(params).toHaveLength(6); // 3 posts * 2 locales
      expect(params).toContainEqual({ locale: 'zh', slug: ['tech', 'post-1'] });
      expect(params).toContainEqual({ locale: 'en', slug: ['tech', 'post-1'] });
      expect(params).toContainEqual({ locale: 'zh', slug: ['ai', 'post-2'] });
      expect(params).toContainEqual({ locale: 'en', slug: ['ai', 'post-2'] });
      expect(params).toContainEqual({ locale: 'zh', slug: ['uncategorized', 'post-uncategorized'] });
      expect(params).toContainEqual({ locale: 'en', slug: ['uncategorized', 'post-uncategorized'] });
    });

    it('should handle pagination when totalPages > 1', async () => {
      (wordpress.getCategories as any).mockResolvedValue([{ id: 10, slug: 'tech' }]);
      (wordpress.getPosts as any)
        .mockResolvedValueOnce({
          posts: [{ slug: 'post-page-1', categories: [10] }],
          totalPages: 2,
        })
        .mockResolvedValueOnce({
          posts: [{ slug: 'post-page-2', categories: [10] }],
          totalPages: 2,
        });

      const params = await generateStaticParams();
      expect(params).toHaveLength(4); // 2 posts * 2 locales
      expect(params).toContainEqual({ locale: 'zh', slug: ['tech', 'post-page-1'] });
      expect(params).toContainEqual({ locale: 'zh', slug: ['tech', 'post-page-2'] });
    });

    it('should return empty array on failure without throwing', async () => {
      (wordpress.getCategories as any).mockRejectedValue(new Error('Network failure'));
      (wordpress.getPosts as any).mockRejectedValue(new Error('Network failure'));

      const params = await generateStaticParams();
      expect(params).toEqual([]);
    });
  });
});
