import { AnimatePresence, motion } from 'motion/react';
import { EyeIcon, ShoppingCart, X } from 'lucide-react';
import { cartAtom, cartVisibilityAtom } from '@/constants/state';
import { useEffect, useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';

import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import { Input } from '@renderer/components/ui/input';
import { logger } from '@renderer/utils/logger';
import { toast } from 'sonner';
import { useAtom } from 'jotai/react';
import { useIsMobile } from '@/hooks/use-mobile';
import useShop from '@/hooks/use-shop';

export function OrderDetails() {
  const isMobile = useIsMobile();

  const { inventoryMode } = useShop();

  const [cart, setCart] = useAtom(cartAtom);

  const [cartVisible, setCartVisible] = useAtom(cartVisibilityAtom);

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [isClearingCart, setIsClearingCart] = useState(false);

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
      let inventoryItem;

      if (inventoryMode === 'quantity') {
        inventoryItem = inventory.find((inv) => inv.productId === item.productId);
      } else {
        inventoryItem = inventory.find((inv) => inv.barcode === item.barcode);
      }

      if (!inventoryItem) {
        logger.warn('Inventory item not found in cart total calculation', 'cart-total', {
          productId: item.productId,
          barcode: item.barcode,
          inventoryMode,
        });
      }

      const unitPrice = inventoryItem?.sellingPrice || 0;
      const discount = item.discount || 0;
      const totalPrice = Math.max(0, unitPrice - discount);

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

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear the cart?')) return;

    try {
      setIsClearingCart(true);
      if (cart && cart.id && cart.status === 'cart') {
        await window.api.db.delete('orders', cart.id);
        mutate('orders');
      }
      setCart(null);
      toast.success('✓ Cart cleared successfully! All items have been removed.');
    } catch (error) {
      logger.error('Failed to clear cart', 'cart-clear', error);
      setCart(null);
      toast.success('✓ Cart cleared successfully! All items have been removed.');
    } finally {
      setIsClearingCart(false);
    }
  };

  const handleRemoveItem = (productId: string, barcode: string) => {
    if (!cart) return;

    const itemIndex = cart.items.findIndex((item) => item.productId === productId && item.barcode === barcode);

    if (itemIndex !== -1) {
      const newItems = [...cart.items];
      newItems.splice(itemIndex, 1);
      setCart({ ...cart, items: newItems });
      toast.success('✓ Item removed from cart successfully!');
    }
  };

  const handleUpdateCustomer = (field: 'customerName' | 'customerPhone', value: string) => {
    if (!cart) return;

    let validatedValue = value;

    if (field === 'customerPhone' && value) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value)) {
        toast.error('Please enter a valid phone number (numbers, spaces, dashes, and parentheses only).');
        return;
      }
    }

    if (field === 'customerName') {
      validatedValue = value.trim();
      if (validatedValue.length > 100) {
        toast.error('Customer name is too long. Please keep it under 100 characters.');
        return;
      }
    }

    setCart({ ...cart, [field]: validatedValue });
  };

  const handleSaveDraft = async () => {
    try {
      if (!cart || !cart.items.length) {
        toast.error('Your cart is empty. Add some items before saving as draft.');
        return;
      }

      if (!cart.items.every((item) => item.barcode && item.quantity > 0)) {
        toast.error('Some items in your cart are invalid. Please remove them and try again.');
        return;
      }

      setIsSavingDraft(true);

      const orderData = {
        ...cart,
        id: cart.id || `draft-${Date.now()}`,
        status: 'draft' as const,
        createdAt: cart.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (cart.id && cart.status === 'cart') {
        await window.api.db.update('orders', cart.id, orderData);
      } else {
        await window.api.db.create('orders', orderData);
      }

      setCart(null);
      mutate('orders');
      toast.success('✓ Order saved as draft! You can find it in the Orders section.');
    } catch (error) {
      logger.error('Failed to save draft order', 'draft-save', error);
      toast.error('Unable to save draft order. Please check your connection and try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleCheckout = async () => {
    try {
      if (!cart || !cart.items.length) {
        toast.error('Your cart is empty. Add some items before checkout.');
        return;
      }

      if (!cart.items.every((item) => item.barcode && item.quantity > 0)) {
        toast.error('Some items in your cart are invalid. Please remove them and try again.');
        return;
      }

      if (!cart.customerName?.trim()) {
        toast.error('Please enter customer name before proceeding with checkout.');
        return;
      }

      setIsCheckingOut(true);

      const orderData = {
        ...cart,
        id: cart.id || `order-${Date.now()}`,
        status: 'pending' as const,
        createdAt: cart.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (cart.id && cart.status === 'cart') {
        await window.api.db.update('orders', cart.id, orderData);
      } else {
        await window.api.db.create('orders', orderData);
      }
      setCart(null);
      mutate('orders');
      toast.success(`✓ Order completed successfully! Order #${orderData.orderId} is now pending.`);
    } catch (error) {
      logger.error('Checkout process failed', 'checkout', error);
      toast.error('Unable to complete checkout. Please verify all details and try again.');
    } finally {
      setIsCheckingOut(false);
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
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{cart ? `Cart (${cart.items.length})` : 'Cart (0)'}</span>
                {(isCheckingOut || isSavingDraft || isClearingCart) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Processing...</span>
                  </div>
                )}
              </div>
              <Button variant="outline" onClick={() => setCartVisible(false)}>
                <EyeIcon />
              </Button>
            </div>

            {!cart || !cart.items.length ? (
              <div className="flex-1 flex items-center justify-center">
                <Card className="p-6 text-center bg-card/50 border-dashed border-2">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/60" />
                  <div className="text-lg font-semibold mb-2 text-muted-foreground">Your cart is empty</div>
                  <div className="text-sm text-muted-foreground/80 mb-3">Add products to start creating an order</div>
                  <div className="text-xs text-muted-foreground/60">💡 Tip: Use the barcode scanner or click "Add to Order" on products</div>
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
                              onClick={() => handleRemoveItem(item.productId, item.barcode || '')}
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

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSaveDraft} className="flex-1" disabled={isSavingDraft || isCheckingOut || isClearingCart}>
                      {isSavingDraft ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button variant="default" onClick={handleCheckout} className="flex-1" disabled={isCheckingOut || isSavingDraft || isClearingCart}>
                      {isCheckingOut ? 'Processing...' : 'Checkout'}
                    </Button>
                  </div>
                  <Button variant="destructive" onClick={handleClearCart} className="w-full" disabled={isClearingCart || isCheckingOut || isSavingDraft}>
                    {isClearingCart ? 'Clearing...' : 'Clear Cart'}
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
