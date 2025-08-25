import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@renderer/components/ui/drawer';
import React, { useState } from 'react';

import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { ImageUpload } from '@renderer/components/ui/image-upload';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Product } from 'src/types';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Textarea } from '@renderer/components/ui/textarea';
import { toast } from 'sonner';
import { useIsMobile } from '@renderer/hooks/use-mobile';

interface ProductFormData {
  name: string;
  description: string;
  categories: string[];
  picture: string;
}

interface ProductFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isSubmitting: boolean;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  categories: [],
  picture: '',
};

export function ProductForm({ isOpen, onOpenChange, editingProduct, onSubmit, isSubmitting }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [categoryInput, setCategoryInput] = useState('');
  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description,
        categories: editingProduct.categories || [],
        picture: editingProduct.picture || '',
      });
    } else {
      setFormData(initialFormData);
    }

    return () => {
      setFormData(initialFormData);
    };
  }, [editingProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    await onSubmit(formData);
  };

  const handleAddCategory = () => {
    const category = categoryInput.trim();
    if (category && !formData.categories.includes(category)) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, category],
      }));
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== category),
    }));
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex p-4 w-full">
          <ScrollArea className="h-full w-full">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Product Image</Label>
                <ImageUpload value={formData.picture} onChange={(value) => setFormData((prev) => ({ ...prev, picture: value || '' }))} disabled={isSubmitting} placeholder="Upload product image" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Enter product name" disabled={isSubmitting} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="flex gap-2">
                  <Input
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    placeholder="Add category"
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddCategory} disabled={isSubmitting || !categoryInput.trim()}>
                    Add
                  </Button>
                </div>
                {formData.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {formData.categories.map((category) => (
                      <Badge key={category} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveCategory(category)}>
                        {category} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </form>
        <DrawerFooter>
          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1" onClick={handleSubmit}>
              {isSubmitting ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
