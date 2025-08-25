import { Barcode, Calculator, DollarSign, Package } from 'lucide-react';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@renderer/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select';
import { useEffect, useState } from 'react';

import { BarcodeInput } from '@renderer/components/ui/barcode-input';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Inventory } from 'src/types';
import { Label } from '@renderer/components/ui/label';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { toast } from 'sonner';
import { useIsMobile } from '@renderer/hooks/use-mobile';

type InventoryFormData = {
  productId: string;
  barcode: string;
  quantity: number;
  actualPrice: number;
  sellingPrice: number;
};

type ProductOption = {
  value: string;
  label: string;
};

type InventoryFormProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingInventory: Inventory | null;
  onSubmit: (data: InventoryFormData) => Promise<void>;
  isSubmitting: boolean;
  productOptions: ProductOption[];
  inventoryMode: 'barcode' | 'quantity';
};

const initialFormData: InventoryFormData = {
  productId: '',
  barcode: '',
  quantity: 0,
  actualPrice: 0,
  sellingPrice: 0,
};

export function InventoryForm({ isOpen, onOpenChange, editingInventory, onSubmit, isSubmitting, productOptions, inventoryMode }: InventoryFormProps) {
  const [formData, setFormData] = useState<InventoryFormData>(initialFormData);
  const [barcodeInput, setBarcodeInput] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isOpen) {
      return () => {
        setFormData(initialFormData);
        setBarcodeInput('');
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingInventory) {
      setFormData({
        productId: editingInventory.productId,
        barcode: editingInventory.barcode || '',
        quantity: editingInventory.quantity || 0,
        actualPrice: editingInventory.actualPrice,
        sellingPrice: editingInventory.sellingPrice,
      });
      setBarcodeInput(editingInventory.barcode || '');
    } else {
      setFormData(initialFormData);
      setBarcodeInput('');
    }
  }, [editingInventory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.productId) {
      toast.error('Please select a product');
      return;
    }

    if (inventoryMode === 'barcode' && !formData.barcode.trim()) {
      toast.error('Barcode is required');
      return;
    }

    if (inventoryMode === 'quantity' && formData.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (formData.actualPrice <= 0) {
      toast.error('Actual price must be greater than 0');
      return;
    }

    if (formData.sellingPrice <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }

    await onSubmit(formData);
    setFormData(initialFormData);
    setBarcodeInput('');
  };

  const handleBarcodeChange = (value: string) => {
    setBarcodeInput(value);
    setFormData((prev) => ({ ...prev, barcode: value }));
  };

  const profit = formData.sellingPrice - formData.actualPrice;
  const profitMargin = formData.actualPrice > 0 ? ((profit / formData.actualPrice) * 100).toFixed(1) : '0';

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent side={isMobile ? 'bottom' : 'right'} className="w-full">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {editingInventory ? 'Edit Inventory Item' : 'Add Inventory Item'}
          </DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productId">Product *</Label>
                <Select value={formData.productId} onValueChange={(value) => setFormData((prev) => ({ ...prev, productId: value }))} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {inventoryMode === 'barcode' && (
                <BarcodeInput value={barcodeInput} onChange={handleBarcodeChange} disabled={isSubmitting} label="Barcode" required placeholder="Enter or scan barcode" />
              )}

              {inventoryMode === 'quantity' && (
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Quantity *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actualPrice" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Actual Price (Cost) *
                  </Label>
                  <Input
                    id="actualPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.actualPrice || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        actualPrice: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellingPrice" className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Selling Price *
                  </Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sellingPrice: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {(formData.actualPrice > 0 || formData.sellingPrice > 0) && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Profit Analysis</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Profit:</span>
                      <div className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rs. {profit.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Margin:</span>
                      <div className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitMargin}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DrawerFooter>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Saving...' : editingInventory ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
