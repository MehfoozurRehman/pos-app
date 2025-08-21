import { IconCirclePlusFilled, type Icon } from '@tabler/icons-react';

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Link, useLocation, useNavigate } from 'react-router';

export function NavMain({ items }: { items: { title: string; url: string; icon?: Icon }[] }) {
  const navigate = useNavigate();

  const { pathname } = useLocation();

  const isActive = (url: string) => {
    return pathname === url;
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2 mb-3">
            <SidebarMenuButton
              onClick={() => navigate('/dashboard')}
              tooltip="New Order"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>New Order</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild className={isActive(item.url) ? 'bg-muted text-primary-muted' : ''}>
                <Link to={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
