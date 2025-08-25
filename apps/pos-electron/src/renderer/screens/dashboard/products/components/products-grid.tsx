import { Card, CardContent } from '@renderer/components/ui/card';
import { Package, Plus } from 'lucide-react';

import { Button } from '@renderer/components/ui/button';
import { Product } from 'src/types';
import { ProductCard } from './product-card';
import { useAutoAnimate } from '@formkit/auto-animate/react';

type ProductsGridProps = {
  filteredProducts: Product[];
  searchQuery: string;
  selectedCategory: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onCreateProduct: () => void;
};

export function ProductsGrid({ filteredProducts, searchQuery, selectedCategory, onEdit, onDelete, onCreateProduct }: ProductsGridProps) {
  const [parent] = useAutoAnimate();

  return (
    <div ref={parent} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {filteredProducts.length === 0 ? (
        <div className="col-span-full">
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">{searchQuery || selectedCategory !== 'All' ? 'Try adjusting your search or filters' : 'Get started by creating your first product'}</p>
              {!searchQuery && selectedCategory === 'All' && (
                <Button onClick={onCreateProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        filteredProducts.map((product) => <ProductCard key={product.id} product={product} onEdit={onEdit} onDelete={onDelete} />)
      )}
    </div>
  );
}
