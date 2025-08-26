import { BoxIcon, EyeIcon, X } from 'lucide-react';
import { cartAtom, cartVisibilityAtom, orderQueueVisibilityAtom } from '@/constants/state';
import { useAtom, useAtomValue } from 'jotai/react';
import useSWR, { mutate } from 'swr';

import { AnimatePresence } from 'motion/react';
import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import { Order } from 'src/types';
import { ScrollContainer } from '@/components/scroll-container';
import dayjs from 'dayjs';
import { logger } from '@renderer/utils/logger';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

export function OrderPanel() {
  const navigate = useNavigate();

  const cartVisible = useAtomValue(cartVisibilityAtom);
  const [orderQueueVisible, setOrderQueueVisible] = useAtom(orderQueueVisibilityAtom);

  return (
    <>
      {!orderQueueVisible && (
        <Button variant="outline" onClick={() => setOrderQueueVisible(true)} className={`absolute -right-15 ${cartVisible ? 'top-25' : 'top-65'} rotate-90`}>
          <EyeIcon />
          <span>View Order Queue</span>
        </Button>
      )}
      <AnimatePresence>
        {orderQueueVisible && (
          <div className="flex flex-col p-4 bg-background/30 rounded-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Order Queue</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setOrderQueueVisible(false)}>
                  <EyeIcon />
                </Button>
                <Button onClick={() => navigate('/dashboard/orders')} variant="outline">
                  View All
                </Button>
              </div>
            </div>
            <ScrollContainer containerClassName="bg-sidebar/50 p-2 rounded-lg" childrenClassName="flex gap-2">
              <OrderQueue />
            </ScrollContainer>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function OrderQueue() {
  const { data: orders } = useSWR('orders', () => window.api.db.get('orders'));

  const list = (orders || []).filter((o) => {
    const status = o.status || 'draft';
    return status === 'cart' || status === 'draft' || status === 'pending';
  });

  if (!orders || list.length === 0) {
    return (
      <div className="w-full p-4">
        <Card className="p-4 text-center bg-card/50">
          <div className="text-md font-semibold mb-1">No orders in queue</div>
          <div className="text-sm text-muted-foreground">Start a new draft by adding products to the cart.</div>
        </Card>
      </div>
    );
  }

  return (
    <>
      {list.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [, setSelectedOrder] = useAtom(cartAtom);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cart':
        return <Badge variant="secondary">In Cart</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'pending':
        return <Badge variant="default">Pending</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const handleDeleteOrder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await window.api.db.delete('orders', order.id);
      mutate('orders');
      toast.success('Order deleted successfully');
    } catch (error) {
      logger.error('Failed to delete order', 'order-delete', { orderId: order.id, error });
      toast.error('Failed to delete order');
    }
  };

  const canDelete = order.status === 'cart' || order.status === 'draft';

  return (
    <Card onClick={() => setSelectedOrder(order)} className={`p-0 min-w-[250px] gap-4 pb-4 cursor-pointer bg-background/30 hover:bg-background`}>
      <div className="font-bold border-b p-3 flex items-center justify-between">
        <span>#{order.orderId}</span>
        <div className="flex items-center gap-2">
          {getStatusBadge(order.status || 'draft')}
          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteOrder}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete order"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="px-4 flex flex-col gap-4">
        <div className="font-bold">{order.customerName || 'No Customer'}</div>
        <div className="text-foreground">{dayjs(order.createdAt).format('DD MM YYYY HH:mm A')}</div>
        <Button variant="outline" className="w-fit">
          <BoxIcon />
          {order.items.length} Item{order.items.length > 1 ? 's' : ''}
        </Button>
      </div>
    </Card>
  );
}