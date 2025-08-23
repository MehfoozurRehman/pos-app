import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { EyeIcon, FilterIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import dayjs from 'dayjs';

export default function Orders() {
  const { data: orders, isLoading: loadingOrders } = useSWR('orders', () => window.api.db.get('orders'));
  const { data: products } = useSWR('products', () => window.api.db.get('products'));
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));

  const isMobile = useIsMobile();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [openDetails, setOpenDetails] = useState(false);

  const stats = useMemo(() => {
    const allOrders = orders || [];
    const total = allOrders.length;
    const pending = allOrders.filter((o: any) => o.status === 'pending').length;
    const completed = allOrders.filter((o: any) => o.status === 'completed').length;
    const cancelled = allOrders.filter((o: any) => o.status === 'cancelled').length;
    const draft = allOrders.filter((o: any) => o.status === 'draft').length;

    const totalRevenue = allOrders
      .filter((o: any) => o.status === 'completed')
      .reduce((sum: number, order: any) => {
        const orderTotal = calculateOrderTotal(order);
        return sum + orderTotal;
      }, 0);

    return { total, pending, completed, cancelled, draft, totalRevenue };
  }, [orders, products, inventory]);

  const calculateOrderTotal = (order: any) => {
    if (!order.items || !inventory || !products) return 0;

    let subtotal = 0;
    order.items.forEach((item: any) => {
      const inventoryItem = inventory.find((inv: any) => inv.barcode === item.barcode);
      if (inventoryItem) {
        subtotal += inventoryItem.sellingPrice - (item.discount || 0);
      }
    });

    return subtotal - (order.discount || 0);
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter((order: any) => {
      const matchesQuery = !query || order.orderId.toLowerCase().includes(query.toLowerCase()) || order.customerName.toLowerCase().includes(query.toLowerCase()) || order.customerPhone.includes(query);

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await window.api.db.update('orders', orderId, { status: newStatus });
    mutate('orders');
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    await window.api.db.delete('orders', orderId);
    mutate('orders');
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setOpenDetails(true);
  };

  if (loadingOrders) {
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
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FilterIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Orders</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Cancelled</div>
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Revenue</div>
          <div className="text-2xl font-bold text-blue-600">Rs. {stats.totalRevenue.toFixed(2)}</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search orders by ID, customer name, or phone..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!orders || filteredOrders.length === 0 ? (
            <div className="text-center py-8 px-6">
              <div className="text-lg font-semibold mb-2">No orders found</div>
              <div className="text-sm text-muted-foreground">{query || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Orders will appear here once created'}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-semibold">{order.orderId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.items?.length || 0} items</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">Rs. {calculateOrderTotal(order).toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>{dayjs(order.createdAt).format('MMM DD, YYYY HH:mm')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewOrderDetails(order)}>
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {order.status === 'pending' && (
                            <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteOrder(order.id)} className="text-red-600 hover:text-red-700">
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

      {/* Order Details Sheet */}
      <Sheet open={openDetails} onOpenChange={setOpenDetails}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-lg overflow-y-auto max-h-[90vh] sm:max-h-full">
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
          </SheetHeader>
          {selectedOrder && (
            <OrderDetailsContent
              order={selectedOrder}
              products={products}
              inventory={inventory}
              onStatusUpdate={(newStatus) => {
                updateOrderStatus(selectedOrder.id, newStatus);
                setSelectedOrder({ ...selectedOrder, status: newStatus });
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return <Badge className={variants[status as keyof typeof variants] || variants.draft}>{status?.charAt(0).toUpperCase() + status?.slice(1) || 'Draft'}</Badge>;
}

function OrderDetailsContent({ order, products, inventory, onStatusUpdate }: { order: any; products: any[]; inventory: any[]; onStatusUpdate: (status: string) => void }) {
  const orderItems = useMemo(() => {
    if (!order.items || !products || !inventory) return [];

    return order.items.map((item: any) => {
      const product = products.find((p: any) => p.id === item.productId);
      const inventoryItem = inventory.find((inv: any) => inv.barcode === item.barcode);

      return {
        ...item,
        product,
        inventoryItem,
        subtotal: inventoryItem ? inventoryItem.sellingPrice - (item.discount || 0) : 0,
      };
    });
  }, [order.items, products, inventory]);

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - (order.discount || 0);

  return (
    <div className="space-y-6 mt-6">
      {/* Order Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{order.orderId}</h3>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Customer</div>
            <div className="font-medium">{order.customerName}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Phone</div>
            <div className="font-medium">{order.customerPhone}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Date</div>
            <div className="font-medium">{dayjs(order.createdAt).format('MMM DD, YYYY HH:mm')}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Items</div>
            <div className="font-medium">{order.items?.length || 0} items</div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-4">
        <h4 className="font-semibold">Order Items</h4>
        <div className="space-y-3">
          {orderItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{item.product?.name || 'Unknown Product'}</div>
                <div className="text-sm text-muted-foreground">Barcode: {item.barcode}</div>
                {item.discount > 0 && <div className="text-sm text-green-600">Discount: Rs. {item.discount}</div>}
              </div>
              <div className="text-right">
                <div className="font-semibold">Rs. {item.subtotal.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Rs. {item.inventoryItem?.sellingPrice || 0}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Total */}
      <div className="space-y-2 pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>Rs. {subtotal.toFixed(2)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Order Discount</span>
            <span>- Rs. {order.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
          <span>Total</span>
          <span>Rs. {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Status Update */}
      {order.status !== 'completed' && order.status !== 'cancelled' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Update Status</label>
          <Select value={order.status} onValueChange={onStatusUpdate}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
