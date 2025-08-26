import { Card, CardContent } from '@renderer/components/ui/card';
import { InventoryFilters, InventoryForm, InventoryGrid, InventoryHeader } from './components';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Inventory } from 'src/types';
import { logger } from '@renderer/utils/logger';
import { toast } from 'sonner';
import useShop from '@/hooks/use-shop';

type InventoryFormData = {
  productId: string;
  barcode: string;
  quantity: number;
  actualPrice: number;
  sellingPrice: number;
};

export default function InventoryPage() {
  const { inventoryMode } = useShop();

  const { data: inventory, error } = useSWR('inventory', () => window.api.db.get('inventory'));

  const { data: products } = useSWR('products', () => window.api.db.get('products'));

  const [searchQuery, setSearchQuery] = useState('');

  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<string>('All');

  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);

  const productOptions = useMemo(() => {
    if (!products) return [];
    return products.map((p) => ({ value: p.id, label: p.name }));
  }, [products]);

  const enrichedInventory = useMemo(() => {
    if (!inventory || !products) return [];

    return inventory.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        ...item,
        productName: product?.name || 'Unknown Product',
        productImage: product?.picture || '',
        productCategories: product?.categories || [],
      };
    });
  }, [inventory, products]);

  const filteredInventory = useMemo(() => {
    if (!enrichedInventory) return [];

    return enrichedInventory.filter((item) => {
      const matchesSearch = item.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) || false || item.productName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProduct = selectedProduct === 'All' || item.productId === selectedProduct;

      return matchesSearch && matchesProduct;
    });
  }, [enrichedInventory, searchQuery, selectedProduct]);

  const handleCreateInventory = () => {
    setEditingInventory(null);
    setIsPopupOpen(true);
  };

  const handleEditInventory = (item: Inventory) => {
    setEditingInventory(item);
    setIsPopupOpen(true);
  };

  const handleDeleteInventory = async (item: Inventory) => {
    if (!confirm(`Are you sure you want to delete this inventory item (${item.barcode})?`)) return;

    try {
      await window.api.db.delete('inventory', item.id);
      await mutate('inventory');
      toast.success('Inventory item deleted successfully');
    } catch (error) {
      logger.error('Failed to delete inventory item', 'inventory-delete', { inventoryId: item.id, error });
      toast.error('Failed to delete inventory item. Please try again.');
    }
  };

  const handleSubmit = async (data: InventoryFormData) => {
    try {
      setIsSubmitting(true);

      if (inventory && inventoryMode === 'barcode') {
        const existingItem = inventory.find((item) => item.barcode === data.barcode && item.id !== editingInventory?.id);
        if (existingItem) {
          toast.error('Barcode already exists in inventory');
          return;
        }
      }

      const inventoryData = {
        ...data,
        createdAt: editingInventory?.createdAt || new Date().toISOString(),
      };

      if (editingInventory) {
        await window.api.db.update('inventory', editingInventory.id, inventoryData);
        toast.success('Inventory item updated successfully');
      } else {
        await window.api.db.create('inventory', inventoryData);
        toast.success('Inventory item created successfully');
      }

      await mutate('inventory');
      setIsPopupOpen(false);
    } catch (error) {
      logger.error('Failed to save inventory item', 'inventory-save', error);
      toast.error('Failed to save inventory item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Error loading inventory</h3>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <InventoryHeader onCreateInventory={handleCreateInventory} />
      <InventoryForm
        isOpen={isPopupOpen}
        onOpenChange={setIsPopupOpen}
        editingInventory={editingInventory}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        productOptions={productOptions}
        inventoryMode={inventoryMode}
      />
      <InventoryFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedProduct={selectedProduct} onProductChange={setSelectedProduct} productOptions={productOptions} />
      <InventoryGrid
        searchQuery={searchQuery}
        onEdit={handleEditInventory}
        onDelete={handleDeleteInventory}
        filteredInventory={filteredInventory}
        selectedProduct={selectedProduct}
        onCreateInventory={handleCreateInventory}
        inventoryMode={inventoryMode}
      />
    </div>
  );
}
