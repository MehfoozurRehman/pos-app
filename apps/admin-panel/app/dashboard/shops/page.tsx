import { Button } from '@/components/ui/button';
import { CreateShopSheet } from './components/create-shop-sheet';
import { Plus } from 'lucide-react';
import { ShopsTable } from './components/shops-table';

export default async function ShopsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shops</h1>
          <p className="text-muted-foreground">Manage your shops and their settings</p>
        </div>
        <CreateShopSheet>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Shop
          </Button>
        </CreateShopSheet>
      </div>
      <ShopsTable />
    </div>
  );
}
