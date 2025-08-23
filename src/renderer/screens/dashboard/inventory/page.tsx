import { IconFilter, IconPencil, IconPlus, IconQrcode } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const items = Array.from({ length: 12 }).map((_, i) => ({
  id: `SKU-${1000 + i}`,
  name: `Product ${i + 1}`,
  stock: Math.floor(Math.random() * 50) + 1,
  price: (Math.floor(Math.random() * 9000) + 1000) * 10,
  category: ['CPU', 'GPU', 'Memory', 'Storage'][i % 4],
}));

export default function Inventory() {
  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-end md:gap-4 flex-1">
          <div className="flex flex-col gap-1 lg:col-span-2 flex-1">
            <Label>Search</Label>
            <Input placeholder="Search SKU or product" />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Category</Label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="CPU">CPU</SelectItem>
                <SelectItem value="GPU">GPU</SelectItem>
                <SelectItem value="Memory">Memory</SelectItem>
                <SelectItem value="Storage">Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-1 items-end justify-end gap-2">
          <Button variant="outline" className="w-full lg:w-fit">
            <IconFilter /> Filters
          </Button>
          <Button className="w-full lg:w-fit">
            <IconPlus /> Add Item
          </Button>
        </div>
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        {items.map((p) => (
          <Card key={p.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-sm leading-tight line-clamp-2">{p.name}</div>
              <Badge variant={p.stock < 5 ? 'destructive' : 'secondary'}>{p.stock} in stock</Badge>
            </div>
            <div className="text-muted-foreground text-sm">{p.id}</div>
            <div className="flex items-center justify-between">
              <Badge variant="outline">{p.category}</Badge>
              <div className="font-medium">Rs. {p.price.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm">
                <IconQrcode /> Label
              </Button>
              <Button variant="default" size="sm">
                <IconPencil /> Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
