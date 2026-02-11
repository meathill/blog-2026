import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostPage from '../../src/app/[locale]/(public)/posts/[...slug]/page';
import * as navigation from 'next/navigation';
import * as wordpress from '../../src/lib/wordpress';

// Mock dependnecies
vi.mock('../../src/lib/wordpress', () => ({
  getPost: vi.fn(),
  getCategories: vi.fn(),
  stripHtml: vi.fn((str) => str),
}));

vi.mock('../../src/views/PostView', () => ({
  default: () => null,
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
    expect(navigation.redirect).not.toHaveBeenCalled();
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
    expect(navigation.redirect).toHaveBeenCalledWith('/posts/tech/my-amazing-post');
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

    expect(navigation.redirect).not.toHaveBeenCalled();
  });
});
