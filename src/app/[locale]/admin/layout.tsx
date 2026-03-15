import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/admin/AppSidebar';
import '@blocknote/core/style.css';
import '@blocknote/shadcn/style.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="flex items-center p-4 border-b">
          <SidebarTrigger />
          <div className="ml-4 flex items-center justify-between w-full">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div className="text-sm text-zinc-500">Welcome, {session.user.name}</div>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </main>
    </SidebarProvider>
  );
}
