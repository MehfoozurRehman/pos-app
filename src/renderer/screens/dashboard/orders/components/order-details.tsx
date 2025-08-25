import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Phone, Package, DollarSign, Calendar, User, Image as ImageIcon, Barcode } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { ImageWithFallback } from '@renderer/components/image-fallback';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Separator } from '@renderer/components/ui/separator';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface EnrichedOrder {
  id: string;
  orderId: string;
  status: string;
  customerName: string;
  customerPhone: string;
  items: any[];
  discount?: number;
  createdAt: string;
  total: number;
  itemsCount: number;
  productDetails: Array<{
    productId: string;
    productName: string;
    productImage: string;
    barcode: string;
    price: number;
    discount: number;
    finalPrice: number;
  }>;
}

interface OrderDetailsProps {
  order: EnrichedOrder | null;
  onUpdateStatus: (orderId: string, status: string) => void;
}

export function OrderDetails({ order, onUpdateStatus }: OrderDetailsProps) {
  if (!order) {
    return (
      <Card className="h-fit">
        <CardContent className="p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select an Order</h3>
          <p className="text-muted-foreground">
            Click on an order to view its detailed information and manage its status
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'pending':
        return 'bg-orange-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      case 'draft':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const subtotal = order.productDetails.reduce((sum, item) => sum + item.finalPrice, 0);
  const orderDiscount = order.discount ? (subtotal * order.discount / 100) : 0;
  const finalTotal = subtotal - orderDiscount;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center pb-4">
            <h2 className="text-xl font-bold mb-2">#{order.orderId}</h2>
            <Badge className={`${getStatusColor(order.status)} mb-2`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Created {dayjs(order.createdAt).format('MMM D, YYYY [at] h:mm A')}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{order.customerPhone}</span>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <Package className="w-4 h-4" />
                <span>Items</span>
              </div>
              <div className="text-xl font-bold">{order.itemsCount}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span>Total</span>
              </div>
              <div className="text-xl font-bold">Rs. {order.total.toFixed(0)}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onUpdateStatus(order.id, 'pending')}
              disabled={order.status === 'pending'}
              className="flex-1"
            >
              Mark Pending
            </Button>
            <Button 
              size="sm" 
              onClick={() => onUpdateStatus(order.id, 'completed')}
              disabled={order.status === 'completed'}
              className="flex-1"
            >
              Complete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {order.productDetails.map((item, index) => (
                <ProductItem key={`${item.productId}-${index}`} item={item} />
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              {order.discount && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Order Discount ({order.discount}%):</span>
                  <span>-Rs. {orderDiscount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>Rs. {finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductItem({ item }: { item: EnrichedOrder['productDetails'][0] }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadImage() {
      if (!item.productImage) {
        setImageUrl(null);
        return;
      }

      try {
        if (!item.productImage.startsWith('http') && !item.productImage.startsWith('file://')) {
          const url = await window.api.media.getUrl(item.productImage);
          setImageUrl(url);
        } else {
          setImageUrl(item.productImage);
        }
      } catch (error) {
        console.error('Failed to load image:', error);
        setImageUrl(null);
      }
    }

    loadImage();
  }, [item.productImage]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
        {imageUrl ? (
          <ImageWithFallback
            src={imageUrl}
            alt={item.productName}
            className="w-full h-full object-cover"
            fallback={<ImageIcon className="w-5 h-5 text-muted-foreground" />}
          />
        ) : (
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.productName}</h4>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <Barcode className="w-3 h-3" />
          <span className="font-mono">{item.barcode}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span>Rs. {item.price.toFixed(0)}</span>
            {item.discount > 0 && (
              <span className="text-green-600">-{item.discount}%</span>
            )}
          </div>
          <span className="font-semibold">Rs. {item.finalPrice.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
