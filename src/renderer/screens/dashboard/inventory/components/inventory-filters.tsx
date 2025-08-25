import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Search } from 'lucide-react';

interface ProductOption {
  value: string;
  label: string;
}

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedProduct: string;
  onProductChange: (productId: string) => void;
  productOptions: ProductOption[];
}

export function InventoryFilters({ 
  searchQuery, 
  onSearchChange, 
  selectedProduct, 
  onProductChange, 
  productOptions 
}: InventoryFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          placeholder="Search by barcode or product name..." 
          value={searchQuery} 
          onChange={(e) => onSearchChange(e.target.value)} 
          className="pl-10" 
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={selectedProduct === 'All' ? 'default' : 'outline'} 
          size="sm" 
          className="border" 
          onClick={() => onProductChange('All')}
        >
          All Products
        </Button>
        {productOptions.map((product) => (
          <Button 
            key={product.value} 
            variant={selectedProduct === product.value ? 'default' : 'outline'} 
            size="sm" 
            className="border" 
            onClick={() => onProductChange(product.value)}
          >
            {product.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
