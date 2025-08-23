import { PlusIcon, Trash2Icon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@renderer/components/ui/table';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import dayjs from 'dayjs';

export default function Inventory() {
  const { data: inventory, isLoading: loadingInventory } = useSWR('inventory', () => window.api.db.get('inventory'));
  const { data: products } = useSWR('products', () => window.api.db.get('products'));

  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ productId: '', barcode: '', actualPrice: '', sellingPrice: '' });
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [showLow, setShowLow] = useState(false);
  const [threshold, setThreshold] = useState(5);

  const stats = useMemo(() => {
    const total = (inventory || []).length;
    const uniqueProducts = Array.from(new Set((inventory || []).map((i) => i.productId))).length;
    return { total, uniqueProducts };
  }, [inventory]);

  const inventoryByProduct = useMemo(() => {
    const m = new Map();
    (inventory || []).forEach((it) => {
      const pid = it.productId || 'unknown';
      m.set(pid, (m.get(pid) || 0) + 1);
    });
    return m;
  }, [inventory]);

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

  const createInventory = async () => {
    const payload = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      productId: form.productId,
      barcode: form.barcode,
      actualPrice: Number(form.actualPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      createdAt: new Date().toISOString(),
    };

    await window.api.db.create('inventory', payload);
    setOpenCreate(false);
    setForm({ productId: '', barcode: '', actualPrice: '', sellingPrice: '' });
    mutate('inventory');
  };

  const deleteInventory = async (id: string) => {
    if (!confirm('Delete inventory item?')) return;
    await window.api.db.delete('inventory', id);
    mutate('inventory');
  };

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Inventory items</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Products in inventory</div>
          <div className="text-2xl font-bold">{stats.uniqueProducts}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Inventory list</h2>
          <div className="flex items-center gap-2">
            <Input placeholder="Search inventory" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showLow} onChange={(e) => setShowLow(e.target.checked)} />
              <span className="text-sm">Low qty</span>
            </label>
            {showLow ? <Input placeholder="Threshold" value={String(threshold)} onChange={(e) => setThreshold(Number(e.target.value || 0))} className="w-20" /> : null}
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {allFilteredInvIds.length > 0 && allFilteredInvIds.every((id) => selected.includes(id)) ? 'Unselect all' : 'Select all'}
            </Button>
            <Button variant="ghost" size="sm" onClick={selectLowQty}>
              Select low
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteSelected} disabled={selected.length === 0}>
              Delete selected ({selected.length})
            </Button>
          </div>
        </div>

        {loadingInventory ? (
          <div className="p-8 text-center text-muted-foreground">Loading inventory...</div>
        ) : (inventory || []).length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-lg font-semibold">No inventory items</div>
            <div className="text-sm text-muted-foreground">Add inventory items to get started.</div>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-lg font-semibold">No results</div>
            <div className="text-sm text-muted-foreground">Try changing the search or filter.</div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Barcode</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Selling</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="w-8">
                    <input
                      type="checkbox"
                      checked={selected.includes(i.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelected((s) => Array.from(new Set([...s, i.id])));
                        else setSelected((s) => s.filter((x) => x !== i.id));
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-semibold">{i.barcode}</TableCell>
                  <TableCell>{(products || []).find((p) => p.id === i.productId)?.name || '\u2014'}</TableCell>
                  <TableCell>Rs. {i.sellingPrice}</TableCell>
                  <TableCell>{i.createdAt ? dayjs(i.createdAt).format('YYYY-MM-DD') : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" onClick={() => deleteInventory(i.id)}>
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

      {openCreate ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-background/90 backdrop-blur rounded-lg w-full max-w-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Create inventory item</h3>
            <div className="space-y-2">
              <Select onValueChange={(v) => setForm({ ...form, productId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {(products || []).map((p) => (
                    <SelectItem value={p.id} key={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              <Input placeholder="Actual price" value={form.actualPrice} onChange={(e) => setForm({ ...form, actualPrice: e.target.value })} />
              <Input placeholder="Selling price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setOpenCreate(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={createInventory}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
