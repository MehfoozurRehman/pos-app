import { Barcode, Shuffle } from 'lucide-react';

import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { toast } from 'sonner';

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export function BarcodeInput({ value, onChange, disabled = false, placeholder = 'Enter or scan barcode', label = 'Barcode', required = false, className }: BarcodeInputProps) {
  const generateBarcode = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const barcode = `${timestamp.slice(-6)}${random}`;
    onChange(barcode);
    toast.success('Barcode generated');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.length > 0) {
      e.preventDefault();
      toast.success('Barcode entered');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="flex items-center gap-2">
          <Barcode className="w-4 h-4" />
          {label} {required && '*'}
        </Label>
      )}
      <div className="space-y-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} disabled={disabled} className="font-mono" autoComplete="off" />
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={generateBarcode} disabled={disabled} className="flex-1">
            <Shuffle className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>
      {value && (
        <div className="text-xs text-muted-foreground">
          Barcode: <span className="font-mono font-medium">{value}</span>
        </div>
      )}
    </div>
  );
}
