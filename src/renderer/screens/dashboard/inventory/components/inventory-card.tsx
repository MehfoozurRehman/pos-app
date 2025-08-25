import { Barcode, Edit, Image as ImageIcon, Package, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@renderer/components/ui/card';
import { useEffect, useState } from 'react';

import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { ImageWithFallback } from '@renderer/components/image-fallback';
import { Inventory } from 'src/types';
import dayjs from 'dayjs';
import { logger } from '@renderer/utils/logger';

type EnrichedInventory = Inventory & {
  productName: string;
  productImage: string;
  productCategories: string[];
};

type InventoryCardProps = {
  item: EnrichedInventory;
  onEdit: (item: Inventory) => void;
  onDelete: (item: Inventory) => void;
  inventoryMode: 'barcode' | 'quantity';
};

export function InventoryCard({ item, onEdit, onDelete, inventoryMode }: InventoryCardProps) {
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
        logger.error('Failed to load inventory item image', 'inventory-image-load', { inventoryId: item.id, imagePath: item.productImage, error });
        setImageUrl(null);
      }
    }

    loadImage();
  }, [item.productImage]);

  const profit = item.sellingPrice - item.actualPrice;
  const profitMargin = item.actualPrice > 0 ? ((profit / item.actualPrice) * 100).toFixed(1) : '0';

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] p-0">
      <CardContent className="p-0 space-y-2">
        <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
          {imageUrl ? (
            <ImageWithFallback src={imageUrl} alt={item.productName} className="w-full h-full object-cover" fallback={<ImageIcon className="w-8 h-8 text-muted-foreground" />} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button size="icon" variant="secondary" className="h-8 w-8 bg-background/80 backdrop-blur-sm" onClick={() => onEdit(item)}>
              <Edit className="w-3 h-3" />
            </Button>
            <Button size="icon" variant="destructive" className="h-8 w-8 bg-background/80 backdrop-blur-sm" onClick={() => onDelete(item)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] capitalize -mb-1">{item.productName}</h3>
          {inventoryMode === 'barcode' && item.barcode && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Barcode className="w-3 h-3" />
              <span className="font-mono">{item.barcode}</span>
            </div>
          )}
          {inventoryMode === 'quantity' && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="w-3 h-3" />
              <span className="font-medium">Qty: {item.quantity || 0}</span>
            </div>
          )}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Cost:</span>
              <span className="font-medium">Rs. {item.actualPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium">Rs. {item.sellingPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Profit:</span>
              <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs. {profit.toFixed(2)} ({profitMargin}%)
              </span>
            </div>
          </div>
          {item.productCategories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.productCategories.slice(0, 2).map((category) => (
                <Badge key={category} variant="secondary" className="text-xs px-1 py-0">
                  {category}
                </Badge>
              ))}
              {item.productCategories.length > 2 && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  +{item.productCategories.length - 2}
                </Badge>
              )}
            </div>
          )}
          <div className="text-xs text-muted-foreground pt-1">Added {dayjs(item.createdAt).format('MMM D, YYYY')}</div>
        </div>
      </CardContent>
    </Card>
  );
}
