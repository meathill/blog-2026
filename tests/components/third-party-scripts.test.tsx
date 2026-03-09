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

import ThirdPartyScripts, { isHomePagePath, shouldSkipThirdPartyScripts } from '@/components/ThirdPartyScripts';

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

  it('应正确判断 admin 与首页路径', () => {
    expect(shouldSkipThirdPartyScripts('/admin')).toBe(true);
    expect(shouldSkipThirdPartyScripts('/en/admin/navigation')).toBe(true);
    expect(shouldSkipThirdPartyScripts('/en/posts/admin-guide')).toBe(false);
    expect(isHomePagePath('/')).toBe(true);
    expect(isHomePagePath('/en')).toBe(true);
    expect(isHomePagePath('/en/posts/css/example')).toBe(false);
  });

  it('初次渲染不应立即注入第三方脚本', () => {
    render(<ThirdPartyScripts />);

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();
    expect(document.querySelector('script[src*="pagead2.googlesyndication.com"]')).toBeNull();
  });

  it('非首页用户交互后应同时加载 GA 与 Adsense', () => {
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

  it('非首页超时 4 秒后应自动加载 GA', () => {
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

  it('首页应先加载 GA，滚过 Hero 后再加载 Adsense', async () => {
    currentPathname = '/';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID = 'ca-pub-test';
    render(<ThirdPartyScripts />);

    await act(async () => {
      window.dispatchEvent(new Event('pointerdown'));
      await Promise.resolve();
    });

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeInTheDocument();
    expect(document.querySelector('script[src*="pagead2.googlesyndication.com"]')).toBeNull();

    await act(async () => {
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: 560,
        writable: true,
      });
      window.dispatchEvent(new Event('scroll'));
      await Promise.resolve();
    });

    expect(renderedScriptSrcs.some((src) => src.includes('pagead2.googlesyndication.com'))).toBe(true);
  });

  it('首页应按更长超时依次加载 GA 与 Adsense', async () => {
    currentPathname = '/en';
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID = 'ca-pub-test';
    render(<ThirdPartyScripts />);

    await act(async () => {
      vi.advanceTimersByTime(5999);
      await Promise.resolve();
    });
    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeInTheDocument();
    expect(document.querySelector('script[src*="pagead2.googlesyndication.com"]')).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(5999);
      await Promise.resolve();
    });
    expect(document.querySelector('script[src*="pagead2.googlesyndication.com"]')).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(renderedScriptSrcs.some((src) => src.includes('pagead2.googlesyndication.com'))).toBe(true);
  });
});
