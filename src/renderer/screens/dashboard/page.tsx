import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, BoxIcon, Clock, DollarSign, EyeIcon, ImageIcon, Mail, MapPin, Package, Phone, ShoppingCart, Store, TrendingUp, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Order, Product } from 'src/types';
import { cartAtom, cartVisibilityAtom, orderQueueVisibilityAtom } from '@/constants/state';
import { useAtom, useAtomValue } from 'jotai/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import { ImageWithFallback } from '@/components/image-fallback';
import { Input } from '@renderer/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrollContainer } from '@/components/scroll-container';
import dayjs from 'dayjs';
import { toast } from 'sonner';
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
    <div className="flex flex-col h-full overflow-hidden">
      <GlobalBarcodeScanner />
      <motion.div initial={{ paddingRight: 0 }} animate={{ paddingRight: isAnyPanelInvisible ? '50px' : '0px' }} className="flex flex-col gap-4 flex-1 overflow-hidden">
        <ShopHeader />
        <div className="flex gap-4 flex-1">
          <motion.div initial={{ width }} animate={{ width }} className="flex flex-col h-full border-r p-4 gap-4">
            <DashboardStats />
            <OrderPanel />
            <ProductsPanel />
          </motion.div>
          <OrderDetails />
        </div>
      </motion.div>
    </div>
  );
}

function GlobalBarcodeScanner() {
  const [, setCart] = useAtom(cartAtom);
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));
  const { data: products } = useSWR('products', () => window.api.db.get('products'));
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [lastInputTime, setLastInputTime] = useState(0);

  useEffect(() => {
    const focusInput = () => {
      if (barcodeInputRef.current && document.activeElement !== barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    };

    focusInput();

    const handleClick = () => {
      setTimeout(focusInput, 10);
    };

    const handleKeyDown = () => {
      setTimeout(focusInput, 10);
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    const interval = setInterval(focusInput, 1000);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(interval);
    };
  }, []);

  const addToCartByBarcode = async (barcode: string) => {
    try {
      if (!barcode || !barcode.trim()) {
        toast.error('Invalid barcode');
        return;
      }

      if (!inventory || !Array.isArray(inventory) || !products || !Array.isArray(products)) {
        toast.error('Data not loaded yet');
        return;
      }

      const inventoryItem = inventory.find((item) => item.barcode === barcode.trim());
      if (!inventoryItem) {
        toast.error(`Product with barcode ${barcode} not found`);
        return;
      }

      // Validate inventory item
      if (!inventoryItem.productId || inventoryItem.sellingPrice < 0) {
        toast.error('Invalid inventory item data');
        return;
      }

      const product = products.find((p) => p.id === inventoryItem.productId);
      if (!product) {
        toast.error('Product details not found');
        return;
      }

    setCart((prev) => {
      // Create a new draft cart if none exists
      const draft = prev || {
        id: `draft-${Date.now()}`,
        orderId: `#draft-${Date.now()}`,
        status: 'draft',
        customerName: '',
        customerPhone: '',
        items: [],
        discount: 0,
        createdAt: new Date().toISOString(),
      };

      // Check if item already exists in cart
      const existingItem = draft.items.find((item) => item.barcode === barcode);
      if (existingItem) {
        toast.error('This item is already in the cart');
        return prev;
      }

      // Add new item to cart
      const updatedCart = {
        ...draft,
        items: [
          ...draft.items,
          {
            productId: inventoryItem.productId,
            barcode: barcode,
            discount: 0,
          },
        ],
      };

      return updatedCart;
    });

    toast.success(`Added ${product.name} to cart`);
    } catch (error) {
      console.error('Error adding to cart by barcode:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const currentTime = Date.now();

    if (currentTime - lastInputTime > 100) {
      setBarcodeBuffer(value);
    } else {
      setBarcodeBuffer((prev) => prev + value);
    }

    setLastInputTime(currentTime);

    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedBarcode = barcodeBuffer.trim();
      if (trimmedBarcode && trimmedBarcode.length >= 3) {
        addToCartByBarcode(trimmedBarcode);
      }
      setBarcodeBuffer('');
    }
  };

  useEffect(() => {
    if (barcodeBuffer.length > 0) {
      const timer = setTimeout(() => {
        const trimmedBarcode = barcodeBuffer.trim();
        if (trimmedBarcode && trimmedBarcode.length >= 3) {
          addToCartByBarcode(trimmedBarcode);
          setBarcodeBuffer('');
        } else if (trimmedBarcode) {
          // Clear invalid short barcodes without showing error
          setBarcodeBuffer('');
        }
      }, 300); // Increased timeout to 300ms

      return () => clearTimeout(timer);
    }
  }, [barcodeBuffer]);

  return (
    <input
      ref={barcodeInputRef}
      type="text"
      onChange={handleBarcodeInput}
      onKeyDown={handleKeyDown}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        opacity: 0,
        pointerEvents: 'none',
      }}
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
    />
  );
}

function ShopHeader() {
  const { data: shop } = useSWR('shop', () => window.api.db.get('shop'));
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

function DashboardStats() {
  const navigate = useNavigate();

  const { data: orders } = useSWR('orders', () => window.api.db.get('orders'));
  const { data: products } = useSWR('products', () => window.api.db.get('products'));
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));

  const stats = useMemo(() => {
    if (!orders || !products || !inventory) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: products?.length || 0,
        lowStockItems: 0,
        pendingOrders: 0,
        completedToday: 0,
      };
    }

    const today = dayjs().startOf('day');
    const completedOrders = orders.filter((order: Order) => order.status === 'completed');
    const todayCompleted = completedOrders.filter((order: Order) => dayjs(order.createdAt).isAfter(today));

    // Calculate total revenue from completed orders
    const totalRevenue = completedOrders.reduce((sum: number, order: Order) => {
      const orderTotal = order.items.reduce((itemSum: number, item) => {
        // Find the exact inventory item by barcode
        const inventoryItem = inventory.find((inv) => inv.barcode === item.barcode);
        
        if (!inventoryItem) {
          console.warn(`Inventory item not found for barcode: ${item.barcode}`);
          return itemSum;
        }

        const price = inventoryItem.sellingPrice || 0;
        const discount = item.discount || 0;
        return itemSum + Math.max(0, price - discount); // Ensure non-negative price
      }, 0);
      
      const orderDiscount = order.discount || 0;
      return sum + Math.max(0, orderTotal - orderDiscount); // Ensure non-negative total
    }, 0);

    // Calculate low stock items (products with less than 5 inventory items)
    const productStockCounts = new Map<string, number>();
    inventory.forEach((inv) => {
      const currentCount = productStockCounts.get(inv.productId) || 0;
      productStockCounts.set(inv.productId, currentCount + 1);
    });
    
    const lowStockItems = Array.from(productStockCounts.values()).filter(count => count < 5).length;

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      lowStockItems,
      pendingOrders: orders.filter((order: Order) => order.status === 'pending' || order.status === 'draft').length,
      completedToday: todayCompleted.length,
    };
  }, [orders, products, inventory]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500 rounded-lg">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Revenue</div>
            <div className="font-bold text-blue-900 dark:text-blue-100">Rs. {stats.totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-500 rounded-lg">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-green-600 dark:text-green-400">Orders</div>
            <div className="font-bold text-green-900 dark:text-green-100">{stats.totalOrders}</div>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Products</div>
            <div className="font-bold text-purple-900 dark:text-purple-100">{stats.totalProducts}</div>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-orange-600 dark:text-orange-400">Pending</div>
            <div className="font-bold text-orange-900 dark:text-orange-100">{stats.pendingOrders}</div>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-500 rounded-lg">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-teal-600 dark:text-teal-400">Today</div>
            <div className="font-bold text-teal-900 dark:text-teal-100">{stats.completedToday}</div>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-500 rounded-lg">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs text-red-600 dark:text-red-400">Analytics</div>
            <Button variant="ghost" size="sm" className="h-auto p-0 font-bold text-red-900 dark:text-red-100 hover:bg-transparent" onClick={() => navigate('/dashboard/analytics')}>
              View →
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProductsPanel() {
  const [parent] = useAutoAnimate();
  const { data: products } = useSWR('products', () => window.api.db.get('products'));
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));

  const [selectedTag, setSelectedTag] = useState<string>('All');
  const orderQueueVisible = useAtomValue(orderQueueVisibilityAtom);

  const [query, setQuery] = useState('');

  const tags = useMemo(() => Array.from(new Set((products || []).flatMap((p) => p.categories || []))), [products]);

  const enrichedProducts = useMemo(() => {
    if (!products || !inventory) return [];

    return products.map((product) => {
      const productInventory = inventory.filter((inv) => inv.productId === product.id);
      const averagePrice = productInventory.length > 0 ? productInventory.reduce((sum: number, inv) => sum + inv.sellingPrice, 0) / productInventory.length : 0;
      const stockCount = productInventory.length;

      return {
        ...product,
        averagePrice,
        stockCount,
        inStock: stockCount > 0,
      };
    });
  }, [products, inventory]);

  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter((product) => {
      if (selectedTag !== 'All' && !(product.categories || []).includes(selectedTag)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (product.name || '').toLowerCase().includes(q) || (product.description || '').toLowerCase().includes(q) || (product.id || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [enrichedProducts, selectedTag, query]);

  return (
    <motion.div
      layout
      transition={{ duration: 0.28 }}
      initial={{ height: orderQueueVisible ? 'calc(100% - 300px)' : '100%' }}
      animate={{ height: orderQueueVisible ? 'calc(100% - 300px)' : '100%' }}
      className="flex flex-col p-4 bg-background/30 rounded-lg w-full gap-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Products</h2>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="Search products" className="max-w-[300px]" />
      </div>
      <ScrollContainer containerClassName="bg-sidebar/50 p-2 rounded-lg" childrenClassName="flex gap-2">
        {['All', ...tags].map((product) => (
          <Button variant={product === selectedTag ? 'default' : 'outline'} className="border" key={product} onClick={() => setSelectedTag(product)}>
            {product}
          </Button>
        ))}
      </ScrollContainer>
      <ScrollArea className={`${orderQueueVisible ? 'max-h-[calc(100vh-575px)]' : 'max-h-[calc(100vh-250px)]'} overflow-y-auto bg-sidebar/50 p-3 rounded-lg`}>
        {!products || filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <Card className="p-6 text-center bg-card/50">
              <div className="text-lg font-semibold mb-2">No products found</div>
              <div className="text-sm text-muted-foreground">Try changing the search or add products to the inventory.</div>
            </Card>
          </div>
        ) : (
          <div ref={parent} className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}

type EnrichedProduct = Product & {
  averagePrice: number;
  stockCount: number;
  inStock: boolean;
};

function ProductCard({ product }: { product: EnrichedProduct }) {
  const [, setCart] = useAtom(cartAtom);

  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [barcode, setBarcode] = useState('');

  const openAdd = () => {
    setBarcode('');
    setShowAddDrawer(true);
  };

  const handleAdd = async () => {
    try {
      const inv = await window.api.db.get('inventory');
      if (!inv || !Array.isArray(inv)) {
        toast.error('Failed to load inventory data');
        return;
      }

      let found;

      if (barcode.trim()) {
        // Look for specific barcode for this product
        found = inv.find((i) => i.barcode === barcode.trim() && i.productId === product.id);
        if (!found) {
          toast.error(`Barcode ${barcode.trim()} not found for this product`);
          return;
        }
      } else {
        // Get current cart state to check for used barcodes
        const currentCart = await new Promise<any>((resolve) => {
          setCart((prev) => {
            resolve(prev);
            return prev;
          });
        });

        const usedBarcodes = currentCart?.items?.map((item: any) => item.barcode) || [];
        const availableItems = inv.filter((i) => 
          i.productId === product.id && 
          !usedBarcodes.includes(i.barcode) &&
          i.barcode && // Ensure barcode exists
          i.sellingPrice > 0 // Ensure valid selling price
        );

        if (availableItems.length === 0) {
          toast.error('No available inventory items for this product');
          return;
        }
        found = availableItems[0];
      }

      // Validate the found inventory item
      if (!found.barcode || !found.productId || found.sellingPrice < 0) {
        toast.error('Invalid inventory item data');
        return;
      }

      let additionSuccessful = false;

      setCart((prev) => {
        // Create a new draft cart if none exists
        const draft = prev || {
          id: `draft-${Date.now()}`,
          orderId: `#draft-${Date.now()}`,
          status: 'draft',
          customerName: '',
          customerPhone: '',
          items: [],
          discount: 0,
          createdAt: new Date().toISOString(),
        };

        // Check if item already exists in cart
        const existingItem = draft.items.find((item) => item.barcode === found.barcode);
        if (existingItem) {
          toast.error('This item is already in the cart');
          return prev;
        }

        // Add new item to cart
        const updatedCart = {
          ...draft,
          items: [
            ...draft.items,
            {
              productId: product.id,
              barcode: found.barcode,
              discount: 0,
            },
          ],
        };

        additionSuccessful = true;
        return updatedCart;
      });

      if (additionSuccessful) {
        toast.success(`Added ${product.name} to cart`);
        setShowAddDrawer(false);
        setBarcode('');
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  };

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (product.picture) {
      if (product.picture.startsWith('http') || product.picture.startsWith('file://')) {
        setImageUrl(product.picture);
      } else {
        window.api.media.getUrl(product.picture).then((url) => {
          setImageUrl(url);
        });
      }
    }
  }, [product.picture]);

  return (
    <>
      <Card className="p-0 w-full pb-4 cursor-pointer bg-background/40 hover:bg-background/30 rounded-lg shadow-sm transform hover:scale-[1.01] transition gap-2 relative">
        {!product.inStock && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          </div>
        )}
        <div className="flex items-center justify-center h-[140px] bg-gradient-to-br from-muted/20 to-muted/5 rounded-t-lg relative overflow-hidden">
          {imageUrl ? (
            <ImageWithFallback src={imageUrl} alt={product.name} className="w-full h-full object-cover" fallback={<ImageIcon className="w-12 h-12 text-muted-foreground" />} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 px-4 py-3">
          <div className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</div>
          <div className="flex items-center justify-between">
            <div className="text-foreground font-medium">Rs. {product.averagePrice > 0 ? product.averagePrice.toLocaleString() : 'N/A'}</div>
            <div className="text-xs text-muted-foreground">Stock: {product.stockCount}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(product.categories || []).map((tag: string) => (
              <Badge variant="outline" key={tag} className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="border-t pt-3 flex justify-end pr-4">
          <Button variant="outline" size="sm" className="w-fit" onClick={openAdd} disabled={!product.inStock}>
            {product.inStock ? 'Add to Order' : 'Out of Stock'}
          </Button>
        </div>
      </Card>

      <Drawer open={showAddDrawer} onOpenChange={setShowAddDrawer}>
        <DrawerContent side="bottom">
          <DrawerHeader>
            <DrawerTitle>Add {product.name} to Cart</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Barcode (optional)</label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or enter specific barcode" />
              <p className="text-xs text-muted-foreground mt-1">Leave empty to automatically select an available item from stock</p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Available Stock: {product.stockCount} items</p>
              <p className="text-xs text-muted-foreground">Each barcode represents one unique item. To add multiple items, add them individually.</p>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={() => setShowAddDrawer(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAdd} className="flex-1">
                Add Item to Cart
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function OrderPanel() {
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

  const list = (orders || []).filter((o) => (o.status || 'draft') === 'draft' || (o.status || 'draft') === 'pending');

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

  return (
    <Card onClick={() => setSelectedOrder(order)} className={`p-0 min-w-[250px] gap-4 pb-4 cursor-pointer bg-background/30 hover:bg-background`}>
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
  const isMobile = useIsMobile();
  const [cartVisible, setCartVisible] = useAtom(cartVisibilityAtom);
  const [cart, setCart] = useAtom(cartAtom);
  const { data: products } = useSWR('products', () => window.api.db.get('products'));
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));

  useEffect(() => {
    if (isMobile) {
      setCartVisible(false);
    } else {
      setCartVisible(true);
    }
  }, [isMobile]);

  const enrichedCartItems = useMemo(() => {
    if (!cart?.items || !products || !inventory) return [];

    return cart.items.map((item, index) => {
      const product = products.find((p) => p.id === item.productId);
      const inventoryItem = inventory.find((inv) => inv.barcode === item.barcode);

      if (!inventoryItem) {
        console.warn(`Inventory item not found for barcode: ${item.barcode}`);
      }

      const unitPrice = inventoryItem?.sellingPrice || 0;
      const discount = item.discount || 0;
      const totalPrice = Math.max(0, unitPrice - discount); // Ensure non-negative price

      return {
        id: `${item.productId}-${item.barcode}-${index}`,
        productId: item.productId,
        barcode: item.barcode,
        product,
        inventoryItem,
        discount,
        unitPrice,
        totalPrice,
      };
    });
  }, [cart, products, inventory]);

  const subtotal = enrichedCartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal - (cart?.discount || 0);

  const handleClearCart = () => {
    setCart(null);
    toast.success('Cart cleared');
  };

  const handleRemoveItem = (productId: string, barcode: string) => {
    if (!cart) return;

    const itemIndex = cart.items.findIndex((item) => item.productId === productId && item.barcode === barcode);

    if (itemIndex !== -1) {
      const newItems = [...cart.items];
      newItems.splice(itemIndex, 1);
      setCart({ ...cart, items: newItems });
      toast.success('Item removed from cart');
    }
  };

  const handleUpdateCustomer = (field: 'customerName' | 'customerPhone', value: string) => {
    if (!cart) return;
    
    // Validate input based on field type
    let validatedValue = value;
    
    if (field === 'customerPhone' && value) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value)) {
        toast.error('Please enter a valid phone number');
        return;
      }
    }
    
    if (field === 'customerName') {
      validatedValue = value.trim();
      if (validatedValue.length > 100) {
        toast.error('Name is too long (max 100 characters)');
        return;
      }
    }
    
    setCart({ ...cart, [field]: validatedValue });
  };

  const handleCheckout = async () => {
    try {
      if (!cart || !cart.items.length) {
        toast.error('Cart is empty');
        return;
      }

      // Validate cart items
      if (!cart.items.every(item => item.barcode && item.productId)) {
        toast.error('Invalid items in cart');
        return;
      }

      // Validate customer data
      if (!cart.customerName?.trim()) {
        toast.error('Customer name is required');
        return;
      }

      const orderData = {
        ...cart,
        id: undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await window.api.db.create('orders', orderData);
      setCart(null);
      mutate('orders');
      toast.success('Order created successfully!');
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to create order. Please try again.');
    }
  };

  return (
    <>
      {!cartVisible && (
        <Button variant="outline" onClick={() => setCartVisible(true)} className="absolute -right-8 top-25 rotate-90">
          <EyeIcon />
          <span>View Cart</span>
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
              <span className="font-bold text-lg">{cart ? `Cart (${cart.items.length})` : 'Cart (0)'}</span>
              <Button variant="outline" onClick={() => setCartVisible(false)}>
                <EyeIcon />
              </Button>
            </div>

            {!cart || !cart.items.length ? (
              <div className="flex-1 flex items-center justify-center">
                <Card className="p-6 text-center bg-card/50">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <div className="text-lg font-semibold mb-2">Cart is empty</div>
                  <div className="text-sm text-muted-foreground">Add products to start creating an order</div>
                </Card>
              </div>
            ) : (
              <>
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium">Customer Name *</label>
                    <Input value={cart.customerName || ''} onChange={(e) => handleUpdateCustomer('customerName', e.target.value)} placeholder="Enter customer name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Customer Phone</label>
                    <Input value={cart.customerPhone || ''} onChange={(e) => handleUpdateCustomer('customerPhone', e.target.value)} placeholder="Enter phone number" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-4">
                  <div className="font-medium mb-3">Items ({enrichedCartItems.length})</div>
                  <div className="space-y-2">
                    {enrichedCartItems.map((item) => (
                      <Card key={item.id} className="p-3 bg-card/60">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.product?.name || 'Unknown Product'}</div>
                            <div className="text-xs text-muted-foreground">Barcode: {item.barcode}</div>
                            <div className="text-xs text-muted-foreground">Price: Rs. {item.unitPrice.toLocaleString()}</div>
                            {item.discount > 0 && <div className="text-xs text-green-600">Discount: Rs. {item.discount}</div>}
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            <span className="font-semibold text-sm">Rs. {item.totalPrice.toLocaleString()}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveItem(item.productId, item.barcode)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              title="Remove item"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subtotal</span>
                    <span>Rs. {subtotal.toLocaleString()}</span>
                  </div>
                  {cart.discount && cart.discount > 0 && (
                    <div className="flex justify-between text-sm mb-1 text-green-700">
                      <span>Order Discount</span>
                      <span>- Rs. {cart.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>Rs. {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleClearCart} className="flex-1">
                    Clear Cart
                  </Button>
                  <Button variant="default" onClick={handleCheckout} className="flex-1">
                    Checkout
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
