import { Card, CardContent } from '@renderer/components/ui/card';
import { ProductFilters, ProductForm, ProductsGrid, ProductsHeader } from './components';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Product } from 'src/types';
import { toast } from 'sonner';

type ProductFormData = {
  name: string;
  description: string;
  categories: string[];
  picture: string;
};

export default function Products() {
  const { data: products, error } = useSWR('products', () => window.api.db.get('products'));

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories = useMemo(() => {
    if (!products) return [];
    const allCategories = products.flatMap((p) => p.categories || []);
    return Array.from(new Set(allCategories));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || (product.categories && product.categories.includes(selectedCategory));

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsPopupOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsPopupOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      if (product.picture && !product.picture.startsWith('http')) {
        await window.api.media.delete(product.picture);
      }

      await window.api.db.delete('products', product.id);

      await mutate('products');

      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product. Please try again.');
    }
  };

  const handleSubmit = async (formData: ProductFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const productData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
      };

      if (editingProduct) {
        await window.api.db.update('products', editingProduct.id, productData);
      } else {
        await window.api.db.create('products', productData);
      }

      await mutate('products');

      toast.success('Product successfully saved');

      setIsPopupOpen(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load products. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ProductsHeader onCreateProduct={handleCreateProduct} />
      <ProductForm isOpen={isPopupOpen} onOpenChange={setIsPopupOpen} editingProduct={editingProduct} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      <ProductFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} categories={categories} />
      <ProductsGrid
        searchQuery={searchQuery}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        filteredProducts={filteredProducts}
        selectedCategory={selectedCategory}
        onCreateProduct={handleCreateProduct}
      />
    </div>
  );
}
