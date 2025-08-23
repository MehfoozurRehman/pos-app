import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProductImage } from '@/components/ProductImage';
import { AlertTriangleIcon, BarChart3Icon, EditIcon, EyeIcon, PackageIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import dayjs from 'dayjs';
import { toast } from 'sonner';

export default function Inventory() {
  const { data: inventory, isLoading: loadingInventory } = useSWR('inventory', () => window.api.db.get('inventory'));
  const { data: products } = useSWR('products', () => window.api.db.get('products'));

  const isMobile = useIsMobile();

  const [openCreate, setOpenCreate] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ productId: '', barcode: '', actualPrice: '', sellingPrice: '' });
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [showLow, setShowLow] = useState(false);
  const [threshold, setThreshold] = useState(5);

  const inventoryByProduct = useMemo(() => {
    const m = new Map();
    (inventory || []).forEach((it) => {
      const pid = it.productId || 'unknown';
      m.set(pid, (m.get(pid) || 0) + 1);
    });
    return m;
  }, [inventory]);

  const stats = useMemo(() => {
    const total = (inventory || []).length;
    const uniqueProducts = Array.from(new Set((inventory || []).map((i) => i.productId))).length;
    const lowStockProducts = Array.from(inventoryByProduct.entries()).filter(([_, count]) => count <= threshold).length;
    const totalValue = (inventory || []).reduce((sum, item) => sum + (item.actualPrice || 0), 0);
    const totalSellingValue = (inventory || []).reduce((sum, item) => sum + (item.sellingPrice || 0), 0);

    return {
      total,
      uniqueProducts,
      lowStockProducts,
      totalValue,
      totalSellingValue,
      potentialProfit: totalSellingValue - totalValue,
    };
  }, [inventory, inventoryByProduct, threshold]);

  const filteredInventory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (inventory || []).filter((i) => {
      if (q) {
        const inText =
          (i.barcode || '').toLowerCase().includes(q) ||
          (i.id || '').toLowerCase().includes(q) ||
          (products || [])
            .find((p) => p.id === i.productId)
            ?.name?.toLowerCase()
            .includes(q);
        if (!inText) return false;
      }
      if (showLow) {
        const cnt = inventoryByProduct.get(i.productId) || 0;
        if (cnt > Number(threshold)) return false;
      }
      return true;
    });
  }, [inventory, products, query, showLow, threshold, inventoryByProduct]);

  const allFilteredInvIds = useMemo(() => (filteredInventory || []).map((i) => i.id), [filteredInventory]);

  const toggleSelectAll = () => {
    const allIds = allFilteredInvIds;
    const currentlyAll = allIds.every((id) => selected.includes(id)) && allIds.length > 0;
    setSelected(currentlyAll ? [] : [...allIds]);
  };

  const selectLowQty = () => {
    const lowInv = (inventory || []).filter((it) => (inventoryByProduct.get(it.productId) || 0) <= Number(threshold)).map((i) => i.id);
    setSelected(lowInv);
  };

  const clearSelection = () => setSelected([]);

  const deleteSelected = async () => {
    if (!selected.length) return;
    if (!confirm(`Delete ${selected.length} inventory item(s)?`)) return;
    await Promise.all(selected.map((id) => window.api.db.delete('inventory', id)));
    clearSelection();
    mutate('inventory');
  };

  const resetForm = () => {
    setForm({ productId: '', barcode: '', actualPrice: '', sellingPrice: '' });
  };

  const createInventory = async () => {
    if (!form.productId || !form.barcode) {
      toast.error('Product and barcode are required');
      return;
    }

    try {
      const payload = {
        id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        productId: form.productId,
        barcode: form.barcode.trim(),
        actualPrice: Number(form.actualPrice) || 0,
        sellingPrice: Number(form.sellingPrice) || 0,
        createdAt: new Date().toISOString(),
      };

      await window.api.db.create('inventory', payload);
      setOpenCreate(false);
      resetForm();
      mutate('inventory');
      toast.success('Inventory item added successfully');
    } catch (error) {
      toast.error('Failed to add inventory item');
      console.error(error);
    }
  };

  const updateInventory = async () => {
    if (!selectedItem || !form.productId || !form.barcode) {
      toast.error('Product and barcode are required');
      return;
    }

    try {
      const payload = {
        productId: form.productId,
        barcode: form.barcode.trim(),
        actualPrice: Number(form.actualPrice) || 0,
        sellingPrice: Number(form.sellingPrice) || 0,
      };

      await window.api.db.update('inventory', selectedItem.id, payload);
      setEditMode(false);
      setOpenDetails(false);
      resetForm();
      mutate('inventory');
      toast.success('Inventory item updated successfully');
    } catch (error) {
      toast.error('Failed to update inventory item');
      console.error(error);
    }
  };

  const deleteInventory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;

    try {
      await window.api.db.delete('inventory', id);
      mutate('inventory');
      toast.success('Inventory item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete inventory item');
      console.error(error);
    }
  };

  const viewItemDetails = (item: any) => {
    setSelectedItem(item);
    setOpenDetails(true);
    setEditMode(false);
  };

  const startEdit = (item: any) => {
    setForm({
      productId: item.productId || '',
      barcode: item.barcode || '',
      actualPrice: item.actualPrice?.toString() || '',
      sellingPrice: item.sellingPrice?.toString() || '',
    });
    setEditMode(true);
  };

  if (loadingInventory) {
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
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenCreate(true)}>
            <PlusIcon className="mr-2" /> New Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Items</div>
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
              <div className="text-sm text-muted-foreground">Unique Products</div>
              <div className="text-2xl font-bold">{stats.uniqueProducts}</div>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <BarChart3Icon className="h-4 w-4 text-green-600" />
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
              <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Value</div>
              <div className="text-2xl font-bold text-purple-600">Rs. {stats.totalValue.toFixed(2)}</div>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <BarChart3Icon className="h-4 w-4 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search inventory by barcode, product name, or ID..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showLow} onChange={(e) => setShowLow(e.target.checked)} className="rounded" />
            Low Stock Only
          </label>
          {showLow && <Input type="number" placeholder="Threshold" value={String(threshold)} onChange={(e) => setThreshold(Number(e.target.value || 0))} className="w-24" />}
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium">{selected.length} items selected</span>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear Selection
          </Button>
          <Button variant="destructive" size="sm" onClick={deleteSelected}>
            Delete Selected
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={toggleSelectAll}>
          {allFilteredInvIds.length > 0 && allFilteredInvIds.every((id) => selected.includes(id)) ? 'Unselect All' : 'Select All'}
        </Button>
        <Button variant="outline" size="sm" onClick={selectLowQty}>
          Select Low Stock
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!inventory || filteredInventory.length === 0 ? (
            <div className="text-center py-8 px-6">
              <div className="text-lg font-semibold mb-2">No inventory items found</div>
              <div className="text-sm text-muted-foreground">{query || showLow ? 'Try adjusting your search or filters' : 'Add your first inventory item to get started'}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <input type="checkbox" checked={allFilteredInvIds.length > 0 && allFilteredInvIds.every((id) => selected.includes(id))} onChange={toggleSelectAll} className="rounded" />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const product = (products || []).find((p) => p.id === item.productId);
                    const stockCount = inventoryByProduct.get(item.productId) || 0;
                    const isLowStock = stockCount <= threshold;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="w-8">
                          <input
                            type="checkbox"
                            checked={selected.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelected((s) => Array.from(new Set([...s, item.id])));
                              } else {
                                setSelected((s) => s.filter((x) => x !== item.id));
                              }
                            }}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ProductImage
                              src={product?.picture}
                              alt={product?.name || 'Product'}
                              className="w-8 h-8 rounded-lg"
                              fallbackClassName="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                            />
                            <div>
                              <div className="font-medium">{product?.name || 'Unknown Product'}</div>
                              <div className="text-sm text-muted-foreground">ID: {item.id.slice(-8)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-semibold">{item.barcode}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={isLowStock ? 'destructive' : 'outline'}>{stockCount} in stock</Badge>
                            {isLowStock && <AlertTriangleIcon className="h-4 w-4 text-orange-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Cost:</span> Rs. {item.actualPrice?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-sm font-semibold">
                              <span className="text-muted-foreground">Sell:</span> Rs. {item.sellingPrice?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.createdAt ? dayjs(item.createdAt).format('MMM DD, YYYY') : '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => viewItemDetails(item)}>
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                startEdit(item);
                                setOpenDetails(true);
                              }}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteInventory(item.id)} className="text-red-600 hover:text-red-700">
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Inventory Item Sheet */}
      <Sheet open={openCreate} onOpenChange={setOpenCreate}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-lg overflow-y-auto max-h-[90vh] sm:max-h-full">
          <SheetHeader>
            <SheetTitle>Add Inventory Item</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {(products || []).map((p) => (
                    <SelectItem value={p.id} key={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode *</Label>
              <Input id="barcode" placeholder="Enter barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualPrice">Cost Price</Label>
              <Input id="actualPrice" type="number" step="0.01" placeholder="Enter cost price" value={form.actualPrice} onChange={(e) => setForm({ ...form, actualPrice: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price</Label>
              <Input id="sellingPrice" type="number" step="0.01" placeholder="Enter selling price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
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
            <Button onClick={createInventory}>Add Item</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Inventory Item Details Sheet */}
      <Sheet open={openDetails} onOpenChange={setOpenDetails}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-lg overflow-y-auto max-h-[90vh] sm:max-h-full">
          <SheetHeader>
            <SheetTitle>{editMode ? 'Edit Inventory Item' : 'Inventory Item Details'}</SheetTitle>
          </SheetHeader>
          {selectedItem && (
            <InventoryDetailsContent
              item={selectedItem}
              products={products}
              inventoryByProduct={inventoryByProduct}
              editMode={editMode}
              form={form}
              setForm={setForm}
              onSave={updateInventory}
              onEdit={() => startEdit(selectedItem)}
              onCancel={() => {
                setEditMode(false);
                resetForm();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InventoryDetailsContent({
  item,
  products,
  inventoryByProduct,
  editMode,
  form,
  setForm,
  onSave,
  onEdit,
  onCancel,
}: {
  item: any;
  products: any[];
  inventoryByProduct: Map<string, number>;
  editMode: boolean;
  form: any;
  setForm: (form: any) => void;
  onSave: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const product = products?.find((p) => p.id === item.productId);
  const stockCount = inventoryByProduct.get(item.productId) || 0;
  const profit = (item.sellingPrice || 0) - (item.actualPrice || 0);

  if (editMode) {
    return (
      <div className="space-y-4 mt-6">
        <div className="space-y-2">
          <Label htmlFor="edit-product">Product *</Label>
          <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {(products || []).map((p) => (
                <SelectItem value={p.id} key={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-barcode">Barcode *</Label>
          <Input id="edit-barcode" placeholder="Enter barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-actualPrice">Cost Price</Label>
          <Input id="edit-actualPrice" type="number" step="0.01" placeholder="Enter cost price" value={form.actualPrice} onChange={(e) => setForm({ ...form, actualPrice: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-sellingPrice">Selling Price</Label>
          <Input id="edit-sellingPrice" type="number" step="0.01" placeholder="Enter selling price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
        </div>
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Item Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProductImage
              src={product?.picture}
              alt={product?.name || 'Product'}
              className="w-12 h-12 rounded-lg"
              fallbackClassName="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"
            />
            <div>
              <h3 className="text-lg font-semibold">{product?.name || 'Unknown Product'}</h3>
              <div className="text-sm text-muted-foreground">Added {dayjs(item.createdAt).format('MMM DD, YYYY')}</div>
            </div>
          </div>
          <Button variant="outline" onClick={onEdit}>
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Barcode</div>
            <div className="font-mono font-semibold">{item.barcode}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Stock Count</div>
            <div className="font-semibold">
              <Badge variant={stockCount <= 5 ? 'destructive' : 'outline'}>{stockCount} items</Badge>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Cost Price</div>
            <div className="font-semibold">Rs. {item.actualPrice?.toFixed(2) || '0.00'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Selling Price</div>
            <div className="font-semibold">Rs. {item.sellingPrice?.toFixed(2) || '0.00'}</div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-muted-foreground">Profit per item</div>
          <div className={`text-lg font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rs. {profit.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
