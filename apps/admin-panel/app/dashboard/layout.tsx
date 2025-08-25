import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { AppSidebar } from '@/components/app-sidebar';
import { COOKIE_TOKEN } from '@/config';
import { SiteHeader } from '@/components/site-header';
import { api } from '@/convex/_generated/api';
import { cookies } from 'next/headers';
import { fetchMutation } from 'convex/nextjs';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookie = await cookies();

  const token = cookie.get(COOKIE_TOKEN)?.value;

  if (!token) {
    return redirect('/?error=unauthorized');
  }

  const validUser = await fetchMutation(api.auth.validateUser, { id: token });

  if (!validUser) {
    return redirect('/?error=token_invalid');
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
