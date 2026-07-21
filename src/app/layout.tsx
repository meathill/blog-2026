import type { Metadata } from 'next';
import './globals.css';
import ThirdPartyScripts from '@/components/ThirdPartyScripts';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { buildRootMetadata } from '@/lib/seo/root-metadata';

// 根 layout 在 [locale] 段之外，params 拿不到 locale（恒 undefined），
// 必须用 getLocale()（读取 middleware 写入的 X-NEXT-INTL-LOCALE 头）
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildRootMetadata(locale);
}

// 客户端只需要这些 namespace，其余仅服务端使用
const CLIENT_NAMESPACES = ['LocaleSwitcher'] as const;

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const allMessages = await getMessages();
  // 只传客户端需要的 namespace，减少 hydration payload
  const messages = Object.fromEntries(
    CLIENT_NAMESPACES.filter((ns) => ns in allMessages).map((ns) => [ns, allMessages[ns]]),
  );

  return (
    <html lang={locale}>
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
