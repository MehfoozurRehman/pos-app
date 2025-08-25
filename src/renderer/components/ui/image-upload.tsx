import { Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from './button';
import { Card } from './card';
import { cn } from '@/utils';
import { toast } from 'sonner';

type ImageUploadProps = {
  value?: string;
  onChange: (value: string | null) => void;
  className?: string;
  disabled?: boolean;
  accept?: string;
  maxSize?: number;
  placeholder?: string;
};

export function ImageUpload({ value, onChange, className, disabled = false, accept = 'image/*', maxSize = 5, placeholder = 'Click to upload or drag and drop' }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadPreview() {
      console.log('Loading preview for value:', value);

      if (!value || value.trim() === '') {
        console.log('No value, setting preview to null');
        setPreview(null);
        return;
      }

      try {
        if (!value.startsWith('http') && !value.startsWith('file://')) {
          console.log('Getting URL for local file:', value);
          const url = await window.api.media.getUrl(value);
          console.log('Got URL:', url);
          setPreview(url);
        } else {
          console.log('Using direct URL:', value);
          setPreview(value);
        }
      } catch (error) {
        console.error('Failed to load preview:', error);
        setPreview(null);
      }
    }

    loadPreview();
  }, [value]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (disabled) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File size must be less than ${maxSize}MB`);
        return;
      }

      setIsUploading(true);

      try {
        console.log('Starting file upload:', file.name, file.size, file.type);

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        console.log('File converted to Uint8Array, size:', uint8Array.length);

        if (!window.api?.media?.save) {
          throw new Error('Media API not available');
        }

        console.log('Calling media.save...');

        const filename = await window.api.media.save(uint8Array, file.name);

        console.log('File saved successfully:', filename);

        onChange(filename);
      } catch (error) {
        console.error('Failed to upload image:', error);
        toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, maxSize, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [disabled, isUploading, handleFileUpload],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !isUploading) {
        setIsDragging(true);
      }
    },
    [disabled, isUploading],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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
    <div className={cn('relative', className)}>
      <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileSelect} className="hidden" disabled={disabled} />

      <Card
        className={cn(
          'relative overflow-hidden cursor-pointer transition-all duration-200',
          'border-2 border-dashed border-muted-foreground/25',
          'hover:border-muted-foreground/50',
          isDragging && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          preview ? 'border-solid border-border' : '',
        )}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <div className="relative group">
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleClick} disabled={disabled || isUploading}>
                  <Upload className="w-4 h-4 mr-1" />
                  Change
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={handleRemove} disabled={disabled || isUploading}>
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 p-6 text-center">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">{placeholder}</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to {maxSize}MB</p>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
