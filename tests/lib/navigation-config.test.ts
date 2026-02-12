import { describe, expect, it } from 'vitest';
import { getDefaultNavigationItems, parseNavigationItemsJson, resolveNavigationLocale } from '@/lib/navigation-config';

describe('navigation-config', () => {
  it('resolveNavigationLocale 应仅接受 en，其余回退 zh', () => {
    expect(resolveNavigationLocale('en')).toBe('en');
    expect(resolveNavigationLocale('zh')).toBe('zh');
    expect(resolveNavigationLocale('foo')).toBe('zh');
    expect(resolveNavigationLocale(undefined)).toBe('zh');
  });

  it('getDefaultNavigationItems 应返回默认导航', () => {
    const zhItems = getDefaultNavigationItems('zh');
    const enItems = getDefaultNavigationItems('en');

    expect(zhItems.length).toBeGreaterThan(0);
    expect(enItems.length).toBeGreaterThan(0);
    expect(zhItems[0].href).toBe('/about');
    expect(enItems[0].href).toBe('/about');
  });

  it('parseNavigationItemsJson 应解析合法 JSON 并清洗字段', () => {
    const json = JSON.stringify([
      {
        href: ' /about ',
        label: ' About ',
        children: [
          {
            href: '/child',
            label: 'Child',
            external: true,
          },
        ],
      },
    ]);

    const items = parseNavigationItemsJson(json);

    expect(items).toEqual([
      {
        href: '/about',
        label: 'About',
        children: [
          {
            href: '/child',
            label: 'Child',
            external: true,
          },
        ],
      },
    ]);
  });

  it('parseNavigationItemsJson 应拒绝非法结构', () => {
    expect(() => parseNavigationItemsJson('{"a":1}')).toThrow('导航配置必须是数组');
    expect(() => parseNavigationItemsJson('[{"href":"","label":"A"}]')).toThrow('导航项缺少有效 href');
    expect(() => parseNavigationItemsJson('[{"href":"/a","label":"","children":{}}]')).toThrow('导航项缺少有效 label');
    expect(() => parseNavigationItemsJson('[{"href":"/a","label":"A","children":{}}]')).toThrow('children 必须是数组');
  });
});
