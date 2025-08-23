import { Card, CardContent } from '@renderer/components/ui/card';
import { ProductFilters, ProductForm, ProductsGrid, ProductsHeader } from './components';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Product } from 'src/types';

interface ProductFormData {
  name: string;
  description: string;
  categories: string[];
  picture: string;
}

export default function Products() {
  const { data: products, error } = useSWR('products', () => window.api.db.get('products'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all unique categories
  const categories = useMemo(() => {
    if (!products) return [];
    const allCategories = products.flatMap((p: Product) => p.categories || []);
    return Array.from(new Set(allCategories));
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product: Product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || (product.categories && product.categories.includes(selectedCategory));

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsCreateOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsCreateOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      // Delete associated media file if it exists
      if (product.picture && !product.picture.startsWith('http')) {
        await window.api.media.delete(product.picture);
      }

      await window.api.db.delete('products', product.id);
      mutate('products');
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
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
        await window.api.db.create('products', productData as any);
      }

      mutate('products');
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
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

      <ProductForm isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} editingProduct={editingProduct} onSubmit={handleSubmit} isSubmitting={isSubmitting} />

      <ProductFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} categories={categories} />

      <ProductsGrid
        products={products}
        filteredProducts={filteredProducts}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onCreateProduct={handleCreateProduct}
      />
    </div>
  );
}
