import { AlertCircle, CheckCircle, Clock, DollarSign, Package, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@renderer/components/ui/card';

import { EnrichedOrder } from 'src/types';

type OrderStatsProps = {
  orders: EnrichedOrder[];
};

export function OrderStats({ orders }: OrderStatsProps) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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

  const stats = [
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Revenue',
      value: `Rs. ${totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Avg. Order Value',
      value: `Rs. ${averageOrderValue.toFixed(0)}`,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Completed',
      value: completedOrders.toString(),
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Pending',
      value: pendingOrders.toString(),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Drafts',
      value: draftOrders.toString(),
      icon: AlertCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
