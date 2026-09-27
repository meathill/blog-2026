import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SITE_URL } from '../../src/lib/constants';
import { buildRootMetadata } from '../../src/lib/seo/root-metadata';

// ISR 改造（2026-09-27）：<html>/<body> 从 app/layout.tsx 挪到 app/[locale]/layout.tsx，
// locale 取自 params 并 setRequestLocale，不再用 getLocale()（读 middleware 头 → 全站被迫动态渲染）。
// 回归背景：曾因根 layout 读 params.locale（恒 undefined）导致 /en 页面渲染 <html lang="zh">。
const setRequestLocaleMock = vi.fn();
const getLocaleMock = vi.fn();

vi.mock('next-intl/server', () => ({
  getLocale: () => getLocaleMock(),
  getMessages: async () => ({ LocaleSwitcher: {} }),
  setRequestLocale: (locale: string) => setRequestLocaleMock(locale),
}));
vi.mock('next-intl', () => ({
  hasLocale: (locales: readonly string[], locale: string) => locales.includes(locale),
  NextIntlClientProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));
// routing.ts 会经 createNavigation 拉入 next/navigation，vitest 下 ESM 解析失败，mock 掉
vi.mock('next-intl/navigation', () => ({
  createNavigation: () => ({}),
}));
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'font-inter' }),
}));
vi.mock('../../src/components/ThirdPartyScripts', () => ({ default: () => null }));

import RootLayout from '../../src/app/layout';
import LocaleLayout, { generateMetadata } from '../../src/app/[locale]/layout';

const params = (locale: string) => Promise.resolve({ locale });

describe('LocaleLayout html lang', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('en 渲染 <html lang="en"> 并注入 request locale', async () => {
    const html = renderToStaticMarkup(await LocaleLayout({ children: null, params: params('en') }));
    expect(html).toContain('<html lang="en">');
    expect(setRequestLocaleMock).toHaveBeenCalledWith('en');
  });

  it('zh 渲染 <html lang="zh">', async () => {
    const html = renderToStaticMarkup(await LocaleLayout({ children: null, params: params('zh') }));
    expect(html).toContain('<html lang="zh">');
    expect(setRequestLocaleMock).toHaveBeenCalledWith('zh');
  });

  it('不读请求头（getLocale），否则全站无法 ISR', async () => {
    await LocaleLayout({ children: null, params: params('en') });
    expect(getLocaleMock).not.toHaveBeenCalled();
  });
});

describe('RootLayout', () => {
  it('只透传 children，不调用任何 next-intl 请求 API', () => {
    expect(RootLayout({ children: 'content' })).toBe('content');
    expect(getLocaleMock).not.toHaveBeenCalled();
  });
});

describe('LocaleLayout generateMetadata', () => {
  it('en 返回英文 title/description，OG locale 为 en_US、url 为 /en', async () => {
    const metadata = await generateMetadata({ params: params('en') });
    expect(metadata.title).toMatchObject({ template: '%s | Meathill Studio' });
    expect((metadata.title as { default: string }).default).toMatch(/Full-stack Engineering/);
    expect(metadata.description).toMatch(/20\+ years of full-stack experience/);
    expect(metadata.openGraph?.locale).toBe('en_US');
    expect(metadata.openGraph?.url).toBe(`${SITE_URL}/en`);
  });

  it('zh 返回中文 title/description，OG locale 为 zh_CN、url 为站点根', async () => {
    const metadata = await generateMetadata({ params: params('zh') });
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
