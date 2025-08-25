import { Button } from '@renderer/components/ui/button';
import { Package, Plus } from 'lucide-react';

interface InventoryHeaderProps {
  onCreateInventory: () => void;
}

export function InventoryHeader({ onCreateInventory }: InventoryHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" />
          Inventory
        </h1>
        <p className="text-muted-foreground">Manage your inventory with barcode tracking</p>
      </div>
      <Button onClick={onCreateInventory}>
        <Plus className="w-4 h-4 mr-2" />
        Add Item
      </Button>
    </div>
  );
}
