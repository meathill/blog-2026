import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Toaster } from 'sonner';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/admin/AppSidebar';
import '@blocknote/core/style.css';
import '@blocknote/shadcn/style.css';
import './admin.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <>
      <style>{`ins.adsbygoogle,[id^="aswift_"],iframe[src*="googlesyndication"],iframe[src*="googleads"]{display:none !important;}`}</style>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b border-border px-4">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <span className="text-sm font-medium text-foreground">Admin</span>
            <span className="ml-auto text-sm text-muted-foreground">{session.user.name}</span>
          </header>
          <div className="p-6">{children}</div>
        </SidebarInset>
        <Toaster position="bottom-right" richColors />
      </SidebarProvider>
    </>
  );
}
