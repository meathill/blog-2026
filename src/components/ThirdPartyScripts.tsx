'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const GOOGLE_ANALYTICS_ID = 'G-1S0T1HF97B';
const DEFER_LOAD_TIMEOUT_MS = 4000;
const USER_INTENT_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

export function shouldSkipThirdPartyScripts(pathname: string): boolean {
  return /(^|\/)admin(\/|$)/.test(pathname);
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
  const [isReadyToLoad, setIsReadyToLoad] = useState(false);
  const adsenseScriptSrc = getAdsenseScriptSrc();
  const shouldSkip = shouldSkipThirdPartyScripts(pathname);

  useEffect(() => {
    if (shouldSkip) {
      setIsReadyToLoad(false);
      return;
    }

    let isDisposed = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleCallbackId: number | null = null;

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

    function clearIdleTask() {
      if (idleCallbackId === null || typeof window.cancelIdleCallback !== 'function') {
        return;
      }
      window.cancelIdleCallback(idleCallbackId);
      idleCallbackId = null;
    }

    function markReadyToLoad() {
      if (isDisposed) {
        return;
      }

      setIsReadyToLoad(true);
      removeListeners();
      clearTimeoutTask();
      clearIdleTask();
    }

    function onUserIntent() {
      markReadyToLoad();
    }

    for (const eventName of USER_INTENT_EVENTS) {
      window.addEventListener(eventName, onUserIntent, { passive: true });
    }

    timeoutId = setTimeout(markReadyToLoad, DEFER_LOAD_TIMEOUT_MS);

    if (typeof window.requestIdleCallback === 'function') {
      idleCallbackId = window.requestIdleCallback(markReadyToLoad, {
        timeout: DEFER_LOAD_TIMEOUT_MS,
      });
    }

    return () => {
      isDisposed = true;
      removeListeners();
      clearTimeoutTask();
      clearIdleTask();
    };
  }, [shouldSkip]);

  if (shouldSkip || !isReadyToLoad) {
    return null;
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_ID}');`}
      </Script>
      {adsenseScriptSrc ? (
        <Script async src={adsenseScriptSrc} crossOrigin="anonymous" strategy="afterInteractive" />
      ) : null}
    </>
  );
}
