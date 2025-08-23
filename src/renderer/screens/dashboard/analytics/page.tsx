import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { BarChart3Icon, CalendarIcon, DollarSignIcon, PackageIcon, ShoppingCartIcon, TrendingDownIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import dayjs from 'dayjs';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';

export default function Analytics() {
  const { data: orders } = useSWR('orders', () => window.api.db.get('orders'));
  const { data: products } = useSWR('products', () => window.api.db.get('products'));
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));
  const { data: customers } = useSWR('customers', () => window.api.db.get('customers'));

  const isMobile = useIsMobile();

  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const analytics = useMemo(() => {
    if (!orders || !products || !inventory) return null;

    const now = dayjs();
    const rangeStart = timeRange === '7d' ? now.subtract(7, 'days') : timeRange === '30d' ? now.subtract(30, 'days') : timeRange === '90d' ? now.subtract(90, 'days') : now.subtract(365, 'days');

    const filteredOrders = orders.filter((order: any) => dayjs(order.createdAt).isAfter(rangeStart));

    const completedOrders = filteredOrders.filter((order: any) => order.status === 'completed');

    // Calculate revenue
    const totalRevenue = completedOrders.reduce((sum: number, order: any) => {
      const orderTotal = (order.items || []).reduce((itemSum: number, item: any) => {
        const inventoryItem = inventory.find((inv: any) => inv.barcode === item.barcode);
        return itemSum + (inventoryItem?.sellingPrice || 0) - (item.discount || 0);
      }, 0);
      return sum + orderTotal - (order.discount || 0);
    }, 0);

    // Calculate previous period for comparison
    const prevRangeStart = timeRange === '7d' ? now.subtract(14, 'days') : timeRange === '30d' ? now.subtract(60, 'days') : timeRange === '90d' ? now.subtract(180, 'days') : now.subtract(730, 'days');

    const prevRangeEnd = rangeStart;
    const prevOrders = orders.filter((order: any) => {
      const orderDate = dayjs(order.createdAt);
      return orderDate.isAfter(prevRangeStart) && orderDate.isBefore(prevRangeEnd);
    });

    const prevCompletedOrders = prevOrders.filter((order: any) => order.status === 'completed');
    const prevRevenue = prevCompletedOrders.reduce((sum: number, order: any) => {
      const orderTotal = (order.items || []).reduce((itemSum: number, item: any) => {
        const inventoryItem = inventory.find((inv: any) => inv.barcode === item.barcode);
        return itemSum + (inventoryItem?.sellingPrice || 0) - (item.discount || 0);
      }, 0);
      return sum + orderTotal - (order.discount || 0);
    }, 0);

    // Calculate growth rates
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersGrowth = prevCompletedOrders.length > 0 ? ((completedOrders.length - prevCompletedOrders.length) / prevCompletedOrders.length) * 100 : 0;

    // Top products by revenue
    const productRevenue = new Map();
    completedOrders.forEach((order: any) => {
      (order.items || []).forEach((item: any) => {
        const product = products.find((p: any) => p.id === item.productId);
        const inventoryItem = inventory.find((inv: any) => inv.barcode === item.barcode);
        if (product && inventoryItem) {
          const revenue = inventoryItem.sellingPrice - (item.discount || 0);
          productRevenue.set(product.id, {
            ...product,
            revenue: (productRevenue.get(product.id)?.revenue || 0) + revenue,
            quantity: (productRevenue.get(product.id)?.quantity || 0) + 1,
          });
        }
      });
    });

    const topProducts = Array.from(productRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Daily revenue chart data
    const dailyRevenue = [];
    for (let i = 0; i < (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90); i++) {
      const date = now.subtract(i, 'days');
      const dayOrders = completedOrders.filter((order: any) => dayjs(order.createdAt).isSame(date, 'day'));

      const dayRevenue = dayOrders.reduce((sum: number, order: any) => {
        const orderTotal = (order.items || []).reduce((itemSum: number, item: any) => {
          const inventoryItem = inventory.find((inv: any) => inv.barcode === item.barcode);
          return itemSum + (inventoryItem?.sellingPrice || 0) - (item.discount || 0);
        }, 0);
        return sum + orderTotal - (order.discount || 0);
      }, 0);

      dailyRevenue.unshift({
        date: date.format('YYYY-MM-DD'),
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    return {
      totalRevenue,
      totalOrders: completedOrders.length,
      avgOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      revenueGrowth,
      ordersGrowth,
      topProducts,
      dailyRevenue,
      totalCustomers: customers?.length || 0,
      lowStockItems: inventory.filter((item: any) => {
        const productInventory = inventory.filter((inv: any) => inv.productId === item.productId);
        return productInventory.length < 5;
      }).length,
    };
  }, [orders, products, inventory, customers, timeRange]);

  if (!analytics) {
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
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                  <div className="text-2xl font-bold">Rs. {analytics.totalRevenue.toFixed(2)}</div>
                  <div className={`text-sm flex items-center gap-1 ${analytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.revenueGrowth >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
                    {Math.abs(analytics.revenueGrowth).toFixed(1)}% vs prev period
                  </div>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSignIcon className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Orders</div>
                  <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                  <div className={`text-sm flex items-center gap-1 ${analytics.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.ordersGrowth >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <TrendingDownIcon className="h-3 w-3" />}
                    {Math.abs(analytics.ordersGrowth).toFixed(1)}% vs prev period
                  </div>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingCartIcon className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Avg Order Value</div>
                  <div className="text-2xl font-bold">Rs. {analytics.avgOrderValue.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Per completed order</div>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <BarChart3Icon className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Customers</div>
                  <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
                  <div className="text-sm text-muted-foreground">Registered customers</div>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <RevenueChart data={analytics.dailyRevenue} />
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topProducts.map((product: any, index: number) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.quantity} sold</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">Rs. {product.revenue.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Rs. {(product.revenue / product.quantity).toFixed(2)} avg</div>
                    </div>
                  </div>
                ))}
                {analytics.topProducts.length === 0 && <div className="text-center py-8 text-muted-foreground">No sales data available for the selected period</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductAnalytics products={products} orders={orders} inventory={inventory} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <InventoryAnalytics inventory={inventory} products={products} orders={orders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RevenueChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>;
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <div className="w-full h-full">
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 h-full">
            <div className="flex-1 flex items-end w-full">
              <div
                className="w-full bg-blue-500 rounded-t-sm min-h-[4px] transition-all hover:bg-blue-600"
                style={{
                  height: maxRevenue > 0 ? `${(item.revenue / maxRevenue) * 100}%` : '4px',
                }}
                title={`${dayjs(item.date).format('MMM DD')}: Rs. ${item.revenue.toFixed(2)}`}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">{dayjs(item.date).format('MM/DD')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductAnalytics({ products, orders, inventory, timeRange }: any) {
  const productStats = useMemo(() => {
    if (!products || !orders || !inventory) return [];

    const now = dayjs();
    const rangeStart = timeRange === '7d' ? now.subtract(7, 'days') : timeRange === '30d' ? now.subtract(30, 'days') : timeRange === '90d' ? now.subtract(90, 'days') : now.subtract(365, 'days');

    const filteredOrders = orders.filter((order: any) => dayjs(order.createdAt).isAfter(rangeStart) && order.status === 'completed');

    const productMap = new Map();

    products.forEach((product: any) => {
      productMap.set(product.id, {
        ...product,
        totalSold: 0,
        revenue: 0,
        inventoryCount: inventory.filter((inv: any) => inv.productId === product.id).length,
      });
    });

    filteredOrders.forEach((order: any) => {
      (order.items || []).forEach((item: any) => {
        const product = productMap.get(item.productId);
        const inventoryItem = inventory.find((inv: any) => inv.barcode === item.barcode);

        if (product && inventoryItem) {
          product.totalSold += 1;
          product.revenue += inventoryItem.sellingPrice - (item.discount || 0);
        }
      });
    });

    return Array.from(productMap.values()).sort((a, b) => b.totalSold - a.totalSold);
  }, [products, orders, inventory, timeRange]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productStats.slice(0, 10).map((product: any) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">{product.categories?.join(', ') || 'No categories'}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right text-sm">
                  <div>
                    <div className="font-semibold">{product.totalSold}</div>
                    <div className="text-muted-foreground">Sold</div>
                  </div>
                  <div>
                    <div className="font-semibold">Rs. {product.revenue.toFixed(2)}</div>
                    <div className="text-muted-foreground">Revenue</div>
                  </div>
                  <div>
                    <div className="font-semibold">{product.inventoryCount}</div>
                    <div className="text-muted-foreground">In Stock</div>
                  </div>
                </div>
              </div>
            ))}
            {productStats.length === 0 && <div className="text-center py-8 text-muted-foreground">No product data available</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryAnalytics({ inventory, products, orders }: any) {
  const inventoryStats = useMemo(() => {
    if (!inventory || !products) return null;

    const totalItems = inventory.length;
    const uniqueProducts = new Set(inventory.map((item: any) => item.productId)).size;

    // Calculate low stock items (less than 5 items per product)
    const productCounts = new Map();
    inventory.forEach((item: any) => {
      productCounts.set(item.productId, (productCounts.get(item.productId) || 0) + 1);
    });

    const lowStockProducts = Array.from(productCounts.entries())
      .filter(([_, count]) => count < 5)
      .map(([productId, count]) => {
        const product = products.find((p: any) => p.id === productId);
        return { product, count };
      })
      .filter((item) => item.product);

    // Calculate total inventory value
    const totalValue = inventory.reduce((sum: number, item: any) => sum + (item.actualPrice || 0), 0);

    const totalSellingValue = inventory.reduce((sum: number, item: any) => sum + (item.sellingPrice || 0), 0);

    return {
      totalItems,
      uniqueProducts,
      lowStockProducts,
      totalValue,
      totalSellingValue,
      potentialProfit: totalSellingValue - totalValue,
    };
  }, [inventory, products]);

  if (!inventoryStats) {
    return <div>Loading inventory analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Inventory Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Items</div>
              <div className="text-2xl font-bold">{inventoryStats.totalItems}</div>
            </div>
            <PackageIcon className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Unique Products</div>
              <div className="text-2xl font-bold">{inventoryStats.uniqueProducts}</div>
            </div>
            <BarChart3Icon className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Inventory Value</div>
              <div className="text-2xl font-bold">Rs. {inventoryStats.totalValue.toFixed(2)}</div>
            </div>
            <DollarSignIcon className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Potential Profit</div>
              <div className="text-2xl font-bold">Rs. {inventoryStats.potentialProfit.toFixed(2)}</div>
            </div>
            <TrendingUpIcon className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Low Stock Alert</span>
            <Badge variant="destructive">{inventoryStats.lowStockProducts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryStats.lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">All products are well stocked!</div>
          ) : (
            <div className="space-y-3">
              {inventoryStats.lowStockProducts.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-sm text-muted-foreground">{item.product.categories?.join(', ') || 'No categories'}</div>
                  </div>
                  <Badge variant="destructive">{item.count} left</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
