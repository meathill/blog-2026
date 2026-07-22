import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostPage from '../../src/app/[locale]/(public)/posts/[...slug]/page';
import * as navigation from 'next/navigation';
import * as wordpress from '../../src/lib/wordpress';

// Mock dependnecies
vi.mock('../../src/lib/wordpress', () => ({
  getPost: vi.fn(),
  getPostById: vi.fn(),
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
});
