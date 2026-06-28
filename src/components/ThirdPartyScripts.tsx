'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const DEFAULT_DELAY_MS = 4000;
const HOME_ANALYTICS_DELAY_MS = 6000;
const USER_INTENT_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

export function shouldSkipThirdPartyScripts(pathname: string): boolean {
  return /(^|\/)(admin|login)(\/|$)/.test(pathname);
}

export function isHomePagePath(pathname: string): boolean {
  return pathname === '/' || pathname === '/en';
}

/**
 * 是否在该页面投放广告（Adsense）。
 * 仅博客内容页投放：文章、分类、标签、站内搜索。
 * 公司站页面（首页 / 方案 / 产品 / 关于 等）不投放。
 * 工具类广告在独立站 tools.meathill.com，不在本仓库。
 */
export function shouldShowAds(pathname: string): boolean {
  const path = pathname.replace(/^\/(en|zh)(?=\/|$)/, '') || '/';
  return /^\/(posts|category|tag|search)(\/|$)/.test(path);
}

const HIDE_ADS_STYLE_ID = 'mh-hide-ads';
// Adsense（含 auto ads / 锚定 / 插页）注入的容器选择器
const ADS_ELEMENT_SELECTOR =
  'ins.adsbygoogle,.adsbygoogle,.google-auto-placed,ins.adsbygoogle[data-anchor-status],iframe[id^="aswift_"],div[id^="google_ads_iframe"]';

/**
 * 在不投放广告的页面隐藏 Adsense 注入的元素。
 * 用可切换的 <style> 而非一次性 querySelectorAll：SPA 切换后 auto ads 可能异步注入，
 * CSS 规则能覆盖「切换之后才出现」的广告容器；回到博客页时移除规则即恢复展示。
 */
function setAdsHidden(hidden: boolean): void {
  if (typeof document === 'undefined') {
    return;
  }
  const existing = document.getElementById(HIDE_ADS_STYLE_ID);
  if (!hidden) {
    existing?.remove();
    return;
  }
  if (existing) {
    return;
  }
  const style = document.createElement('style');
  style.id = HIDE_ADS_STYLE_ID;
  style.textContent = `${ADS_ELEMENT_SELECTOR}{display:none !important;}`;
  document.head.appendChild(style);
}

function getAdsenseScriptSrc(): string | null {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID;
  if (!clientId) {
    return null;
  }

  return `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
}

export default function ThirdPartyScripts() {
  const pathname = usePathname();
  const [isAnalyticsReady, setIsAnalyticsReady] = useState(false);
  const adsenseScriptSrc = getAdsenseScriptSrc();
  const shouldSkip = shouldSkipThirdPartyScripts(pathname);
  const isHomePage = isHomePagePath(pathname);
  const adsEnabled = shouldShowAds(pathname);

  useEffect(() => {
    if (shouldSkip) {
      setIsAnalyticsReady(false);
      return;
    }

    let isDisposed = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function removeListeners() {
      for (const eventName of USER_INTENT_EVENTS) {
        window.removeEventListener(eventName, onUserIntent);
      }
    }

    function clearTimeoutTask() {
      if (timeoutId === null) {
        return;
      }
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    function markReadyToLoad() {
      if (isDisposed) {
        return;
      }

      setIsAnalyticsReady(true);
      removeListeners();
      clearTimeoutTask();
    }

    function onUserIntent() {
      markReadyToLoad();
    }

    for (const eventName of USER_INTENT_EVENTS) {
      window.addEventListener(eventName, onUserIntent, { passive: true });
    }

    timeoutId = setTimeout(markReadyToLoad, isHomePage ? HOME_ANALYTICS_DELAY_MS : DEFAULT_DELAY_MS);

    return () => {
      isDisposed = true;
      removeListeners();
      clearTimeoutTask();
    };
  }, [isHomePage, shouldSkip]);

  // 路由切换时同步广告可见性：非博客页隐藏已注入/将注入的 <ins> 等广告容器
  useEffect(() => {
    setAdsHidden(!adsEnabled);
  }, [adsEnabled]);

  if (shouldSkip) {
    return null;
  }

  // 广告仅在博客内容页、且分析脚本就绪后加载
  const isAdsenseReady = adsEnabled && isAnalyticsReady && Boolean(adsenseScriptSrc);

  return (
    <>
      {isAnalyticsReady ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}');`}
          </Script>
        </>
      ) : null}
      {adsenseScriptSrc && isAdsenseReady ? (
        <Script async src={adsenseScriptSrc} crossOrigin="anonymous" strategy="afterInteractive" />
      ) : null}
    </>
  );
}
