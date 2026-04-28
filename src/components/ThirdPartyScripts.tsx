'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const DEFAULT_DELAY_MS = 4000;
const HOME_ANALYTICS_DELAY_MS = 6000;
const HOME_ADSENSE_DELAY_MS = 12000;
const USER_INTENT_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

export function shouldSkipThirdPartyScripts(pathname: string): boolean {
  return /(^|\/)admin(\/|$)/.test(pathname);
}

export function isHomePagePath(pathname: string): boolean {
  return pathname === '/' || pathname === '/en';
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
  const [isAdsenseReady, setIsAdsenseReady] = useState(false);
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);
  const [hasHomeAdsenseDelayElapsed, setHasHomeAdsenseDelayElapsed] = useState(false);
  const adsenseScriptSrc = getAdsenseScriptSrc();
  const shouldSkip = shouldSkipThirdPartyScripts(pathname);
  const isHomePage = isHomePagePath(pathname);

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

  useEffect(() => {
    if (shouldSkip || !isHomePage) {
      setHasScrolledPastHero(false);
      return;
    }

    if (hasScrolledPastHero) {
      return;
    }

    function removeScrollListener() {
      window.removeEventListener('scroll', onScrollPastHero);
    }

    function onScrollPastHero() {
      if (window.scrollY < Math.max(320, window.innerHeight * 0.65)) {
        return;
      }

      setHasScrolledPastHero(true);
      removeScrollListener();
    }

    window.addEventListener('scroll', onScrollPastHero, { passive: true });
    onScrollPastHero();

    return () => {
      removeScrollListener();
    };
  }, [hasScrolledPastHero, isHomePage, shouldSkip]);

  useEffect(() => {
    if (shouldSkip) {
      setIsAdsenseReady(false);
      return;
    }

    if (!adsenseScriptSrc) {
      setIsAdsenseReady(false);
      return;
    }

    if (isHomePage) {
      return;
    }

    setIsAdsenseReady(isAnalyticsReady);
  }, [adsenseScriptSrc, isAnalyticsReady, isHomePage, shouldSkip]);

  useEffect(() => {
    if (shouldSkip || !isHomePage) {
      setHasHomeAdsenseDelayElapsed(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setHasHomeAdsenseDelayElapsed(true);
    }, HOME_ADSENSE_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isHomePage, shouldSkip]);

  useEffect(() => {
    if (shouldSkip) {
      setIsAdsenseReady(false);
      return;
    }

    if (!adsenseScriptSrc) {
      setIsAdsenseReady(false);
      return;
    }

    if (!isHomePage) {
      return;
    }

    if (!isAnalyticsReady) {
      setIsAdsenseReady(false);
      return;
    }

    setIsAdsenseReady(hasScrolledPastHero || hasHomeAdsenseDelayElapsed);
  }, [adsenseScriptSrc, hasHomeAdsenseDelayElapsed, hasScrolledPastHero, isAnalyticsReady, isHomePage, shouldSkip]);

  if (shouldSkip) {
    return null;
  }

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
