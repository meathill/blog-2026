import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThirdPartyScripts, { shouldSkipThirdPartyScripts } from '@/components/ThirdPartyScripts';

interface MockScriptProps extends React.ScriptHTMLAttributes<HTMLScriptElement> {
  strategy?: 'afterInteractive' | 'beforeInteractive' | 'lazyOnload' | 'worker';
}

vi.mock('next/script', () => ({
  default: function MockScript({ strategy, children, ...rest }: MockScriptProps) {
    return (
      <script data-strategy={strategy} {...rest}>
        {children}
      </script>
    );
  },
}));

describe('ThirdPartyScripts', () => {
  const originalAdsenseId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    if (originalAdsenseId) {
      process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID = originalAdsenseId;
      return;
    }
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;
  });

  it('应正确判断是否跳过第三方脚本', () => {
    expect(shouldSkipThirdPartyScripts('/admin')).toBe(true);
    expect(shouldSkipThirdPartyScripts('/en/admin/navigation')).toBe(true);
    expect(shouldSkipThirdPartyScripts('/en/posts/css/example')).toBe(false);
    expect(shouldSkipThirdPartyScripts('/en/posts/admin-guide')).toBe(false);
  });

  it('初次渲染不应立即注入第三方脚本', () => {
    render(<ThirdPartyScripts />);

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();
    expect(document.querySelector('script[src*="pagead2.googlesyndication.com"]')).toBeNull();
  });

  it('用户交互后应加载 GA 与 Adsense 脚本', () => {
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID = 'ca-pub-test';
    render(<ThirdPartyScripts />);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    act(() => {
      window.dispatchEvent(new Event('pointerdown'));
      vi.runAllTimers();
    });

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeInTheDocument();
    expect(document.querySelector('script[src*="pagead2.googlesyndication.com"]')).toBeInTheDocument();
    expect(document.querySelector('#google-analytics-init')).toBeInTheDocument();
  });

  it('超时后应自动加载 GA 脚本', () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;
    render(<ThirdPartyScripts />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeInTheDocument();
  });
});
