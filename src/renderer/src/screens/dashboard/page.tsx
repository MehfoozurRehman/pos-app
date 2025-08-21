import { AnimatePresence, motion } from 'motion/react';
import { BoxIcon, EyeIcon } from 'lucide-react';
import { useAtom, useAtomValue } from 'jotai/react';

import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import { cartVisibilityAtom } from '@renderer/state';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router';
import { useRef } from 'react';

function ScrollContainer({
  children,
  containerClassName,
  childrenClassName,
  ...props
}: { children: React.ReactNode } & React.HTMLProps<HTMLDivElement> & {
    containerClassName?: string;
    childrenClassName?: string;
  }) {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    startX.current = e.pageX - (ref.current?.offsetLeft || 0);
    scrollLeft.current = ref.current?.scrollLeft || 0;
    document.body.style.cursor = 'grabbing';
  };

  const onMouseLeave = () => {
    isDragging.current = false;
    document.body.style.cursor = '';
  };

  const onMouseUp = () => {
    isDragging.current = false;
    document.body.style.cursor = '';
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 1;
    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div
      ref={ref}
      style={{ overflow: 'hidden', cursor: 'grab', width: '100%' }}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      {...props}
      className={containerClassName}
    >
      <div style={{ whiteSpace: 'nowrap' }} className={childrenClassName}>
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className=" flex gap-4 h-full overflow-hidden">
      <MainPanel>
        <OrderPanel />
        <div className="flex flex-col h-full p-4 bg-background/50 rounded-lg w-full">
          <div className="flex items-center justify-between mb-4">
            Products
            <Input type="search" placeholder="Search products" className="max-w-[300px]" />
          </div>
          <ScrollContainer containerClassName="bg-sidebar/50 p-2 rounded-lg" childrenClassName="flex gap-2">
            {[
              'Product 1',
              'Product 2',
              'Product 3',
              'Product 4',
              'Product 5',
              'Product 6',
              'Product 7',
              'Product 8',
              'Product 9',
              'Product 10',
              'Product 11',
              'Product 12',
              'Product 4',
              'Product 5',
              'Product 6',
              'Product 7',
              'Product 8',
              'Product 9',
              'Product 10',
              'Product 11',
              'Product 12',
            ].map((product) => (
              <Button variant="outline" key={product} className={`${true ? 'bg-background/50! hover:bg-background' : ''}`}>
                {product}
              </Button>
            ))}
          </ScrollContainer>
          <div className="flex flex-wrap flex-1"></div>
        </div>
      </MainPanel>
      <OrderDetails />
    </div>
  );
}

function MainPanel({ children }: { children: React.ReactNode }) {
  const cartVisible = useAtomValue(cartVisibilityAtom);

  return (
    <motion.div
      initial={{ width: cartVisible ? 'calc(100% - 400px)' : '100%' }}
      animate={{ width: cartVisible ? 'calc(100% - 400px)' : '100%' }}
      className={`flex flex-col h-full border-r p-4 gap-4 ${cartVisible ? '' : 'pr-15'}`}
    >
      {children}
    </motion.div>
  );
}

function OrderPanel() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col p-4 bg-background/50 rounded-lg w-full">
      <div className="flex items-center justify-between mb-4">
        Order Queue
        <div className="flex items-center gap-2">
          <Button variant="outline">
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
  );
}

function OrderDetails() {
  const [cartVisible, setCartVisible] = useAtom(cartVisibilityAtom);

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
          <motion.div className="flex flex-col w-full max-w-[400px] p-4">
            <div className="flex items-center justify-between mb-4">
              Order Details
              <Button variant="outline" onClick={() => setCartVisible(false)}>
                <EyeIcon />
              </Button>
            </div>
          </motion.div>
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
