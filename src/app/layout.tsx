import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
import ThirdPartyScripts from '@/components/ThirdPartyScripts';

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
    <html lang={locale || 'zh'} className="antialiased">
      <head>
        <link rel="icon" href="/favicon.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/favicon.webp" />
      </head>

      <body className={`antialiased ${inter.className}`}>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <Toaster position="bottom-right" richColors />
        <ThirdPartyScripts />
      </body>
    </html>
  );
}
