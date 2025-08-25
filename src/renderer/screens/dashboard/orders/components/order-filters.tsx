import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Search, SortAsc, Filter } from 'lucide-react';

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  sortBy: 'date' | 'total' | 'customer' | 'status';
  onSortChange: (sort: 'date' | 'total' | 'customer' | 'status') => void;
}

export function OrderFilters({ searchQuery, onSearchChange, statusFilter, onStatusChange, sortBy, onSortChange }: OrderFiltersProps) {
  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const sortOptions = [
    { value: 'date' as const, label: 'Date' },
    { value: 'total' as const, label: 'Total Amount' },
    { value: 'customer' as const, label: 'Customer' },
    { value: 'status' as const, label: 'Status' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder="Search orders by ID, customer name, or phone..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Status:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((option) => (
            <Button key={option.value} variant={statusFilter === option.value ? 'default' : 'outline'} size="sm" className="border" onClick={() => onStatusChange(option.value)}>
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <SortAsc className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sort by:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {sortOptions.map((option) => (
            <Button key={option.value} variant={sortBy === option.value ? 'default' : 'outline'} size="sm" className="border" onClick={() => onSortChange(option.value)}>
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
