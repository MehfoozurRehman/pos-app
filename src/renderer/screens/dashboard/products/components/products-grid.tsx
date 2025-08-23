import { Button } from '@renderer/components/ui/button';
import { Card, CardContent } from '@renderer/components/ui/card';
import { Package, Plus } from 'lucide-react';
import React from 'react';

import { Product } from 'src/types';
import { ProductCard } from './product-card';

interface ProductsGridProps {
  products: Product[] | undefined;
  filteredProducts: Product[];
  searchQuery: string;
  selectedCategory: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onCreateProduct: () => void;
}

export function ProductsGrid({ products, filteredProducts, searchQuery, selectedCategory, onEdit, onDelete, onCreateProduct }: ProductsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {!products ? (
        // Loading state
        Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-muted rounded-t-lg" />
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))
      ) : filteredProducts.length === 0 ? (
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
        filteredProducts.map((product: Product) => <ProductCard key={product.id} product={product} onEdit={onEdit} onDelete={onDelete} />)
      )}
    </div>
  );
}
