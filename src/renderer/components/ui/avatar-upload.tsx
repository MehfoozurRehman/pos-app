import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Loader2, Upload, User, X } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

import { Button } from './button';
import { cn } from '@/utils';
import { toast } from 'sonner';

interface AvatarUploadProps {
  value?: string;
  onChange: (value: string | null) => void;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fallback?: React.ReactNode;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

export function AvatarUpload({ value, onChange, className, disabled = false, size = 'md', fallback }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (value) {
      if (!value.startsWith('http') && !value.startsWith('file://')) {
        window.api.media.getUrl(value).then((url) => {
          if (url) {
            setPreview(url);
          }
        });
      } else {
        setPreview(value);
      }
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (disabled) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }

      setIsUploading(true);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const filename = await window.api.media.save(buffer, file.name);

        onChange(filename);
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        toast.error('Failed to upload avatar. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, onChange],
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
      e.target.value = '';
    },
    [handleFileUpload],
  );

  const handleRemove = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      if (disabled || isUploading) return;

      if (value && !value.startsWith('http') && !value.startsWith('file://')) {
        try {
          await window.api.media.delete(value);
        } catch (error) {
          console.error('Failed to delete media file:', error);
        }
      }

      onChange(null);
    },
    [disabled, isUploading, value, onChange],
  );

  return (
    <div className={cn('relative group', className)}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={disabled} />

      <div className="relative">
        <Avatar
          className={cn(sizeClasses[size], 'cursor-pointer transition-all duration-200', 'hover:ring-2 hover:ring-primary hover:ring-offset-2', disabled && 'opacity-50 cursor-not-allowed')}
          onClick={handleClick}
        >
          {isUploading ? (
            <div className="flex items-center justify-center w-full h-full bg-muted">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <AvatarImage src={preview || undefined} />
              <AvatarFallback>{fallback || <User className="w-1/2 h-1/2 text-muted-foreground" />}</AvatarFallback>
            </>
          )}
        </Avatar>
        {!isUploading && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
            <div className="flex gap-1">
              <Button type="button" variant="secondary" size="sm" className="h-8 w-8 p-0" onClick={handleClick} disabled={disabled}>
                <Upload className="w-3 h-3" />
              </Button>
              {preview && (
                <Button type="button" variant="destructive" size="sm" className="h-8 w-8 p-0" onClick={handleRemove} disabled={disabled}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">Click to upload</p>
    </div>
  );
}
