import { Badge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import { Card, CardContent } from '@renderer/components/ui/card';
import { Edit, Image as ImageIcon, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

import { ImageWithFallback } from '@renderer/components/image-fallback';
import { Product } from 'src/types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Load image URL for local files
  React.useEffect(() => {
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
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative bg-muted">
        {imageUrl ? (
          <ImageWithFallback src={imageUrl} alt={product.name} className="w-full h-full object-cover" fallback={<ImageIcon className="w-12 h-12 text-muted-foreground" />} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => onEdit(product)}>
              <Edit className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => onDelete(product)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-1 line-clamp-1">{product.name}</h3>
        {product.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>}

        {product.categories && product.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.categories.slice(0, 2).map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
            {product.categories.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{product.categories.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
