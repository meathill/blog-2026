import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import ThirdPartyScripts from '@/components/ThirdPartyScripts';
import { routing } from '@/i18n/routing';
import { buildRootMetadata } from '@/lib/seo/root-metadata';

// 站点根 layout（<html>/<body>）放在 [locale] 段：locale 来自 params 并经 setRequestLocale 注入，
// 下游 getTranslations()/getLocale() 不再读 middleware 头（headers()），页面才能走 ISR 缓存。
// middleware 的 matcher 排除了 .xml/.png/.css 等扩展名结尾的路径（见 src/middleware.ts），
// 这类请求（如 /news-sitemap.xml）不经过 middleware 注入合法 locale，
// 直接落进这个动态段，[locale] 会变成 "news-sitemap.xml" 这种非法值。
// 在这里统一校验，非法 locale 一律 404，避免以 200 渲染中文首页（软 404 + 重复内容）。

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({ params }: Pick<LocaleLayoutProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  return buildRootMetadata(locale);
}

// 客户端只需要这些 namespace，其余仅服务端使用
const CLIENT_NAMESPACES = ['LocaleSwitcher'] as const;

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

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
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
        <ThirdPartyScripts />
      </body>
    </html>
  );
}
