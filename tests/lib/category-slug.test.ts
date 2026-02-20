import { describe, it, expect } from 'vitest';
import { parseCategorySlug } from '@/lib/category-slug';

describe('parseCategorySlug', () => {
  it('应将单层分类路径解析为 pageNum=1', () => {
    const result = parseCategorySlug(['life']);
    expect(result).toEqual({ categoryPath: ['life'], pageNum: 1 });
  });

  it('应将多层嵌套分类路径解析为 pageNum=1', () => {
    const result = parseCategorySlug(['life', 'cartoon']);
    expect(result).toEqual({ categoryPath: ['life', 'cartoon'], pageNum: 1 });
  });

  it('应从末尾提取 page 和页码', () => {
    const result = parseCategorySlug(['life', 'cartoon', 'page', '2']);
    expect(result).toEqual({ categoryPath: ['life', 'cartoon'], pageNum: 2 });
  });

  it('应正确处理单层分类的分页', () => {
    const result = parseCategorySlug(['tech', 'page', '5']);
    expect(result).toEqual({ categoryPath: ['tech'], pageNum: 5 });
  });

  it('非法页码应回退到 pageNum=1', () => {
    const result = parseCategorySlug(['life', 'cartoon', 'page', 'abc']);
    expect(result).toEqual({ categoryPath: ['life', 'cartoon', 'page', 'abc'], pageNum: 1 });
  });

  it('页码为 0 应回退到 pageNum=1', () => {
    const result = parseCategorySlug(['life', 'page', '0']);
    expect(result).toEqual({ categoryPath: ['life', 'page', '0'], pageNum: 1 });
  });

  it('负数页码应回退到 pageNum=1', () => {
    const result = parseCategorySlug(['life', 'page', '-1']);
    expect(result).toEqual({ categoryPath: ['life', 'page', '-1'], pageNum: 1 });
  });

  it('空数组应返回空 categoryPath 和 pageNum=1', () => {
    const result = parseCategorySlug([]);
    expect(result).toEqual({ categoryPath: [], pageNum: 1 });
  });

  it('仅包含 page 和页码应返回空 categoryPath', () => {
    const result = parseCategorySlug(['page', '3']);
    expect(result).toEqual({ categoryPath: [], pageNum: 3 });
  });
});
