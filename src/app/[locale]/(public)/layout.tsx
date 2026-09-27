import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getCachedFooterNavigation, getCachedHeaderNavigation } from '@/lib/public-navigation';

export default async function PublicLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  // ISR：Header/Footer 里的 getTranslations() 不带 locale，必须先注入，否则会退回读请求头（→ 动态渲染）
  setRequestLocale(locale);
  const navItems = await getCachedHeaderNavigation(locale);
  const footerNavItems = await getCachedFooterNavigation(locale);

  return (
    <>
      <Header navItems={navItems} />
      <main className="min-h-screen">{children}</main>
      <Footer navItems={footerNavItems} />
    </>
  );
}
