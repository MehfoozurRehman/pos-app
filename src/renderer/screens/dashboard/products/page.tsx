import { PlusIcon, Trash2Icon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@renderer/components/ui/table';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import dayjs from 'dayjs';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Products() {
  const { data: products, isLoading: loadingProducts } = useSWR('products', () => window.api.db.get('products'));
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));

  const isMobile = useIsMobile();

  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low'>('all');
  const [threshold, setThreshold] = useState(5);

  const [openCreate, setOpenCreate] = useState(false);

  const [form, setForm] = useState({ name: '', description: '', categories: '', picture: '' });

  const stats = useMemo(() => {
    const total = (products || []).length;
    const categories = Array.from(new Set((products || []).flatMap((p) => p.categories || []))).length;
    const inventoryCount = (inventory || []).length;
    return { total, categories, inventoryCount };
  }, [products, inventory]);

  const inventoryCountsByProduct = useMemo(() => {
    const m = new Map();
    (inventory || []).forEach((it) => {
      const pid = it.productId || 'unknown';
      m.set(pid, (m.get(pid) || 0) + 1);
    });
    return m;
  }, [inventory]);

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

  const createProduct = async () => {
    const payload = {
      name: form.name,
      description: form.description,
      categories: form.categories
        ? form.categories
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      picture: form.picture,
      createdAt: new Date().toISOString(),
    } as any;

    await window.api.db.create('products', payload);
    setOpenCreate(false);
    setForm({ name: '', description: '', categories: '', picture: '' });
    mutate('products');
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete product?')) return;
    await window.api.db.delete('products', id);
    mutate('products');
    mutate('inventory');
  };

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total products</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Categories</div>
          <div className="text-2xl font-bold">{stats.categories}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Inventory items</div>
          <div className="text-2xl font-bold">{stats.inventoryCount}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Product list</h2>
          <div className="flex items-center gap-2">
            <Input placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
            <Select value={filterMode} onValueChange={(v) => setFilterMode(v as 'all' | 'low')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="low">Low Inventory</SelectItem>
              </SelectContent>
            </Select>
            {filterMode === 'low' && <Input type="number" min={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-24" placeholder="Threshold" />}
          </div>
        </div>
        {loadingProducts ? (
          <div className="p-8 text-center text-muted-foreground">Loading products...</div>
        ) : (products || []).length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-lg font-semibold">No products found</div>
            <div className="text-sm text-muted-foreground">Add a new product to get started.</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-lg font-semibold">No results</div>
            <div className="text-sm text-muted-foreground">Try changing the search or filter.</div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-semibold">{p.name}</TableCell>
                  <TableCell>
                    {(p.categories || []).map((c: string) => (
                      <Badge key={c} className="mr-1">
                        {c}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>{p.createdAt ? dayjs(p.createdAt).format('YYYY-MM-DD') : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" onClick={() => deleteProduct(p.id)}>
                        <Trash2Icon className="mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <Sheet open={openCreate} onOpenChange={setOpenCreate}>
        <SheetContent side={isMobile ? 'bottom' : 'right'}>
          <SheetHeader>
            <SheetTitle>Create product</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Categories (comma separated)" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} />
            <Input placeholder="Picture URL" value={form.picture} onChange={(e) => setForm({ ...form, picture: e.target.value })} />
          </div>
          <SheetFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpenCreate(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={createProduct} className="flex-1">
                Create
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
