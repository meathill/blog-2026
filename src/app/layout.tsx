import type { Metadata } from 'next';
import './globals.css';
import ThirdPartyScripts from '@/components/ThirdPartyScripts';

export const metadata: Metadata = {
  title: {
    default: 'Meathill LLC — 全栈工程 · Cloudflare · AI 应用',
    template: '%s | Meathill LLC',
  },
  description:
    'Meathill LLC：19 年+ 全栈开发经验的一人公司，远程交付。专注 Cloudflare 全栈架构与迁移、AI 应用与计费系统、React Native 跨端开发。',
  keywords: ['Meathill LLC', '全栈开发', 'Cloudflare', 'Next.js', 'AI 应用', '计费系统', 'React Native', '远程开发'],
  authors: [{ name: 'Meathill', url: 'https://meathill.com' }],
  creator: 'Meathill',
  metadataBase: new URL('https://meathill.com'),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://meathill.com',
    siteName: 'Meathill LLC',
    title: 'Meathill LLC — 全栈工程 · Cloudflare · AI 应用',
    description: '19 年+ 全栈开发经验的一人公司，远程交付。专注 Cloudflare 全栈、AI 应用与计费、跨端开发。',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Meathill LLC',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@meathill1',
    title: 'Meathill LLC — 全栈工程 · Cloudflare · AI 应用',
    description: '19 年+ 全栈开发经验的一人公司，远程交付。专注 Cloudflare 全栈、AI 应用与计费、跨端开发。',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

// 客户端只需要这些 namespace，其余仅服务端使用
const CLIENT_NAMESPACES = ['LocaleSwitcher'] as const;
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}>) {
  const { locale } = await params;
  const allMessages = await getMessages();
  // 只传客户端需要的 namespace，减少 hydration payload
  const messages = Object.fromEntries(
    CLIENT_NAMESPACES.filter((ns) => ns in allMessages).map((ns) => [ns, allMessages[ns]]),
  );

  return (
    <html lang={locale || 'zh'}>
      <head>
        <link rel="icon" href="/favicon.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/favicon.webp" />
      </head>

      <body className={`antialiased ${inter.className}`}>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <ThirdPartyScripts />
      </body>
    </html>
  );
}
