import { Card, CardContent } from '@renderer/components/ui/card';
import { Phone, ShoppingBag, DollarSign, Calendar, Star } from 'lucide-react';

import { Badge } from '@renderer/components/ui/badge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface CustomerData {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  favoriteProducts: Array<{
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    totalSpent: number;
  }>;
  orders: any[];
}

interface CustomerCardProps {
  customer: CustomerData;
  onClick: () => void;
  isSelected: boolean;
}

export function CustomerCard({ customer, onClick, isSelected }: CustomerCardProps) {
  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 10000) return { tier: 'VIP', color: 'bg-yellow-500' };
    if (totalSpent >= 5000) return { tier: 'Gold', color: 'bg-amber-500' };
    if (totalSpent >= 1000) return { tier: 'Silver', color: 'bg-gray-400' };
    return { tier: 'Bronze', color: 'bg-orange-600' };
  };

  const tierInfo = getCustomerTier(customer.totalSpent);

  return (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{customer.name}</h3>
              <Badge variant="secondary" className={`text-white text-xs ${tierInfo.color}`}>
                <Star className="w-3 h-3 mr-1" />
                {tierInfo.tier}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <Phone className="w-3 h-3" />
              <span>{customer.phone}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <ShoppingBag className="w-3 h-3" />
              <span>Orders</span>
            </div>
            <div className="font-semibold">{customer.totalOrders}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              <span>Spent</span>
            </div>
            <div className="font-semibold">Rs. {customer.totalSpent.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              <span>Last Order</span>
            </div>
            <div className="font-semibold text-xs">{dayjs(customer.lastOrderDate).fromNow()}</div>
          </div>
        </div>

        {customer.favoriteProducts.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Favorite Products:</div>
            <div className="flex flex-wrap gap-1">
              {customer.favoriteProducts.slice(0, 3).map((product) => (
                <Badge key={product.productId} variant="outline" className="text-xs">
                  {product.productName} ({product.quantity})
                </Badge>
              ))}
              {customer.favoriteProducts.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{customer.favoriteProducts.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
