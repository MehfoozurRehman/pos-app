import { ShoppingBag } from 'lucide-react';

interface OrderHeaderProps {
  totalOrders: number;
}

export function OrderHeader({ totalOrders }: OrderHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          Orders
        </h1>
        <p className="text-muted-foreground">Manage and track all your orders ({totalOrders} orders)</p>
      </div>
    </div>
  );
}
