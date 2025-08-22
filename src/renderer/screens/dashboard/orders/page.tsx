import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconDownload, IconFilter, IconPlus } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const orders = [
  { id: 'INV-1001', customer: 'John Doe', items: 3, total: 12500, status: 'Paid', date: '2025-08-15 14:22' },
  { id: 'INV-1002', customer: 'Ayesha Khan', items: 5, total: 33200, status: 'Pending', date: '2025-08-16 10:02' },
  { id: 'INV-1003', customer: 'Bilal Ahmed', items: 2, total: 8400, status: 'Refunded', date: '2025-08-17 09:11' },
  { id: 'INV-1004', customer: 'Fatima Tariq', items: 1, total: 2500, status: 'Cancelled', date: '2025-08-18 17:45' },
  { id: 'INV-1005', customer: 'Muhammad Ali', items: 7, total: 51200, status: 'Paid', date: '2025-08-19 12:30' },
];

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'Paid' ? 'default' : status === 'Pending' ? 'secondary' : status === 'Refunded' ? 'outline' : 'destructive';
  return <Badge variant={variant as any}>{status}</Badge>;
}

export default function Orders() {
  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-col gap-3 @container">
          <div className="grid gap-3 @[700px]:grid-cols-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="q">Search</Label>
              <Input id="q" placeholder="Search order # or customer" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue="all">
                <SelectTrigger id="status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" className="w-full @[700px]:w-fit">
                <IconFilter /> Filters
              </Button>
              <Button className="w-full @[700px]:w-fit">
                <IconPlus /> New Order
              </Button>
              <Button variant="outline" className="w-full @[700px]:w-fit">
                <IconDownload /> Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total (Rs)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.id}</TableCell>
                <TableCell>{o.customer}</TableCell>
                <TableCell>{o.items}</TableCell>
                <TableCell className="text-right">{o.total.toLocaleString()}</TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
                <TableCell>{o.date}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <IconDotsVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View</DropdownMenuItem>
                      <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                      <DropdownMenuItem>Refund</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive">Cancel</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
