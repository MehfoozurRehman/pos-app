'use client';

import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileUploaded: (file: File, dataUrl: string) => void;
  accept?: string;
  maxSize?: number;
  currentFile?: {
    file: File;
    dataUrl: string;
    filename?: string;
  };
  className?: string;
}

export function FileUpload({ onFileUploaded, accept = 'image/*', maxSize = 5, currentFile, className = '' }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onFileUploaded(file, dataUrl);
        toast.success('File loaded successfully');
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Failed to read file');
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemoveFile = () => {
    onFileUploaded({} as File, '');
    toast.success('File removed successfully');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>Logo</Label>

      {currentFile ? (
        <div className="relative border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {currentFile.dataUrl ? (
                <Image width={200} height={200} src={currentFile.dataUrl} alt="Uploaded logo" className="w-12 h-12 object-cover rounded" />
              ) : (
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentFile.filename || currentFile.file?.name || 'Uploaded file'}</p>
              <p className="text-xs text-muted-foreground">In memory - {currentFile.file ? (currentFile.file.size / 1024).toFixed(1) : '0'} KB</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Drop your logo here, or</p>
              <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'browse files'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to {maxSize}MB</p>
          </div>
        </div>
      )}

      <Input ref={fileInputRef} type="file" accept={accept} onChange={handleFileSelect} className="hidden" disabled={isUploading} />
    </div>
  );
}
