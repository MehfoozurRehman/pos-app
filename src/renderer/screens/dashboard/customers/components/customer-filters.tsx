import { Search, SortAsc } from 'lucide-react';

import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';

type CustomerFiltersProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'name' | 'orders' | 'spent' | 'lastOrder';
  onSortChange: (sort: 'name' | 'orders' | 'spent' | 'lastOrder') => void;
};

export function CustomerFilters({ searchQuery, onSearchChange, sortBy, onSortChange }: CustomerFiltersProps) {
  const sortOptions = [
    { value: 'name' as const, label: 'Name' },
    { value: 'orders' as const, label: 'Total Orders' },
    { value: 'spent' as const, label: 'Total Spent' },
    { value: 'lastOrder' as const, label: 'Last Order' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder="Search customers by name or phone..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <SortAsc className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sort by:</span>
        </div>
        {sortOptions.map((option) => (
          <Button key={option.value} variant={sortBy === option.value ? 'default' : 'outline'} size="sm" className="border" onClick={() => onSortChange(option.value)}>
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
