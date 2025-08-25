import { Card, CardContent } from '@renderer/components/ui/card';
import { OrderDetails, OrderFilters, OrderGrid, OrderHeader, OrderStats } from './components';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Order } from 'src/types';
import { toast } from 'sonner';

interface EnrichedOrder extends Order {
  total: number;
  itemsCount: number;
  productDetails: Array<{
    productId: string;
    productName: string;
    productImage: string;
    barcode: string;
    price: number;
    discount: number;
    finalPrice: number;
  }>;
}

export default function OrdersPage() {
  const { data: orders, error } = useSWR('orders', () => window.api.db.get('orders'));
  const { data: products } = useSWR('products', () => window.api.db.get('products'));
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'customer' | 'status'>('date');
  const [selectedOrder, setSelectedOrder] = useState<EnrichedOrder | null>(null);

  const enrichedOrders = useMemo(() => {
    if (!orders || !products || !inventory) return [];

    return orders.map((order): EnrichedOrder => {
      let total = 0;
      const productDetails = order.items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        const inventoryItem = inventory.find((inv) => inv.barcode === item.barcode);

        const basePrice = inventoryItem?.sellingPrice || 0;
        const discount = item.discount || 0;
        const finalPrice = basePrice - discount;

        total += finalPrice;

        return {
          productId: item.productId,
          productName: product?.name || 'Unknown Product',
          productImage: product?.picture || '',
          barcode: item.barcode,
          price: basePrice,
          discount,
          finalPrice,
        };
      });

      if (order.discount) {
        total = total - order.discount;
      }

      return {
        ...order,
        total,
        itemsCount: order.items.length,
        productDetails,
      };
    });
  }, [orders, products, inventory]);

  const filteredOrders = useMemo(() => {
    if (!enrichedOrders) return [];

    let filtered = enrichedOrders.filter((order) => {
      const matchesSearch =
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'total':
          return b.total - a.total;
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [enrichedOrders, searchQuery, statusFilter, sortBy]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await window.api.db.update('orders', orderId, { status: newStatus });
      await mutate('orders');
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      await window.api.db.delete('orders', orderId);
      await mutate('orders');
      toast.success('Order deleted successfully');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error('Failed to delete order');
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Error loading orders</h3>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <OrderHeader totalOrders={enrichedOrders.length} />
      <OrderStats orders={enrichedOrders} />
      <OrderFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} statusFilter={statusFilter} onStatusChange={setStatusFilter} sortBy={sortBy} onSortChange={setSortBy} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrderGrid orders={filteredOrders} onSelectOrder={setSelectedOrder} selectedOrder={selectedOrder} onUpdateStatus={handleUpdateOrderStatus} onDeleteOrder={handleDeleteOrder} />
        </div>
        <div className="lg:col-span-1">
          <OrderDetails order={selectedOrder} onUpdateStatus={handleUpdateOrderStatus} />
        </div>
      </div>
    </div>
  );
}
