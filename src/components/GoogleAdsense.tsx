'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

export function GoogleAdsense() {
  const pathname = usePathname();

  if (pathname.includes('/admin')) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
