import { Card, CardContent } from '@renderer/components/ui/card';
import { OrderDetails, OrderFilters, OrderGrid, OrderHeader, OrderStats } from './components';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Order } from 'src/types';
import { toast } from 'sonner';
import { logger } from '@renderer/utils/logger';

type EnrichedOrder = Order & {
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
};

export default function OrdersPage() {
  const { data: orders, error } = useSWR('orders', () => window.api.db.get('orders'));
  const { data: products } = useSWR('products', () => window.api.db.get('products'));
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));
  const { data: shop } = useSWR('shop', () => window.api.db.get('shop'));

  const inventoryMode = shop?.inventoryMode || 'barcode';

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
        productDetails: productDetails.map(pd => ({
          ...pd,
          barcode: pd.barcode || ''
        })),
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
      const currentOrder = enrichedOrders.find((order) => order.id === orderId);
      if (!currentOrder) {
        toast.error('Order not found');
        return;
      }

      const oldStatus = currentOrder.status;

      await window.api.db.update('orders', orderId, { status: newStatus });

      
      if (oldStatus !== newStatus) {
        await handleInventoryStatusChange(currentOrder, oldStatus, newStatus);
      }

      await mutate('orders');
      await mutate('inventory');
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      logger.error('Failed to update order status', 'order-status-update', { orderId, newStatus, error });
      toast.error('Failed to update order status');
    }
  };

  const handleInventoryStatusChange = async (order: EnrichedOrder, oldStatus: string, newStatus: string) => {
    try {
      const inventory = await window.api.db.get('inventory');
      if (!inventory) return;

      if (newStatus === 'completed' && oldStatus !== 'completed') {
        if (inventoryMode === 'quantity') {

          for (const item of order.items) {
            const inventoryItems = inventory.filter((inv) => inv.productId === item.productId);
            let remainingToDeduct = 1;
            
            for (const inventoryItem of inventoryItems) {
              if (remainingToDeduct <= 0) break;
              
              const currentQuantity = inventoryItem.quantity || 1;
              const deductAmount = Math.min(currentQuantity, remainingToDeduct);
              const newQuantity = currentQuantity - deductAmount;
              
              if (newQuantity <= 0) {
                await window.api.db.delete('inventory', inventoryItem.id);
              } else {
                await window.api.db.update('inventory', inventoryItem.id, {
                  ...inventoryItem,
                  quantity: newQuantity
                });
              }
              
              remainingToDeduct -= deductAmount;
            }
          }
        } else {
          for (const item of order.items) {
            const inventoryItem = inventory.find((inv) => inv.barcode === item.barcode);
            if (inventoryItem) {
              await window.api.db.delete('inventory', inventoryItem.id);
            }
          }
        }
      }

      else if ((newStatus === 'cancelled' && oldStatus === 'completed') || (oldStatus === 'completed' && newStatus !== 'completed')) {
        if (inventoryMode === 'quantity') {
          for (const item of order.items) {
            const existingItems = inventory.filter((inv) => inv.productId === item.productId);
            const productDetails = order.productDetails.find((pd) => pd.productId === item.productId);
            
            if (existingItems.length > 0 && productDetails) {
  
              const firstItem = existingItems[0];
              const currentQuantity = firstItem.quantity || 1;
              await window.api.db.update('inventory', firstItem.id, {
                ...firstItem,
                quantity: currentQuantity + 1
              });
            } else if (productDetails) {
  
              const inventoryData = {
                productId: item.productId,
                quantity: 1,
                actualPrice: productDetails.price,
                sellingPrice: productDetails.price,
                createdAt: new Date().toISOString(),
              };
              await window.api.db.create('inventory', inventoryData);
            }
          }
        } else {
          for (const item of order.items) {
            const existingItem = inventory.find((inv) => inv.barcode === item.barcode);
            if (!existingItem) {
              const productDetails = order.productDetails.find((pd) => pd.productId === item.productId);
              if (productDetails) {
                const inventoryData = {
                  productId: item.productId,
                  barcode: item.barcode,
                  actualPrice: productDetails.price,
                  sellingPrice: productDetails.price,
                  createdAt: new Date().toISOString(),
                };
                await window.api.db.create('inventory', inventoryData);
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error managing inventory during status change', 'inventory-status-change', { orderId: order.id, oldStatus, newStatus, error });
      
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const orderToDelete = enrichedOrders.find((order) => order.id === orderId);

      await window.api.db.delete('orders', orderId);
      if (orderToDelete && orderToDelete.status === 'completed') {
        await handleInventoryStatusChange(orderToDelete, 'completed', 'cancelled');
      }

      await mutate('orders');
      await mutate('inventory');
      toast.success('Order deleted successfully');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      logger.error('Failed to delete order', 'order-delete', { orderId, error });
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
