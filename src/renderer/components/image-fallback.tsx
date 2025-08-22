import { ReactNode, useState } from 'react';

import { Loader } from 'lucide-react';

export function ImageWithFallback({ fallback, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fallback: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

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
        onError={() => setIsError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isError ? 'hidden' : ''}`}
      />
    </div>
  );
}
