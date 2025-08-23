import { Button } from '@/components/ui/button';
import { ModeToggle } from './mode-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { useCallback } from 'react';
import { useLocation } from 'react-router';

export function Header() {
  const { pathname } = useLocation();

  const pageName = pathname === '/dashboard' ? 'Dashboard' : (pathname.split('/').pop() || '').replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  const handleGetChanges = useCallback(async () => {
    try {
      const changes = await window.api.db.changesSince(new Date(0).toISOString());
      console.log('db changes', changes);
      toast.success(`Found ${Array.isArray(changes) ? changes.length : 0} change(s). See console for details.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch changes. See console for details.');
    }
  }, []);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-4">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-base font-medium">{pageName}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGetChanges}>
            Get Changes
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
