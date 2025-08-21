import { ModeToggle } from './mode-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLocation } from 'react-router';

export function Header() {
  const { pathname } = useLocation();

  const pageName = pathname === '/dashboard' ? 'Dashboard' : (pathname.split('/').pop() || '').replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-base font-medium">{pageName}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
