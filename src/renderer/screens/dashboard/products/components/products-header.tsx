import { Button } from '@renderer/components/ui/button';
import { Plus } from 'lucide-react';

interface ProductsHeaderProps {
  onCreateProduct: () => void;
}

export function ProductsHeader({ onCreateProduct }: ProductsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted-foreground">Manage your product catalog</p>
      </div>

      <Button onClick={onCreateProduct}>
        <Plus className="w-4 h-4 mr-2" />
        Add Product
      </Button>
    </div>
  );
}
