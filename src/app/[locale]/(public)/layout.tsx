import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getFooterNavigation, getHeaderNavigation } from '@/actions/navigation';

export default async function PublicLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const navItems = await getHeaderNavigation(locale);
  const footerNavItems = await getFooterNavigation(locale);

  return (
    <>
      <Header initialNavItems={navItems} />
      <main className="min-h-screen">{children}</main>
      <Footer initialNavItems={footerNavItems} />
    </>
  );
}
