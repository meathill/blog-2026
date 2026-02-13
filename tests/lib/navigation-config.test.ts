import { describe, expect, it } from 'vitest';
import {
  getDefaultNavigationItems,
  parseNavigationConfigJson,
  parseNavigationItemsJson,
  resolveNavigationLocale,
  resolveNavigationSection,
} from '@/lib/navigation-config';

describe('navigation-config', () => {
  it('resolveNavigationLocale 应仅接受 en，其余回退 zh', () => {
    expect(resolveNavigationLocale('en')).toBe('en');
    expect(resolveNavigationLocale('zh')).toBe('zh');
    expect(resolveNavigationLocale('foo')).toBe('zh');
    expect(resolveNavigationLocale(undefined)).toBe('zh');
  });

  it('resolveNavigationSection 应仅接受 footer，其余回退 header', () => {
    expect(resolveNavigationSection('footer')).toBe('footer');
    expect(resolveNavigationSection('header')).toBe('header');
    expect(resolveNavigationSection('foo')).toBe('header');
    expect(resolveNavigationSection(undefined)).toBe('header');
  });

  it('getDefaultNavigationItems 应返回默认 header/footer 导航', () => {
    const zhItems = getDefaultNavigationItems('zh', 'header');
    const enItems = getDefaultNavigationItems('en', 'header');
    const zhFooter = getDefaultNavigationItems('zh', 'footer');

    expect(zhItems.length).toBeGreaterThan(0);
    expect(enItems.length).toBeGreaterThan(0);
    expect(zhFooter.length).toBeGreaterThan(0);
    expect(zhItems[0].href).toBe('/about');
    expect(enItems[0].href).toBe('/about');
    expect(zhFooter[0].href).toBe('/posts');
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

  it('parseNavigationConfigJson 应兼容旧版数组格式（仅 header）', () => {
    const config = parseNavigationConfigJson('[{"href":"/about","label":"About"}]', 'en');

    expect(config.header).toEqual([{ href: '/about', label: 'About' }]);
    expect(config.footer.length).toBeGreaterThan(0);
    expect(config.footer[0]?.href).toBe('/posts');
  });

  it('parseNavigationConfigJson 应解析新版对象格式', () => {
    const config = parseNavigationConfigJson(
      JSON.stringify({
        header: [{ href: '/about', label: 'About' }],
        footer: [{ href: '/posts', label: 'Archives' }],
      }),
      'en',
    );

    expect(config.header).toEqual([{ href: '/about', label: 'About' }]);
    expect(config.footer).toEqual([{ href: '/posts', label: 'Archives' }]);
  });
});
