import type { Metadata } from 'next';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import { GoogleAdsense } from '@/components/GoogleAdsense';

export const metadata: Metadata = {
  title: {
    default: '山维空间 - Meathill 的技术博客',
    template: '%s | 山维空间',
  },
  description:
    '19年+ 全栈开发经验，热衷于构建有用的产品和分享技术知识。专注于 Vue.js、React、Node.js、TypeScript 等现代前端技术。',
  keywords: ['前端开发', '全栈开发', 'Vue.js', 'React', 'Node.js', 'TypeScript', '技术博客'],
  authors: [{ name: 'Meathill', url: 'https://meathill.com' }],
  creator: 'Meathill',
  metadataBase: new URL('https://meathill.com'),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://meathill.com',
    siteName: '山维空间',
    title: '山维空间 - Meathill 的技术博客',
    description: '19年+ 全栈开发经验，热衷于构建有用的产品和分享技术知识。',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '山维空间 - Meathill 的技术博客',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@meathill1',
    title: '山维空间 - Meathill 的技术博客',
    description: '19年+ 全栈开发经验，热衷于构建有用的产品和分享技术知识。',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale || 'zh'} className="antialiased">
      <head>
        <link rel="icon" href="/favicon.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/favicon.webp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>

      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <GoogleAdsense />
      </body>
      <GoogleAnalytics gaId="G-1S0T1HF97B" />
    </html>
  );
}
