import { AnimatePresence, motion } from 'motion/react';
import { BoxIcon, EyeIcon, Image } from 'lucide-react';
import { cartVisibilityAtom, orderQueueVisibilityAtom } from '@renderer/state';
import { useAtom, useAtomValue } from 'jotai/react';

import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrollContainer } from '@/components/scroll-container';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router';

const products = [
  {
    id: 1,
    name: 'Intel Core i7 12700K Processor',
    price: 350,
    tags: ['cpu', 'intel', '12th-gen'],
  },
  {
    id: 2,
    name: 'AMD Ryzen 9 5900X Processor',
    price: 420,
    tags: ['cpu', 'amd', 'zen3'],
  },
  {
    id: 3,
    name: 'NVIDIA GeForce RTX 4080 GPU',
    price: 1200,
    tags: ['gpu', 'nvidia', 'graphics-card'],
  },
  {
    id: 4,
    name: 'AMD Radeon RX 7900 XT GPU',
    price: 950,
    tags: ['gpu', 'amd', 'graphics-card'],
  },
  {
    id: 5,
    name: 'Corsair Vengeance 32GB DDR5 RAM',
    price: 180,
    tags: ['memory', 'ram', 'ddr5'],
  },
  {
    id: 6,
    name: 'G.Skill Trident Z 16GB DDR4 RAM',
    price: 85,
    tags: ['memory', 'ram', 'ddr4'],
  },
  {
    id: 7,
    name: 'Samsung 980 Pro 1TB NVMe SSD',
    price: 130,
    tags: ['storage', 'ssd', 'nvme'],
  },
  {
    id: 8,
    name: 'Seagate Barracuda 2TB HDD',
    price: 60,
    tags: ['storage', 'hdd', 'sata'],
  },
  {
    id: 9,
    name: 'ASUS ROG Strix Z690 Motherboard',
    price: 290,
    tags: ['motherboard', 'asus', 'intel'],
  },
  {
    id: 10,
    name: 'MSI MAG B550 Tomahawk Motherboard',
    price: 160,
    tags: ['motherboard', 'msi', 'amd'],
  },
  {
    id: 11,
    name: 'Cooler Master Hyper 212 RGB CPU Cooler',
    price: 50,
    tags: ['cooler', 'air-cooling', 'rgb'],
  },
  {
    id: 12,
    name: 'NZXT Kraken X63 Liquid Cooler',
    price: 150,
    tags: ['cooler', 'aio', 'liquid-cooling'],
  },
  {
    id: 13,
    name: 'Corsair RM850x 850W PSU',
    price: 140,
    tags: ['psu', 'power-supply', 'modular'],
  },
  {
    id: 14,
    name: 'EVGA 650W Bronze PSU',
    price: 75,
    tags: ['psu', 'power-supply', 'budget'],
  },
  {
    id: 15,
    name: 'Phanteks Eclipse P400A ATX Case',
    price: 90,
    tags: ['case', 'mid-tower', 'phanteks'],
  },
  {
    id: 16,
    name: 'Lian Li PC-O11 Dynamic Case',
    price: 160,
    tags: ['case', 'mid-tower', 'lian-li'],
  },
  {
    id: 17,
    name: 'Logitech G Pro X Mechanical Keyboard',
    price: 120,
    tags: ['keyboard', 'mechanical', 'gaming'],
  },
  {
    id: 18,
    name: 'Razer DeathAdder V2 Mouse',
    price: 60,
    tags: ['mouse', 'gaming', 'razer'],
  },
  {
    id: 19,
    name: 'Dell UltraSharp 27" 4K Monitor',
    price: 480,
    tags: ['monitor', '4k', 'dell'],
  },
  {
    id: 20,
    name: 'ASUS TUF Gaming 27" 165Hz Monitor',
    price: 300,
    tags: ['monitor', 'gaming', 'asus'],
  },
];

export default function Dashboard() {
  const cartVisible = useAtomValue(cartVisibilityAtom);
  const orderQueueVisible = useAtomValue(orderQueueVisibilityAtom);

  const isAnyPanelInvisible = !cartVisible || !orderQueueVisible;

  return (
    <motion.div initial={{ paddingRight: 0 }} animate={{ paddingRight: isAnyPanelInvisible ? '50px' : '0px' }} className={`flex gap-4 h-full overflow-hidden`}>
      <MainPanel>
        <OrderPanel />
        <ProductsPanel />
      </MainPanel>
      <OrderDetails />
    </motion.div>
  );
}

function ProductsPanel() {
  const orderQueueVisible = useAtomValue(orderQueueVisibilityAtom);

  return (
    <motion.div
      layout
      initial={{ height: orderQueueVisible ? 'calc(100% - 300px)' : '100%' }}
      animate={{ height: orderQueueVisible ? 'calc(100% - 300px)' : '100%' }}
      transition={{ duration: 0.28 }}
      className="flex flex-col p-4 bg-background/50 rounded-lg w-full gap-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products</h2>
        <Input type="search" placeholder="Search products" className="max-w-[300px]" />
      </div>
      <ScrollContainer containerClassName="bg-sidebar/50 p-2 rounded-lg" childrenClassName="flex gap-2">
        {['All', 'CPU', 'GPU', 'Memory', 'Storage', 'Motherboard', 'Peripherals'].map((product) => (
          <Button variant="outline" key={product} className="bg-background/30 hover:bg-background/60 transition">
            {product}
          </Button>
        ))}
      </ScrollContainer>
      <ScrollArea className={`${orderQueueVisible ? 'max-h-[calc(100vh-575px)]' : 'max-h-[calc(100vh-200px)]'} overflow-y-auto bg-sidebar/50 p-3 rounded-lg`}>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}

function MainPanel({ children }: { children: React.ReactNode }) {
  const cartVisible = useAtomValue(cartVisibilityAtom);

  const width = cartVisible ? 'calc(100% - 400px)' : '100%';

  return (
    <motion.div initial={{ width }} animate={{ width }} className="flex flex-col justify-end h-full border-r p-4 gap-4">
      {children}
    </motion.div>
  );
}

function ProductCard({ product }: { product: (typeof products)[number] }) {
  return (
    <Card className="p-0 w-full pb-4 cursor-pointer bg-background/40 hover:bg-background/50 rounded-lg shadow-sm transform hover:scale-[1.01] transition">
      <div className="flex items-center justify-center h-[140px] bg-gradient-to-br from-muted/20 to-muted/5 rounded-t-lg">
        <Image className="text-foreground opacity-80" size={48} />
      </div>
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</div>
        <div className="text-foreground font-medium">Rs. {product.price}</div>
        <div className="flex gap-2 flex-wrap">
          {product.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </div>
      <div className="border-t pt-3 flex justify-end pr-4">
        <Button variant="default" size="sm" className="w-fit">
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
        <Button variant="default" onClick={() => setOrderQueueVisible(true)} className={`absolute -right-15 ${cartVisible ? 'top-30' : 'top-75'} rotate-90`}>
          <EyeIcon />
          <span>View Order Queue</span>
        </Button>
      )}
      <AnimatePresence>
        {orderQueueVisible && (
          <div className="flex flex-col p-4 bg-background/50 rounded-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Order Queue</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setOrderQueueVisible(false)}>
                  <EyeIcon />
                </Button>
                <Button onClick={() => navigate('/dashboard/orders')} variant="default">
                  View All
                </Button>
              </div>
            </div>
            <ScrollContainer containerClassName="bg-sidebar/50 p-2 rounded-lg" childrenClassName="flex gap-2">
              <OrderCard />
              <OrderCard />
              <OrderCard />
              <OrderCard />
              <OrderCard />
              <OrderCard />
              <OrderCard />
              <OrderCard />
            </ScrollContainer>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function OrderCard() {
  return (
    <Card className="p-0 min-w-[250px] gap-4 pb-4 cursor-pointer bg-background/50 hover:bg-background">
      <div className="font-bold border-b p-3">#12334</div>
      <div className="px-4 flex flex-col gap-4">
        <div className="font-bold">Hussnain</div>
        <div className="text-foreground">{dayjs().format('DD MM YYYY HH:mm A')}</div>
        <Button variant="outline" className="w-fit">
          <BoxIcon />
          {5} Items
        </Button>
      </div>
    </Card>
  );
}

function OrderDetails() {
  const [cartVisible, setCartVisible] = useAtom(cartVisibilityAtom);

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
        <Button variant="default" onClick={() => setCartVisible(true)} className="absolute -right-15 top-30 rotate-90">
          <EyeIcon />
          <span>View Order Details</span>
        </Button>
      )}
      <AnimatePresence>
        {cartVisible && (
          <motion.div className="flex flex-col w-full max-w-[400px] p-4 bg-background/50 rounded-lg shadow-lg border h-full">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg">Order Details</span>
              <Button variant="outline" onClick={() => setCartVisible(false)}>
                <EyeIcon />
              </Button>
            </div>
            <div className="mb-2">
              <div className="font-semibold">Customer</div>
              <div className="text-sm text-muted-foreground">
                {order.customerName} ({order.customerPhone})
              </div>
            </div>
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="font-semibold mb-2">Items</div>
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
