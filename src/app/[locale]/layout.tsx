import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

// middleware 的 matcher 排除了 .xml/.png/.css 等扩展名结尾的路径（见 src/middleware.ts），
// 这类请求（如 /news-sitemap.xml）不经过 middleware 注入合法 locale，
// 直接落进这个动态段，[locale] 会变成 "news-sitemap.xml" 这种非法值。
// 在这里统一校验，非法 locale 一律 404，避免以 200 渲染中文首页（软 404 + 重复内容）。
export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return children;
}
