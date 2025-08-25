import { ReactNode, useEffect, useState } from 'react';

import { Loader } from 'lucide-react';
import { getMediaUrl } from '@/utils/media';

interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  fallback: ReactNode;
  localPath?: string;
  remoteUrl?: string;
}

export function ImageWithFallback({ fallback, src, localPath, remoteUrl, ...props }: ImageWithFallbackProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  useEffect(() => {
    async function resolveSrc() {
      if (src) {
        setResolvedSrc(src);
        return;
      }

      if (remoteUrl) {
        setResolvedSrc(remoteUrl);
        return;
      }

      if (localPath) {
        const url = await getMediaUrl(localPath);
        setResolvedSrc(url);
        return;
      }

      setResolvedSrc(null);
    }

    resolveSrc();
  }, [src, localPath, remoteUrl]);

  if (!resolvedSrc) {
    return <div className="relative w-full h-full flex justify-center items-center bg-background/20">{fallback}</div>;
  }

  return (
    <div className={`relative w-full h-full flex justify-center items-center ${isError ? 'bg-background/20' : ''}`}>
      {isError
        ? fallback
        : !isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/20">
              <Loader className="animate-spin" />
            </div>
          )}
      <img
        loading="lazy"
        {...props}
        src={resolvedSrc}
        onError={() => setIsError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isError ? 'hidden' : ''}`}
      />
    </div>
  );
}
