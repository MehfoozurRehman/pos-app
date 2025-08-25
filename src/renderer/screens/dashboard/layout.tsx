import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@renderer/components/header';
import { Outlet } from 'react-router';

export default function Layout() {
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
        <Header />
        <div className="flex w-full flex-col flex-1 min-h-0 max-h-[calc(100vh-68px)] overflow-y-auto style-scrollbar">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
