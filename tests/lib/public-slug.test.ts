import { describe, expect, it } from 'vitest';
import {
  decodePublicSlug,
  isPublicSlug,
  rememberCategorySlug,
  searchResultPath,
  termPublicPath,
} from '@/lib/public-slug';

describe('public slug', () => {
  it('拒绝空值和会被模板收成路径段的 null / undefined', () => {
    expect(isPublicSlug(null)).toBe(false);
    expect(isPublicSlug(undefined)).toBe(false);
    expect(isPublicSlug('')).toBe(false);
    expect(isPublicSlug('  ')).toBe(false);
    expect(isPublicSlug('null')).toBe(false);
    expect(isPublicSlug('undefined')).toBe(false);
    expect(isPublicSlug('react')).toBe(true);
  });

  it('decodeURIComponent(null) 不再变成分类 slug', () => {
    expect(decodePublicSlug(null)).toBeNull();
    const map = new Map<number, string>();
    rememberCategorySlug(map, 1, null);
    expect(map.has(1)).toBe(false);
    rememberCategorySlug(map, 2, 'next-js');
    expect(map.get(2)).toBe('next-js');
  });

  it('分类和标签路径在 slug 为空时不生成链接', () => {
    expect(termPublicPath('tag', null)).toBeNull();
    expect(termPublicPath('category', 'null')).toBeNull();
    expect(termPublicPath('tag', 'react')).toBe('/tag/react');
  });

  it('搜索结果不落到 /posts/null', () => {
    expect(searchResultPath(undefined, null)).toBeNull();
    expect(searchResultPath('https://meathill.com/posts/js/null', 'null')).toBeNull();
    expect(searchResultPath('https://meathill.com/en/posts/js/hello', 'ignored')).toBe('/posts/js/hello');
    expect(searchResultPath(undefined, 'hello')).toBe('/posts/hello');
  });
});
