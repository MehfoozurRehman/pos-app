import { AlertTriangle, BarChart3, Calendar, CheckCircle, Clock, DollarSign, Package, Percent, ShoppingBag, Star, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card';

import dayjs from 'dayjs';
import { useMemo } from 'react';
import useSWR from 'swr';
import useShop from '@/hooks/use-shop';

type AnalyticsData = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
  completedOrders: number;
  pendingOrders: number;
  draftOrders: number;
  lowStockItems: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    revenue: number;
  }>;
  recentSales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  customerTiers: {
    vip: number;
    gold: number;
    silver: number;
    bronze: number;
  };
};

export default function Analytics() {
  const { inventoryMode } = useShop();

  const { data: orders } = useSWR('orders', () => window.api.db.get('orders'));

  const { data: products } = useSWR('products', () => window.api.db.get('products'));

  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));

  const analyticsData = useMemo((): AnalyticsData => {
    if (!orders || !products || !inventory) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        averageOrderValue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        draftOrders: 0,
        lowStockItems: 0,
        topSellingProducts: [],
        recentSales: [],
        customerTiers: { vip: 0, gold: 0, silver: 0, bronze: 0 },
      };
    }

    const enrichedOrders = orders.map((order) => {
      const total = order.items.reduce((sum, item) => {
        let inventoryItem;

        if (inventoryMode === 'quantity') {
          inventoryItem = inventory.find((inv) => inv.productId === item.productId);
        } else {
          inventoryItem = inventory.find((inv) => inv.barcode === item.barcode);
        }

        if (inventoryItem) {
          const itemPrice = inventoryItem.sellingPrice;
          const discount = item.discount || 0;
          const finalPrice = itemPrice - (itemPrice * discount) / 100;
          return sum + finalPrice;
        }
        return sum;
      }, 0);

      const orderDiscount = order.discount || 0;
      const finalTotal = total - (total * orderDiscount) / 100;

      return { ...order, total: finalTotal };
    });

    const totalRevenue = enrichedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const uniqueCustomers = new Set(orders.map((order) => `${order.customerName}-${order.customerPhone}`));
    const totalCustomers = uniqueCustomers.size;

    const statusCounts = orders.reduce(
      (acc, order) => {
        const status = order.status || 'draft';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const completedOrders = statusCounts.completed || 0;
    const pendingOrders = statusCounts.pending || 0;
    const draftOrders = statusCounts.draft || 0;

    const lowStockItems = inventoryMode === 'quantity' ? inventory.filter((item) => (item.quantity || 0) <= 5).length : inventory.filter((item) => item.actualPrice > item.sellingPrice * 0.8).length;

    const productSales = new Map<string, { totalSold: number; revenue: number }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        let inventoryItem;

        if (inventoryMode === 'quantity') {
          inventoryItem = inventory.find((inv) => inv.productId === item.productId);
        } else {
          inventoryItem = inventory.find((inv) => inv.barcode === item.barcode);
        }

        if (inventoryItem) {
          const current = productSales.get(inventoryItem.productId) || { totalSold: 0, revenue: 0 };
          const itemPrice = inventoryItem.sellingPrice;
          const discount = item.discount || 0;
          const finalPrice = itemPrice - (itemPrice * discount) / 100;

          productSales.set(inventoryItem.productId, {
            totalSold: current.totalSold + 1,
            revenue: current.revenue + finalPrice,
          });
        }
      });
    });

    const topSellingProducts = Array.from(productSales.entries())
      .map(([productId, data]) => {
        const product = products.find((p) => p.id === productId);
        return {
          productId,
          productName: product?.name || 'Unknown Product',
          totalSold: data.totalSold,
          revenue: data.revenue,
        };
      })
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const dayOrders = enrichedOrders.filter((order) => dayjs(order.createdAt).format('YYYY-MM-DD') === date);

      return {
        date,
        revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
        orders: dayOrders.length,
      };
    }).reverse();

    const customerSpending = new Map<string, number>();
    orders.forEach((order) => {
      const customerKey = `${order.customerName}-${order.customerPhone}`;
      const orderTotal = enrichedOrders.find((o) => o.id === order.id)?.total || 0;
      const current = customerSpending.get(customerKey) || 0;
      customerSpending.set(customerKey, current + orderTotal);
    });

    const customerTiers = Array.from(customerSpending.values()).reduce(
      (acc, spending) => {
        if (spending >= 10000) acc.vip++;
        else if (spending >= 5000) acc.gold++;
        else if (spending >= 1000) acc.silver++;
        else acc.bronze++;
        return acc;
      },
      { vip: 0, gold: 0, silver: 0, bronze: 0 },
    );

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts: products.length,
      averageOrderValue,
      completedOrders,
      pendingOrders,
      draftOrders,
      lowStockItems,
      topSellingProducts,
      recentSales: last7Days,
      customerTiers,
    };
  }, [orders, products, inventory]);

  return (
    <div className="p-6 space-y-6">
      <div className="gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Comprehensive insights into your business performance</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">Rs. {analyticsData.totalRevenue.toFixed(0)}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{analyticsData.totalOrders}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{analyticsData.totalCustomers}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">Rs. {analyticsData.averageOrderValue.toFixed(0)}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Orders</p>
                <p className="text-2xl font-bold">{analyticsData.completedOrders}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">{analyticsData.pendingOrders}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Draft Orders</p>
                <p className="text-2xl font-bold">{analyticsData.draftOrders}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100">
                <Package className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold">{analyticsData.lowStockItems}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topSellingProducts.length > 0 ? (
                analyticsData.topSellingProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{index + 1}</div>
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-muted-foreground">{product.totalSold} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Rs. {product.revenue.toFixed(0)}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Tiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-950">VIP Customers</p>
                    <p className="text-sm text-muted-foreground">Rs. 10,000+ spent</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{analyticsData.customerTiers.vip}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-950">Gold Customers</p>
                    <p className="text-sm text-muted-foreground">Rs. 5,000+ spent</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{analyticsData.customerTiers.gold}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-950">Silver Customers</p>
                    <p className="text-sm text-muted-foreground">Rs. 1,000+ spent</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{analyticsData.customerTiers.silver}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-950">Bronze Customers</p>
                    <p className="text-sm text-muted-foreground">Under Rs. 1,000 spent</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{analyticsData.customerTiers.bronze}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Sales (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.recentSales.map((day, index) => {
              const isToday = dayjs(day.date).isSame(dayjs(), 'day');
              const dayName = dayjs(day.date).format('dddd');
              const formattedDate = dayjs(day.date).format('MMM DD');

              return (
                <div key={day.date} className={`flex items-center justify-between p-3 rounded-lg ${isToday ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/10 text-muted-foreground'}`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{dayName}</p>
                      <p className="text-sm text-muted-foreground">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">Rs. {day.revenue.toFixed(0)}</p>
                    <p className="text-sm text-muted-foreground">{day.orders} orders</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <p className="font-medium text-blue-900">Revenue Performance</p>
                </div>
                <p className="text-sm text-blue-700">
                  {analyticsData.totalRevenue > 0
                    ? `Your business has generated Rs. ${analyticsData.totalRevenue.toFixed(0)} in total revenue with an average order value of Rs. ${analyticsData.averageOrderValue.toFixed(0)}.`
                    : 'Start making sales to see revenue insights.'}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <p className="font-medium text-green-900">Customer Base</p>
                </div>
                <p className="text-sm text-green-700">
                  {analyticsData.totalCustomers > 0
                    ? `You have ${analyticsData.totalCustomers} unique customers with ${analyticsData.customerTiers.vip + analyticsData.customerTiers.gold} high-value customers.`
                    : 'Build your customer base by completing more orders.'}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <p className="font-medium text-purple-900">Inventory Status</p>
                </div>
                <p className="text-sm text-purple-700">
                  {analyticsData.lowStockItems > 0
                    ? `You have ${analyticsData.lowStockItems} items that may need restocking. Monitor inventory levels regularly.`
                    : 'Your inventory levels look healthy. Keep monitoring for optimal stock management.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Order Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.totalOrders > 0 ? (
                <>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{((analyticsData.completedOrders / analyticsData.totalOrders) * 100).toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Orders Completed</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <span className="text-sm font-medium">{analyticsData.completedOrders}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(analyticsData.completedOrders / analyticsData.totalOrders) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending</span>
                      <span className="text-sm font-medium">{analyticsData.pendingOrders}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${(analyticsData.pendingOrders / analyticsData.totalOrders) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Drafts</span>
                      <span className="text-sm font-medium">{analyticsData.draftOrders}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-600 h-2 rounded-full" style={{ width: `${(analyticsData.draftOrders / analyticsData.totalOrders) * 100}%` }}></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No orders to analyze</p>
                  <p className="text-sm">Start taking orders to see completion rates</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
