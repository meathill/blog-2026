import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let currentPathname = '/en/posts/css/example';
const renderedScriptSrcs: string[] = [];

interface MockScriptProps extends React.ScriptHTMLAttributes<HTMLScriptElement> {
  strategy?: 'afterInteractive' | 'beforeInteractive' | 'lazyOnload' | 'worker';
}

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
}));

vi.mock('next/script', () => ({
  default: function MockScript({ strategy, children, ...rest }: MockScriptProps) {
    if (typeof rest.src === 'string') {
      renderedScriptSrcs.push(rest.src);
    }
    return (
      <script data-strategy={strategy} {...rest}>
        {children}
      </script>
    );
  },
}));

import ThirdPartyScripts, {
  isHomePagePath,
  shouldShowAds,
  shouldSkipThirdPartyScripts,
} from '@/components/ThirdPartyScripts';

describe('ThirdPartyScripts', () => {
  const originalAdsenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

  beforeEach(() => {
    vi.useFakeTimers();
    currentPathname = '/en/posts/css/example';
    renderedScriptSrcs.length = 0;
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
    renderedScriptSrcs.length = 0;
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    vi.clearAllTimers();
    vi.useRealTimers();
    if (originalAdsenseId) {
      process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID = originalAdsenseId;
    } else {
      delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;
    }
  });

  it('应正确判断 admin / 首页 / 广告投放路径', () => {
    expect(shouldSkipThirdPartyScripts('/admin')).toBe(true);
    expect(shouldSkipThirdPartyScripts('/en/admin/navigation')).toBe(true);
    expect(shouldSkipThirdPartyScripts('/login')).toBe(true);
    expect(shouldSkipThirdPartyScripts('/en/login')).toBe(true);
    expect(shouldSkipThirdPartyScripts('/en/posts/admin-guide')).toBe(false);

    expect(isHomePagePath('/')).toBe(true);
    expect(isHomePagePath('/en')).toBe(true);
    expect(isHomePagePath('/en/posts/css/example')).toBe(false);

    // 广告仅投放博客内容页
    expect(shouldShowAds('/posts')).toBe(true);
    expect(shouldShowAds('/en/posts/css/example')).toBe(true);
    expect(shouldShowAds('/category/js')).toBe(true);
    expect(shouldShowAds('/en/tag/memory')).toBe(true);
    expect(shouldShowAds('/search')).toBe(true);
    // 公司站页面不投放
    expect(shouldShowAds('/')).toBe(false);
    expect(shouldShowAds('/en')).toBe(false);
    expect(shouldShowAds('/about')).toBe(false);
    expect(shouldShowAds('/en/app')).toBe(false);
    expect(shouldShowAds('/solutions')).toBe(false);
  });

  it('初次渲染不应立即注入第三方脚本', () => {
    render(<ThirdPartyScripts />);

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();
    expect(document.querySelector('script[src*="pagead2.googlesyndication.com"]')).toBeNull();
  });

  it('博客页用户交互后应同时加载 GA 与 Adsense', () => {
    currentPathname = '/en/posts/css/example';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID = 'ca-pub-test';
    render(<ThirdPartyScripts />);

    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
      vi.runAllTimers();
    });

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeInTheDocument();
    expect(renderedScriptSrcs.some((src) => src.includes('pagead2.googlesyndication.com'))).toBe(true);
    expect(document.querySelector('#google-analytics-init')).toBeInTheDocument();
  });

  it('博客页超时 4 秒后应自动加载 GA', () => {
    currentPathname = '/en/posts/css/example';
    render(<ThirdPartyScripts />);

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeInTheDocument();
  });

  it('首页应加载 GA 但不投放 Adsense', () => {
    currentPathname = '/';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID = 'ca-pub-test';
    render(<ThirdPartyScripts />);

    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
      vi.runAllTimers();
    });

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeInTheDocument();
    expect(document.querySelector('script[src*="pagead2.googlesyndication.com"]')).toBeNull();
  });

  it('公司站页面（如 /en/about）应加载 GA 但不投放 Adsense', () => {
    currentPathname = '/en/about';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID = 'ca-pub-test';
    render(<ThirdPartyScripts />);

    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
      vi.runAllTimers();
    });

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeInTheDocument();
    expect(document.querySelector('script[src*="pagead2.googlesyndication.com"]')).toBeNull();
  });
});
