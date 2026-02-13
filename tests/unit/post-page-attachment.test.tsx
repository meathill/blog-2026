import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostPage from '../../src/app/[locale]/(public)/posts/[...slug]/page';
import * as wordpress from '../../src/lib/wordpress';
import * as navigation from 'next/navigation';

// Mock dependencies
vi.mock('../../src/lib/wordpress', () => ({
  getPost: vi.fn(),
  getCategories: vi.fn(),
  getMediaBySlug: vi.fn(),
  stripHtml: vi.fn((str) => str),
  formatDate: vi.fn((date) => date),
}));

vi.mock('../../src/views/PostView', () => ({
  default: () => <div data-testid="post-view">Post View</div>,
}));

vi.mock('../../src/views/AttachmentView', () => ({
  default: ({ media, parentPostSlug }: any) => (
    <div data-testid="attachment-view" data-parent={parentPostSlug}>
      Attachment: {media.title.rendered}
    </div>
  ),
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

describe('PostPage Attachment Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render AttachmentView when URL follows attachment pattern and media exists', async () => {
    // Setup
    const parentSlug = 'my-post';
    const attachmentSlug = 'img_0509';
    const mockMedia = {
      id: 101,
      title: { rendered: 'My Image' },
      media_type: 'image',
      source_url: 'http://example.com/img.jpg',
    };

    (wordpress.getMediaBySlug as any).mockResolvedValue(mockMedia);

    const params = Promise.resolve({
      locale: 'zh',
      slug: [parentSlug, 'attachment', attachmentSlug],
    });

    // Execute
    const result = await PostPage({ params });

    // Verify
    expect(wordpress.getMediaBySlug).toHaveBeenCalledWith(attachmentSlug);
    expect(wordpress.getPost).not.toHaveBeenCalled(); // Should not fetch post
    expect(result).toBeDefined();
  });

  it('should fall back to getPost if media not found', async () => {
    // Setup
    const parentSlug = 'my-post';
    const attachmentSlug = 'unknown-img';

    (wordpress.getMediaBySlug as any).mockResolvedValue(null);
    (wordpress.getPost as any).mockResolvedValue({
      id: 1,
      title: { rendered: 'Post' },
      categories: [],
      date: '2023-01-01',
    });

    const params = Promise.resolve({
      locale: 'zh',
      slug: [parentSlug, 'attachment', attachmentSlug],
    });

    // Execute
    await PostPage({ params });

    // Verify
    expect(wordpress.getMediaBySlug).toHaveBeenCalledWith(attachmentSlug);
    // Should fall back to getPost with the last segment 'unknown-img'
    expect(wordpress.getPost).toHaveBeenCalledWith(attachmentSlug);
  });
});
