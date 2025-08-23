import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProductImage } from '@/components/ProductImage';
import { EditIcon, EyeIcon, ImageIcon, PackageIcon, PlusIcon, SearchIcon, TagIcon, Trash2Icon, UploadIcon } from 'lucide-react';
import { useMemo, useState, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import dayjs from 'dayjs';
import { toast } from 'sonner';

export default function Products() {
  const { data: products, isLoading: loadingProducts } = useSWR('products', () => window.api.db.get('products'));
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));

  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', categories: '', picture: '' });
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low'>('all');
  const [threshold, setThreshold] = useState(5);
  const [uploadingImage, setUploadingImage] = useState(false);

  const inventoryCountsByProduct = useMemo(() => {
    const m = new Map();
    (inventory || []).forEach((it) => {
      const pid = it.productId || 'unknown';
      m.set(pid, (m.get(pid) || 0) + 1);
    });
    return m;
  }, [inventory]);

  const stats = useMemo(() => {
    const total = (products || []).length;
    const categories = Array.from(new Set((products || []).flatMap((p) => p.categories || []))).length;
    const inventoryCount = (inventory || []).length;
    const lowStockProducts = Array.from(inventoryCountsByProduct.entries()).filter(([_, count]) => count <= threshold).length;

    return { total, categories, inventoryCount, lowStockProducts };
  }, [products, inventory, inventoryCountsByProduct, threshold]);

  const filteredProducts = useMemo(() => {
    const list = products || [];
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (q) {
        const inText =
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.id || '').toLowerCase().includes(q) ||
          (p.categories || []).join(' ').toLowerCase().includes(q);
        if (!inText) return false;
      }
      if (filterMode === 'low') {
        const cnt = inventoryCountsByProduct.get(p.id) || 0;
        if (cnt > Number(threshold)) return false;
      }
      return true;
    });
  }, [products, query, filterMode, threshold, inventoryCountsByProduct]);

  const resetForm = () => {
    setForm({ name: '', description: '', categories: '', picture: '' });
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const filename = `product_${timestamp}.${extension}`;

      // Save image to local storage (same directory as database)
      const imagePath = await window.api.saveImage(file, filename);

      setForm({ ...form, picture: imagePath });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const getImageUrl = async (relativePath: string) => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    return await window.api.getImagePath(relativePath);
  };

  const createProduct = async () => {
    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    try {
      const payload = {
        id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: form.name.trim(),
        description: form.description.trim(),
        categories: form.categories
          ? form.categories
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        picture: form.picture.trim(),
        createdAt: new Date().toISOString(),
      };

      await window.api.db.create('products', payload);
      setOpenCreate(false);
      resetForm();
      mutate('products');
      toast.success('Product created successfully');
    } catch (error) {
      toast.error('Failed to create product');
      console.error(error);
    }
  };

  const updateProduct = async () => {
    if (!selectedProduct || !form.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        categories: form.categories
          ? form.categories
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        picture: form.picture.trim(),
      };

      await window.api.db.update('products', selectedProduct.id, payload);
      setEditMode(false);
      setOpenDetails(false);
      resetForm();
      mutate('products');
      toast.success('Product updated successfully');
    } catch (error) {
      toast.error('Failed to update product');
      console.error(error);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This will also affect related inventory items.')) return;

    try {
      await window.api.db.delete('products', id);
      mutate('products');
      mutate('inventory');
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
      console.error(error);
    }
  };

  const viewProductDetails = (product: any) => {
    setSelectedProduct(product);
    setOpenDetails(true);
    setEditMode(false);
  };

  const startEdit = (product: any) => {
    setForm({
      name: product.name || '',
      description: product.description || '',
      categories: (product.categories || []).join(', '),
      picture: product.picture || '',
    });
    setEditMode(true);
  };

  if (loadingProducts) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenCreate(true)}>
            <PlusIcon className="mr-2" /> New Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Products</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <PackageIcon className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Categories</div>
              <div className="text-2xl font-bold">{stats.categories}</div>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TagIcon className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Inventory Items</div>
              <div className="text-2xl font-bold">{stats.inventoryCount}</div>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Low Stock</div>
              <div className="text-2xl font-bold text-orange-600">{stats.lowStockProducts}</div>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <TagIcon className="h-4 w-4 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search products by name, description, or category..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterMode} onValueChange={(v) => setFilterMode(v as 'all' | 'low')}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="low">Low Inventory</SelectItem>
          </SelectContent>
        </Select>
        {filterMode === 'low' && <Input type="number" min={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-24" placeholder="Threshold" />}
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!products || filteredProducts.length === 0 ? (
            <div className="text-center py-8 px-6">
              <div className="text-lg font-semibold mb-2">No products found</div>
              <div className="text-sm text-muted-foreground">{query || filterMode !== 'all' ? 'Try adjusting your search or filters' : 'Add your first product to get started'}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductImage src={p.picture} alt={p.name} className="w-10 h-10 rounded-lg" fallbackClassName="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center" />
                          <div>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">{p.description || 'No description'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(p.categories || []).map((c: string) => (
                            <Badge key={c} variant="secondary" className="text-xs">
                              {c}
                            </Badge>
                          ))}
                          {(!p.categories || p.categories.length === 0) && <span className="text-sm text-muted-foreground">No categories</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{inventoryCountsByProduct.get(p.id) || 0} items</Badge>
                      </TableCell>
                      <TableCell>{p.createdAt ? dayjs(p.createdAt).format('MMM DD, YYYY') : '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewProductDetails(p)}>
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(p);
                              startEdit(p);
                              setOpenDetails(true);
                            }}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteProduct(p.id)} className="text-red-600 hover:text-red-700">
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Product Sheet */}
      <Sheet open={openCreate} onOpenChange={setOpenCreate}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-lg overflow-y-auto max-h-[90vh] sm:max-h-full">
          <SheetHeader>
            <SheetTitle>Add New Product</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" placeholder="Enter product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter product description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categories">Categories</Label>
              <Input id="categories" placeholder="Enter categories (comma separated)" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} />
              <div className="text-sm text-muted-foreground">Example: Electronics, Gadgets, Mobile</div>
            </div>
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="space-y-3">
                {form.picture && (
                  <ProductImage src={form.picture} alt="Preview" className="w-20 h-20 rounded-lg" fallbackClassName="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center" />
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="flex-1">
                    <UploadIcon className="h-4 w-4 mr-2" />
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <Input placeholder="Or enter image URL" value={form.picture} onChange={(e) => setForm({ ...form, picture: e.target.value })} className="flex-1" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6 pt-4 border-t flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreate(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={createProduct} disabled={uploadingImage}>
              Add Product
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Product Details Sheet */}
      <Sheet open={openDetails} onOpenChange={setOpenDetails}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-lg overflow-y-auto max-h-[90vh] sm:max-h-full">
          <SheetHeader>
            <SheetTitle>{editMode ? 'Edit Product' : 'Product Details'}</SheetTitle>
          </SheetHeader>
          {selectedProduct && (
            <ProductDetailsContent
              product={selectedProduct}
              inventory={inventory}
              editMode={editMode}
              form={form}
              setForm={setForm}
              onSave={updateProduct}
              onEdit={() => startEdit(selectedProduct)}
              onCancel={() => {
                setEditMode(false);
                resetForm();
              }}
              handleImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
              fileInputRef={fileInputRef}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProductDetailsContent({
  product,
  inventory,
  editMode,
  form,
  setForm,
  onSave,
  onEdit,
  onCancel,
  handleImageUpload,
  uploadingImage,
  fileInputRef,
}: {
  product: any;
  inventory: any[];
  editMode: boolean;
  form: any;
  setForm: (form: any) => void;
  onSave: () => void;
  onEdit: () => void;
  onCancel: () => void;
  handleImageUpload: (file: File) => void;
  uploadingImage: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}) {
  const inventoryCount = inventory?.filter((item) => item.productId === product.id).length || 0;

  if (editMode) {
    return (
      <div className="space-y-4 mt-6">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Product Name *</Label>
          <Input id="edit-name" placeholder="Enter product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <Textarea id="edit-description" placeholder="Enter product description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-categories">Categories</Label>
          <Input id="edit-categories" placeholder="Enter categories (comma separated)" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Product Image</Label>
          <div className="space-y-3">
            {form.picture && <ProductImage src={form.picture} alt="Preview" className="w-20 h-20 rounded-lg" fallbackClassName="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center" />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="flex-1">
                <UploadIcon className="h-4 w-4 mr-2" />
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </Button>
              <Input placeholder="Or enter image URL" value={form.picture} onChange={(e) => setForm({ ...form, picture: e.target.value })} className="flex-1" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={uploadingImage}>
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Product Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProductImage src={product.picture} alt={product.name} className="w-16 h-16 rounded-lg" fallbackClassName="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center" />
            <div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <div className="text-sm text-muted-foreground">Created {dayjs(product.createdAt).format('MMM DD, YYYY')}</div>
            </div>
          </div>
          <Button variant="outline" onClick={onEdit}>
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Description</div>
            <div className="font-medium">{product.description || 'No description provided'}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Categories</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {(product.categories || []).map((category: string) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
              {(!product.categories || product.categories.length === 0) && <span className="text-sm text-muted-foreground">No categories assigned</span>}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Inventory</div>
            <div className="font-medium">
              <Badge variant="outline" className="text-sm">
                {inventoryCount} items in stock
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
