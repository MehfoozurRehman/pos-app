import { Card, CardContent } from '@renderer/components/ui/card';
import { Package, Plus } from 'lucide-react';

import { Button } from '@renderer/components/ui/button';
import { Inventory } from 'src/types';
import { InventoryCard } from './inventory-card';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface EnrichedInventory extends Inventory {
  productName: string;
  productImage: string;
  productCategories: string[];
}

interface InventoryGridProps {
  filteredInventory: EnrichedInventory[];
  searchQuery: string;
  selectedProduct: string;
  onEdit: (item: Inventory) => void;
  onDelete: (item: Inventory) => void;
  onCreateInventory: () => void;
}

export function InventoryGrid({ 
  filteredInventory, 
  searchQuery, 
  selectedProduct, 
  onEdit, 
  onDelete, 
  onCreateInventory 
}: InventoryGridProps) {
  const [parent] = useAutoAnimate();

  return (
    <div ref={parent} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {filteredInventory.length === 0 ? (
        <div className="col-span-full">
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No inventory items found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedProduct !== 'All' 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first inventory item'
                }
              </p>
              {!searchQuery && selectedProduct === 'All' && (
                <Button onClick={onCreateInventory}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        filteredInventory.map((item) => (
          <InventoryCard 
            key={item.id} 
            item={item} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))
      )}
    </div>
  );
}
