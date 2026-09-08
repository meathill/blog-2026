import { describe, expect, it, vi } from 'vitest';

// blog-admin-paths 经 @/i18n/routing 拉入 next-intl，vitest 下 ESM 解析失败，mock 掉
vi.mock('next-intl/navigation', () => ({
  createNavigation: () => ({}),
}));

import { buildBlogEditHref, buildPublicPreviewHref, getLocalePrefix } from '@/lib/blog-admin-paths';

describe('blog-admin-paths', () => {
  it('默认语言无前缀', () => {
    expect(getLocalePrefix('zh')).toBe('');
    expect(buildBlogEditHref('zh', 'abc')).toBe('/admin/blog/abc');
    expect(buildPublicPreviewHref('zh', 'hello')).toBe('/posts/hello');
  });

  it('非默认语言加前缀', () => {
    expect(getLocalePrefix('en')).toBe('/en');
    expect(buildBlogEditHref('en', 'abc')).toBe('/en/admin/blog/abc');
    expect(buildPublicPreviewHref('en', 'hello')).toBe('/en/posts/hello');
  });
});
