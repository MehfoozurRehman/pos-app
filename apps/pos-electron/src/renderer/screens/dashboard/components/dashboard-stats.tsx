import { BarChart3, Clock, DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';

import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import { Order } from 'src/types';
import dayjs from 'dayjs';
import { logger } from '@renderer/utils/logger';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import useSWR from 'swr';
import useShop from '@/hooks/use-shop';

export function DashboardStats() {
  const navigate = useNavigate();

  const { inventoryMode } = useShop();

  const { data: orders } = useSWR('orders', () => window.api.db.get('orders'));

  const { data: products } = useSWR('products', () => window.api.db.get('products'));

  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));

  const stats = useMemo(() => {
    if (!orders || !products || !inventory) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: products?.length || 0,
        lowStockItems: 0,
        pendingOrders: 0,
        completedToday: 0,
      };
    }

    const today = dayjs().startOf('day');
    const completedOrders = orders.filter((order: Order) => order.status === 'completed');
    const todayCompleted = completedOrders.filter((order: Order) => dayjs(order.createdAt).isAfter(today));

    const totalRevenue = completedOrders.reduce((sum: number, order: Order) => {
      const orderTotal = order.items.reduce((itemSum: number, item) => {
        let inventoryItem;

        if (inventoryMode === 'quantity') {
          inventoryItem = inventory.find((inv) => inv.productId === item.productId);
        } else {
          inventoryItem = inventory.find((inv) => inv.barcode === item.barcode);
        }

        if (!inventoryItem) {
          logger.warn('Inventory item not found', 'revenue-calculation', {
            productId: item.productId,
            barcode: item.barcode,
            inventoryMode,
          });
          return itemSum;
        }

        const price = inventoryItem.sellingPrice || 0;
        const discount = item.discount || 0;
        return itemSum + Math.max(0, price - discount);
      }, 0);

      const orderDiscount = order.discount || 0;
      return sum + Math.max(0, orderTotal - orderDiscount);
    }, 0);

    const productStockCounts = new Map<string, number>();
    inventory.forEach((inv) => {
      const currentCount = productStockCounts.get(inv.productId) || 0;
      productStockCounts.set(inv.productId, currentCount + 1);
    });

    const lowStockItems = Array.from(productStockCounts.values()).filter((count) => count < 5).length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      lowStockItems,
      pendingOrders: orders.filter((order: Order) => order.status === 'pending' || order.status === 'draft').length,
      completedToday: todayCompleted.length,
    };
  }, [orders, products, inventory]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500 rounded-lg">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Revenue</div>
            <div className="font-bold text-blue-900 dark:text-blue-100">Rs. {stats.totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </Card>
      <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-500 rounded-lg">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-green-600 dark:text-green-400">Orders</div>
            <div className="font-bold text-green-900 dark:text-green-100">{stats.totalOrders}</div>
          </div>
        </div>
      </Card>
      <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Products</div>
            <div className="font-bold text-purple-900 dark:text-purple-100">{stats.totalProducts}</div>
          </div>
        </div>
      </Card>
      <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-orange-600 dark:text-orange-400">Pending</div>
            <div className="font-bold text-orange-900 dark:text-orange-100">{stats.pendingOrders}</div>
          </div>
        </div>
      </Card>
      <Card className="p-3 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-500 rounded-lg">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-teal-600 dark:text-teal-400">Today</div>
            <div className="font-bold text-teal-900 dark:text-teal-100">{stats.completedToday}</div>
          </div>
        </div>
      </Card>
      <Card className="p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-500 rounded-lg">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-red-600 dark:text-red-400">Analytics</div>
            <Button variant="ghost" size="sm" className="h-auto p-0 font-bold text-red-900 dark:text-red-100 hover:bg-transparent" onClick={() => navigate('/dashboard/analytics')}>
              View →
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
