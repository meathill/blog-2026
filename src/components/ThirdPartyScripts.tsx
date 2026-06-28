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
