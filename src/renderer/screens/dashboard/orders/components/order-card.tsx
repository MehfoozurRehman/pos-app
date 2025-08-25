import { Calendar, DollarSign, MoreVertical, Package, Phone, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@renderer/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@renderer/components/ui/dropdown-menu';

import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { Order } from 'src/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface OrderCardProps {
  order: Order & { total: number; itemsCount: number };
  onClick: () => void;
  isSelected: boolean;
  onUpdateStatus: (orderId: string, status: string) => void;
  onDeleteOrder: (orderId: string) => void;
}

export function OrderCard({ order, onClick, isSelected, onUpdateStatus, onDeleteOrder }: OrderCardProps) {
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

  const handleStatusChange = (e: React.MouseEvent, newStatus: string) => {
    e.stopPropagation();
    onUpdateStatus(order.id, newStatus);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteOrder(order.id);
  };

  return (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">#{order.orderId}</h3>
              <Badge className={getStatusColor(order.status)}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-1">
              <strong>{order.customerName}</strong>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span>{order.customerPhone}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => handleStatusChange(e, 'pending')}>Mark as Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleStatusChange(e, 'completed')}>Mark as Completed</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleStatusChange(e, 'cancelled')}>Mark as Cancelled</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Package className="w-3 h-3" />
              <span>Items</span>
            </div>
            <div className="font-semibold">{order.itemsCount}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              <span>Total</span>
            </div>
            <div className="font-semibold">Rs. {order.total.toFixed(0)}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Calendar className="w-3 h-3" />
              <span>Date</span>
            </div>
            <div className="font-semibold text-xs">{dayjs(order.createdAt).format('MMM D')}</div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">Created {dayjs(order.createdAt).fromNow()}</div>
      </CardContent>
    </Card>
  );
}
