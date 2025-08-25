import * as React from 'react';

import { IconArchive, IconBoxSeam, IconBuildingStore, IconChartHistogram, IconHelpCircle, IconHome2, IconReceipt2, IconSettings2, IconUsersGroup } from '@tabler/icons-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

import { Link } from 'react-router';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: IconHome2,
    },
    {
      title: 'Orders',
      url: '/dashboard/orders',
      icon: IconReceipt2,
    },
    {
      title: 'Products',
      url: '/dashboard/products',
      icon: IconBoxSeam,
    },
    {
      title: 'Inventory',
      url: '/dashboard/inventory',
      icon: IconArchive,
    },
    {
      title: 'Customers',
      url: '/dashboard/customers',
      icon: IconUsersGroup,
    },
    {
      title: 'Analytics',
      url: '/dashboard/analytics',
      icon: IconChartHistogram,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: IconSettings2,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/dashboard">
                <IconBuildingStore className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
