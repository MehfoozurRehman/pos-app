import { IconMail, IconPhone, IconPlus } from '@tabler/icons-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const customers = [
  { id: 'CUS-001', name: 'John Doe', email: 'john@example.com', phone: '+92 300 1234567', totalOrders: 5, totalSpent: 123400 },
  { id: 'CUS-002', name: 'Ayesha Khan', email: 'ayesha@example.com', phone: '+92 315 9876543', totalOrders: 2, totalSpent: 25400 },
  { id: 'CUS-003', name: 'Bilal Ahmed', email: 'bilal@example.com', phone: '+92 333 1112233', totalOrders: 9, totalSpent: 553000 },
];

export default function Customers() {
  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      <div className="flex items-end justify-between gap-2">
        <div className="w-full max-w-md">
          <Label htmlFor="q">Search</Label>
          <Input id="q" placeholder="Search name, email or phone" />
        </div>
        <Button>
          <IconPlus /> Add Customer
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead className="text-right">Total Spent (Rs)</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-muted-foreground text-xs">{c.id}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <IconMail className="size-4" /> {c.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <IconPhone className="size-4" /> {c.phone}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{c.totalOrders} orders</Badge>
                </TableCell>
                <TableCell className="text-right">{c.totalSpent.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
