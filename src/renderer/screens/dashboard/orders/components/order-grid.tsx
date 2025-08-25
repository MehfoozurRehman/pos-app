import { Card, CardContent } from '@renderer/components/ui/card';

import { EnrichedOrder } from 'src/types';
import { OrderCard } from './order-card';
import { ShoppingBag } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

type OrderGridProps = {
  orders: EnrichedOrder[];
  onSelectOrder: (order: EnrichedOrder) => void;
  selectedOrder: EnrichedOrder | null;
  onUpdateStatus: (orderId: string, status: string) => void;
  onDeleteOrder: (orderId: string) => void;
};

export function OrderGrid({ orders, onSelectOrder, selectedOrder, onUpdateStatus, onDeleteOrder }: OrderGridProps) {
  const [parent] = useAutoAnimate();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Orders List</h2>
      <div ref={parent} className="space-y-3">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">Orders will appear here once they are created</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} onClick={() => onSelectOrder(order)} isSelected={selectedOrder?.id === order.id} onUpdateStatus={onUpdateStatus} onDeleteOrder={onDeleteOrder} />
          ))
        )}
      </div>
    </div>
  );
}
