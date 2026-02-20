/**
 * 从 catch-all slug 数组中解析出分类路径和页码。
 *
 * @example
 *   parseCategorySlug(['life', 'cartoon'])
 *   // → { categoryPath: ['life', 'cartoon'], pageNum: 1 }
 *
 *   parseCategorySlug(['life', 'cartoon', 'page', '2'])
 *   // → { categoryPath: ['life', 'cartoon'], pageNum: 2 }
 */
export function parseCategorySlug(slugParts: string[]): { categoryPath: string[]; pageNum: number } {
  const len = slugParts.length;
  if (len >= 2 && slugParts[len - 2] === 'page') {
    const num = parseInt(slugParts[len - 1], 10);
    if (!isNaN(num) && num >= 1) {
      return {
        categoryPath: slugParts.slice(0, len - 2),
        pageNum: num,
      };
    }
  }
  return { categoryPath: slugParts, pageNum: 1 };
}
