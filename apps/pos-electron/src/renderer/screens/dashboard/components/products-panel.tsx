import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Order, Product } from 'src/types';
import { cartAtom, orderQueueVisibilityAtom } from '@/constants/state';
import { useAtom, useAtomValue } from 'jotai/react';
import { useEffect, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import { ImageIcon } from 'lucide-react';
import { ImageWithFallback } from '@/components/image-fallback';
import { Input } from '@renderer/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrollContainer } from '@/components/scroll-container';
import { logger } from '@renderer/utils/logger';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAutoAnimate } from '@formkit/auto-animate/react';

type EnrichedProduct = Product & {
  averagePrice: number;
  stockCount: number;
  inStock: boolean;
};

export function ProductsPanel({ inventoryMode }: { inventoryMode: 'barcode' | 'quantity' }) {
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
              <ProductCard key={product.id} product={product} inventoryMode={inventoryMode} />
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}

function ProductCard({ product, inventoryMode }: { product: EnrichedProduct; inventoryMode: 'barcode' | 'quantity' }) {
  const [, setCart] = useAtom(cartAtom);

  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const openAdd = () => {
    setBarcode('');
    setQuantity(1);
    setShowAddDrawer(true);
  };

  const handleAdd = async () => {
    try {
      setIsAddingToCart(true);
      const inv = await window.api.db.get('inventory');
      if (!inv || !Array.isArray(inv)) {
        toast.error('Unable to load inventory data. Please refresh and try again.');
        return;
      }

      if (inventoryMode === 'quantity') {
        const productInventory = inv.find((i) => i.productId === product.id);
        if (!productInventory) {
          toast.error(`No inventory found for "${product.name}".`);
          return;
        }

        if ((productInventory.quantity || 0) < quantity) {
          toast.error(`Insufficient stock. Available: ${productInventory.quantity}, Requested: ${quantity}`);
          return;
        }

        let additionSuccessful = false;
        let updatedCart: Order | undefined;

        setCart((prev) => {
          const cart = prev || {
            id: `cart-${Date.now()}`,
            orderId: `#cart-${Date.now()}`,
            status: 'cart',
            customerName: '',
            customerPhone: '',
            items: [],
            discount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const existingItem = cart.items.find((item) => item.productId === product.id);
          if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if ((productInventory.quantity || 0) < newQuantity) {
              toast.error(`Insufficient stock. Available: ${productInventory.quantity}, Total requested: ${newQuantity}`);
              return prev;
            }
            
            updatedCart = {
              ...cart,
              items: cart.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: newQuantity }
                  : item
              ),
              updatedAt: new Date().toISOString(),
            };
          } else {
            updatedCart = {
              ...cart,
              items: [
                ...cart.items,
                {
                   productId: product.id,
                   barcode: '',
                   discount: 0,
                   quantity: quantity,
                 },
               ],
               updatedAt: new Date().toISOString(),
             };
           }

           additionSuccessful = true;
           return updatedCart;
         });
       } else {
         let found;

         if (barcode.trim()) {
           found = inv.find((i) => i.barcode === barcode.trim() && i.productId === product.id);
           if (!found) {
             toast.error(`Barcode "${barcode.trim()}" not found for ${product.name}. Please verify the barcode.`);
             return;
           }
         } else {
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
             i.barcode &&
             i.sellingPrice > 0
           );

           if (availableItems.length === 0) {
             toast.error(`No available inventory for "${product.name}". All items may already be in cart or out of stock.`);
             return;
           }
           found = availableItems[0];
         }

         if (!found.barcode || !found.productId || found.sellingPrice < 0) {
           toast.error('Invalid inventory item data');
           return;
         }

         setCart((prev) => {
           const cart = prev || {
             id: `cart-${Date.now()}`,
             orderId: `#cart-${Date.now()}`,
             status: 'cart',
             customerName: '',
             customerPhone: '',
             items: [],
             discount: 0,
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString(),
           };

           const existingItem = cart.items.find((item) => item.barcode === found.barcode);
           if (existingItem) {
             toast.error(`"${product.name}" is already in your cart. You can modify quantity from the cart.`);
             return prev;
           }

           const updatedCart = {
             ...cart,
             items: [
               ...cart.items,
               {
                 productId: product.id,
                 barcode: found.barcode,
                 discount: 0,
                 quantity: 1,
               },
             ],
             updatedAt: new Date().toISOString(),
           };

           (async () => {
             try {
               const existingCart = await window.api.db.get('orders').then(orders => 
                 orders?.find((o: Order) => o.id === updatedCart.id)
               );
               
               if (existingCart) {
                 await window.api.db.update('orders', updatedCart.id, updatedCart);
               } else {
                 await window.api.db.create('orders', updatedCart);
               }
               mutate('orders');
             } catch (error) {
               logger.error('Failed to save cart to database', 'cart-save', error);
             }
           })();

           const successMessage = `✓ "${product.name}" added to cart successfully!`;
           toast.success(successMessage);
           setShowAddDrawer(false);
           setBarcode('');
           setQuantity(1);
           
           return updatedCart;
         });
       }
      } catch (error) {
        logger.error('Failed to add item to cart', 'cart-add-item', { productId: product.id, error });
        toast.error('Failed to add item to cart. Please try again.');
      } finally {
        setIsAddingToCart(false);
      }
    };

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (product.picture) {
      if (product.picture.startsWith('http') || product.picture.startsWith('file:')) {
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
            {inventoryMode === 'barcode' ? (
              <div>
                <label className="text-sm font-medium">Barcode (optional)</label>
                <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or enter specific barcode" />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to automatically select an available item from stock</p>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input 
                  type="number" 
                  min="1" 
                  max={product.stockCount} 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                  placeholder="Enter quantity" 
                />
                <p className="text-xs text-muted-foreground mt-1">Available stock: {product.stockCount}</p>
              </div>
            )}

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Available Stock: {product.stockCount} items</p>
              {inventoryMode === 'barcode' ? (
                <p className="text-xs text-muted-foreground">Each barcode represents one unique item. To add multiple items, add them individually.</p>
              ) : (
                <p className="text-xs text-muted-foreground">You can add multiple quantities of this product at once.</p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={() => setShowAddDrawer(false)} variant="outline" className="flex-1" disabled={isAddingToCart}>
                Cancel
              </Button>
              <Button onClick={handleAdd} className="flex-1" disabled={isAddingToCart}>
                {isAddingToCart ? 'Adding...' : 'Add Item to Cart'}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}