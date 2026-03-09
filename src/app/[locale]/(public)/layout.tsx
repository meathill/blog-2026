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
