import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as navigation from 'next/navigation';

// 回归背景：middleware 的 matcher 排除了 .xml/.png/.css 等扩展名结尾的路径，
// 这类请求（如 /news-sitemap.xml）不经过 middleware 注入合法 locale，
// 直接落进 [locale] 动态段，locale 参数变成 "news-sitemap.xml" 这种非法值，
// 若不校验会以 200 渲染中文首页（软 404 + 重复内容）。
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

// routing.ts 会经 createNavigation 拉入 next/navigation，vitest 下 ESM 解析失败，mock 掉
vi.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['en', 'zh'],
    defaultLocale: 'zh',
  },
}));

import LocaleLayout from '../../src/app/[locale]/layout';

describe('LocaleLayout locale 校验', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('非法 locale（如伪装成 .xml 的路径段）触发 notFound', async () => {
    (navigation.notFound as any).mockImplementation(() => {
      throw new Error('NOT_FOUND');
    });

    const params = Promise.resolve({ locale: 'news-sitemap.xml' });

    await expect(LocaleLayout({ children: null, params })).rejects.toThrow('NOT_FOUND');
  });

  it('合法 locale zh（middleware 为默认语言注入的值）正常透传 children', async () => {
    const params = Promise.resolve({ locale: 'zh' });

    const result = await LocaleLayout({ children: 'content', params });

    expect(result).toBe('content');
    expect(navigation.notFound).not.toHaveBeenCalled();
  });

  it('合法 locale en 正常透传 children', async () => {
    const params = Promise.resolve({ locale: 'en' });

    const result = await LocaleLayout({ children: 'content', params });

    expect(result).toBe('content');
    expect(navigation.notFound).not.toHaveBeenCalled();
  });
});
