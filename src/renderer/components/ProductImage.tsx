import { PackageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function ProductImage({ src, alt, className = '', fallbackClassName = '' }: ProductImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (!src) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);

        // If it's already a full URL, use it directly
        if (src.startsWith('http') || src.startsWith('file://') || src.startsWith('data:')) {
          setImageUrl(src);
        } else {
          // It's a relative path, get the full path from the API
          const fullPath = await window.api.getImagePath(src);
          setImageUrl(fullPath);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [src]);

  if (loading) {
    return (
      <div className={`bg-gray-100 rounded flex items-center justify-center ${className}`}>
        <div className="animate-pulse">
          <PackageIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`bg-gray-100 rounded flex items-center justify-center ${fallbackClassName || className}`}>
        <PackageIcon className="h-4 w-4 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}
