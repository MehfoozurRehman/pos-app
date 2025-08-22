import { AnimatePresence, motion } from 'motion/react';
import { BoxIcon, EyeIcon, Image } from 'lucide-react';
import { cartVisibilityAtom, orderQueueVisibilityAtom } from '@renderer/state';
import { orders, products } from '@renderer/data';
import { useAtom, useAtomValue } from 'jotai/react';
import { useEffect, useState } from 'react';

import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import { ImageWithFallback } from '../../components/image-fallback';
import { Input } from '@renderer/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrollContainer } from '@/components/scroll-container';
import dayjs from 'dayjs';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useIsMobile } from '@renderer/hooks/use-mobile';
import { useNavigate } from 'react-router';

export default function Dashboard() {
  const isMobile = useIsMobile();

  const cartVisible = useAtomValue(cartVisibilityAtom);

  const orderQueueVisible = useAtomValue(orderQueueVisibilityAtom);

  const width = isMobile ? '100%' : cartVisible ? 'calc(100% - 400px)' : '100%';

  const isAnyPanelInvisible = !cartVisible || !orderQueueVisible;

  return (
    <motion.div initial={{ paddingRight: 0 }} animate={{ paddingRight: isAnyPanelInvisible ? '50px' : '0px' }} className={`flex gap-4 h-full overflow-hidden`}>
      <motion.div initial={{ width }} animate={{ width }} className="flex flex-col justify-end h-full border-r p-4 gap-4">
        <OrderPanel />
        <ProductsPanel />
      </motion.div>
      <OrderDetails />
    </motion.div>
  );
}

function ProductsPanel() {
  const [parent] = useAutoAnimate();

  const [selectedTag, setSelectedTag] = useState<string>('All');

  const orderQueueVisible = useAtomValue(orderQueueVisibilityAtom);

  const tags = Array.from(new Set(products.flatMap((product) => product.categories)));

  const filteredProducts = products.filter((product) => selectedTag === 'All' || product.categories.includes(selectedTag as (typeof product.categories)[number]));

  return (
    <motion.div
      layout
      initial={{ height: orderQueueVisible ? 'calc(100% - 300px)' : '100%' }}
      animate={{ height: orderQueueVisible ? 'calc(100% - 300px)' : '100%' }}
      transition={{ duration: 0.28 }}
      className="flex flex-col p-4 bg-background/30 rounded-lg w-full gap-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products</h2>
        <Input type="search" placeholder="Search products" className="max-w-[300px]" />
      </div>
      <ScrollContainer containerClassName="bg-sidebar/50 p-2 rounded-lg" childrenClassName="flex gap-2">
        {['All', ...tags].map((product) => (
          <Button variant={product === selectedTag ? 'default' : 'outline'} className="border" key={product} onClick={() => setSelectedTag(product)}>
            {product}
          </Button>
        ))}
      </ScrollContainer>
      <ScrollArea className={`${orderQueueVisible ? 'max-h-[calc(100vh-575px)]' : 'max-h-[calc(100vh-250px)]'} overflow-y-auto bg-sidebar/50 p-3 rounded-lg`}>
        <div ref={parent} className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}

function ProductCard({ product }: { product: (typeof products)[number] }) {
  return (
    <Card className="p-0 w-full pb-4 cursor-pointer bg-background/40 hover:bg-background/30 rounded-lg shadow-sm transform hover:scale-[1.01] transition gap-2">
      <div className="flex items-center justify-center h-[140px] bg-gradient-to-br from-muted/20 to-muted/5 rounded-t-lg">
        <ImageWithFallback src={product.picture} alt={product.name} className="w-full h-full object-cover" fallback={<Image className="text-foreground opacity-80" size={48} />} />
      </div>
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</div>
        <div className="text-foreground font-medium">Rs. {product.averagePrice}</div>
        <div className="flex gap-2 flex-wrap">
          {product.categories.map((tag) => (
            <Badge variant="outline" key={tag}>
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      <div className="border-t pt-3 flex justify-end pr-4">
        <Button variant="outline" size="sm" className="w-fit">
          Add to Order
        </Button>
      </div>
    </Card>
  );
}

function OrderPanel() {
  const navigate = useNavigate();

  const cartVisible = useAtomValue(cartVisibilityAtom);
  const [orderQueueVisible, setOrderQueueVisible] = useAtom(orderQueueVisibilityAtom);

  return (
    <>
      {!orderQueueVisible && (
        <Button variant="outline" onClick={() => setOrderQueueVisible(true)} className={`absolute -right-15 ${cartVisible ? 'top-30' : 'top-75'} rotate-90`}>
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
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </ScrollContainer>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function OrderCard({ order }: { order: (typeof orders)[number] }) {
  return (
    <Card className="p-0 min-w-[250px] gap-4 pb-4 cursor-pointer bg-background/30 hover:bg-background">
      <div className="font-bold border-b p-3">#{order.orderId}</div>
      <div className="px-4 flex flex-col gap-4">
        <div className="font-bold">{order.customerName}</div>
        <div className="text-foreground">{dayjs(order.createdAt).format('DD MM YYYY HH:mm A')}</div>
        <Button variant="outline" className="w-fit">
          <BoxIcon />
          {order.items.length} Item{order.items.length > 1 ? 's' : ''}
        </Button>
      </div>
    </Card>
  );
}

function OrderDetails() {
  const [cartVisible, setCartVisible] = useAtom(cartVisibilityAtom);

  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setCartVisible(false);
    } else {
      setCartVisible(true);
    }
  }, [isMobile]);

  const order = {
    customerName: 'Hussnain',
    customerPhone: '0300-1234567',
    items: [
      {
        id: 1,
        name: 'Intel Core i7 12700K Processor',
        barcode: '1234567890',
        price: 350,
        discount: 20,
      },
      {
        id: 2,
        name: 'Corsair Vengeance 32GB DDR5 RAM',
        barcode: '9876543210',
        price: 180,
        discount: 0,
      },
    ],
    discount: 10,
  };

  const handleRemoveItem = (id: number) => {
    alert('Remove item ' + id);
  };

  const handleClearCart = () => {
    alert('Cart cleared');
  };

  const subtotal = order.items.reduce((sum, item) => sum + (item.price - (item.discount || 0)), 0);

  const total = subtotal - (order.discount || 0);

  return (
    <>
      {!cartVisible && (
        <Button variant="outline" onClick={() => setCartVisible(true)} className="absolute -right-15 top-30 rotate-90">
          <EyeIcon />
          <span>View Order Details</span>
        </Button>
      )}
      <AnimatePresence>
        {cartVisible && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.2 }}
            className={`${isMobile ? 'absolute right-0 max-w-[70vw] bg-background' : 'max-w-[400px] bg-background/30'} flex flex-col w-full p-4 rounded-lg shadow-lg border h-full`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg">Order Details</span>
              <Button variant="outline" onClick={() => setCartVisible(false)}>
                <EyeIcon />
              </Button>
            </div>
            <div className="mb-2">
              <div className="font-medium">Customer Name</div>
              <Input value={order.customerName} />
            </div>
            <div className="mb-2">
              <div className="font-medium">Customer Phone</div>
              <Input value={order.customerPhone} />
            </div>
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="font-medium mb-2">Items</div>
              <div className="flex flex-col gap-2">
                {order.items.map((item) => (
                  <Card key={item.id} className="flex items-center justify-between p-2 bg-card/60">
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">Barcode: {item.barcode}</div>
                      {item.discount ? <div className="text-xs text-green-600">Discount: Rs. {item.discount}</div> : null}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold">Rs. {item.price - (item.discount || 0)}</span>
                      <Button size="icon" variant="ghost" onClick={() => handleRemoveItem(item.id)} title="Remove">
                        ×
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <div className="border-t pt-3 mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal</span>
                <span>Rs. {subtotal}</span>
              </div>
              {order.discount ? (
                <div className="flex justify-between text-sm mb-1 text-green-700">
                  <span>Order Discount</span>
                  <span>- Rs. {order.discount}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>Rs. {total}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-auto">
              <Button variant="destructive" onClick={handleClearCart} className="flex-1">
                Clear Cart
              </Button>
              <Button variant="default" className="flex-1">
                Checkout
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
