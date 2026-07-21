import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { SITE_URL } from '../../src/lib/constants';
import { buildRootMetadata } from '../../src/lib/seo/root-metadata';

// 根 layout 位于 [locale] 段之外，locale 只能来自 getLocale()（middleware 头）
// 回归背景：曾因读 params.locale（恒 undefined）导致 /en 页面渲染 <html lang="zh">
const getLocaleMock = vi.fn<() => Promise<string>>();

vi.mock('next-intl/server', () => ({
  getLocale: () => getLocaleMock(),
  getMessages: async () => ({ LocaleSwitcher: {} }),
}));
vi.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: ReactNode }) => children,
}));
// routing.ts 会经 createNavigation 拉入 next/navigation，vitest 下 ESM 解析失败，mock 掉
vi.mock('next-intl/navigation', () => ({
  createNavigation: () => ({}),
}));
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'font-inter' }),
}));
vi.mock('../../src/components/ThirdPartyScripts', () => ({ default: () => null }));

import RootLayout, { generateMetadata } from '../../src/app/layout';

describe('RootLayout html lang', () => {
  it('en 请求渲染 <html lang="en">', async () => {
    getLocaleMock.mockResolvedValue('en');
    const html = renderToStaticMarkup(await RootLayout({ children: null }));
    expect(html).toContain('<html lang="en">');
  });

  it('zh 请求渲染 <html lang="zh">', async () => {
    getLocaleMock.mockResolvedValue('zh');
    const html = renderToStaticMarkup(await RootLayout({ children: null }));
    expect(html).toContain('<html lang="zh">');
  });
});

describe('RootLayout generateMetadata', () => {
  it('en 请求返回英文 title/description，OG locale 为 en_US、url 为 /en', async () => {
    getLocaleMock.mockResolvedValue('en');
    const metadata = await generateMetadata();
    expect(metadata.title).toMatchObject({ template: '%s | Meathill LLC' });
    expect((metadata.title as { default: string }).default).toMatch(/Full-stack Engineering/);
    expect(metadata.description).toMatch(/20\+ years of full-stack experience/);
    expect(metadata.openGraph?.locale).toBe('en_US');
    expect(metadata.openGraph?.url).toBe(`${SITE_URL}/en`);
  });

  it('zh 请求返回中文 title/description，OG locale 为 zh_CN、url 为站点根', async () => {
    getLocaleMock.mockResolvedValue('zh');
    const metadata = await generateMetadata();
    expect((metadata.title as { default: string }).default).toContain('全栈工程');
    expect(metadata.description).toContain('20+ 年全栈开发经验');
    expect(metadata.openGraph?.locale).toBe('zh_CN');
    expect(metadata.openGraph?.url).toBe(SITE_URL);
  });
});

describe('buildRootMetadata locale 兜底', () => {
  it('未知或缺失 locale 回退默认语言 zh', () => {
    for (const locale of [undefined, 'fr']) {
      const metadata = buildRootMetadata(locale);
      expect(metadata.openGraph?.locale).toBe('zh_CN');
      expect(metadata.description).toContain('20+ 年全栈开发经验');
    }
  });
});
