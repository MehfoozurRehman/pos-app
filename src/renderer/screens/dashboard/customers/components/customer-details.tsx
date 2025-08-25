import { Calendar, DollarSign, Image as ImageIcon, Package, Phone, ShoppingBag, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { useEffect, useState } from 'react';

import { Badge } from '@renderer/components/ui/badge';
import { CustomerData } from 'src/types';
import { ImageWithFallback } from '@renderer/components/image-fallback';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Separator } from '@renderer/components/ui/separator';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface CustomerDetailsProps {
  customer: CustomerData | null;
}

export function CustomerDetails({ customer }: CustomerDetailsProps) {
  if (!customer) {
    return (
      <Card className="h-fit">
        <CardContent className="p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Customer</h3>
          <p className="text-muted-foreground">Click on a customer to view their detailed information and purchase history</p>
        </CardContent>
      </Card>
    );
  }

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 10000) return { tier: 'VIP', color: 'bg-yellow-500', description: 'Premium customer' };
    if (totalSpent >= 5000) return { tier: 'Gold', color: 'bg-amber-500', description: 'Valued customer' };
    if (totalSpent >= 1000) return { tier: 'Silver', color: 'bg-gray-400', description: 'Regular customer' };
    return { tier: 'Bronze', color: 'bg-orange-600', description: 'New customer' };
  };

  const tierInfo = getCustomerTier(customer.totalSpent);
  const averageOrderValue = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Customer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center pb-4">
            <h2 className="text-xl font-bold mb-1">{customer.name}</h2>
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
              <Phone className="w-4 h-4" />
              <span>{customer.phone}</span>
            </div>
            <Badge variant="secondary" className={`text-white ${tierInfo.color}`}>
              <Star className="w-3 h-3 mr-1" />
              {tierInfo.tier} - {tierInfo.description}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <ShoppingBag className="w-4 h-4" />
                <span>Total Orders</span>
              </div>
              <div className="text-2xl font-bold">{customer.totalOrders}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span>Total Spent</span>
              </div>
              <div className="text-2xl font-bold">Rs. {customer.totalSpent.toFixed(0)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Average Order</div>
              <div className="font-semibold">Rs. {averageOrderValue.toFixed(0)}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span>Last Order</span>
              </div>
              <div className="font-semibold text-sm">{dayjs(customer.lastOrderDate).format('MMM D, YYYY')}</div>
              <div className="text-xs text-muted-foreground">({dayjs(customer.lastOrderDate).fromNow()})</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Favorite Products</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {customer.favoriteProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No products purchased yet</p>
                </div>
              ) : (
                customer.favoriteProducts.map((product) => <ProductItem key={product.productId} product={product} />)
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductItem({ product }: { product: CustomerData['favoriteProducts'][0] }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadImage() {
      if (!product.productImage) {
        setImageUrl(null);
        return;
      }

      try {
        if (!product.productImage.startsWith('http') && !product.productImage.startsWith('file://')) {
          const url = await window.api.media.getUrl(product.productImage);
          setImageUrl(url);
        } else {
          setImageUrl(product.productImage);
        }
      } catch (error) {
        console.error('Failed to load image:', error);
        setImageUrl(null);
      }
    }

    loadImage();
  }, [product.productImage]);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
        {imageUrl ? (
          <ImageWithFallback src={imageUrl} alt={product.productName} className="w-full h-full object-cover" fallback={<ImageIcon className="w-4 h-4 text-muted-foreground" />} />
        ) : (
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{product.productName}</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Qty: {product.quantity}</span>
          <span>•</span>
          <span>Rs. {product.totalSpent.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
