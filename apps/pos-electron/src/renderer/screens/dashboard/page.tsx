import { cartVisibilityAtom, orderQueueVisibilityAtom } from '@/constants/state';

import { DashboardStats } from './components/dashboard-stats';
import { OrderDetails } from './components/order-details';
import { OrderPanel } from './components/order-panel';
import { ProductsPanel } from './components/products-panel';
import { ShopHeader } from './components/shop-header';
import { motion } from 'motion/react';
import { useAtomValue } from 'jotai/react';
import { useIsMobile } from '@renderer/hooks/use-mobile';
import useSWR from 'swr';

export default function Dashboard() {
  const isMobile = useIsMobile();
  const cartVisible = useAtomValue(cartVisibilityAtom);
  const orderQueueVisible = useAtomValue(orderQueueVisibilityAtom);
  const { data: shop } = useSWR('shop', () => window.api.db.get('shop'));

  const width = isMobile ? '100%' : cartVisible ? 'calc(100% - 400px)' : '100%';
  const isAnyPanelInvisible = !cartVisible || !orderQueueVisible;
  const inventoryMode = shop?.inventoryMode || 'barcode';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <motion.div initial={{ paddingRight: 0 }} animate={{ paddingRight: isAnyPanelInvisible ? '50px' : '0px' }} className="flex flex-col gap-4 flex-1 overflow-hidden">
        <ShopHeader />
        <div className="flex gap-4 flex-1">
          <motion.div initial={{ width }} animate={{ width }} className="flex flex-col h-full border-r p-4 gap-4">
            <DashboardStats />
            <OrderPanel />
            <ProductsPanel inventoryMode={inventoryMode} />
          </motion.div>
          <OrderDetails />
        </div>
      </motion.div>
    </div>
  );
}



