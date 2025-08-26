import { Mail, MapPin, Phone, Store } from 'lucide-react';

import { ImageWithFallback } from '@/components/image-fallback';
import { Order } from 'src/types';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import useSWR from 'swr';
import useShop from '@/hooks/use-shop';

export function ShopHeader() {
  const shop = useShop();

  const { data: orders } = useSWR('orders', () => window.api.db.get('orders'));

  const todayOrders = useMemo(() => {
    if (!orders) return 0;
    const today = dayjs().startOf('day');
    return orders.filter((order: Order) => dayjs(order.createdAt).isAfter(today)).length;
  }, [orders]);

  if (!shop) return null;

  return (
    <div className="border-b bg-gradient-to-r from-background/80 to-background/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
            <ImageWithFallback src={shop.logo} alt={shop.name} className="w-full h-full object-cover" fallback={<Store className="w-8 h-8 text-muted-foreground" />} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{shop.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              {shop.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {shop.location}
                </div>
              )}
              {shop.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {shop.phone}
                </div>
              )}
              {shop.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {shop.email}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Today's Orders</div>
            <div className="text-2xl font-bold">{todayOrders}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Time</div>
            <div className="text-lg font-medium">{dayjs().format('HH:mm A')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
