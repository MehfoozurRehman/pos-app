import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Search } from 'lucide-react';
import React from 'react';

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export function ProductFilters({ searchQuery, onSearchChange, selectedCategory, onCategoryChange, categories }: ProductFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder="Search products..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={selectedCategory === 'All' ? 'default' : 'outline'} size="sm" onClick={() => onCategoryChange('All')}>
          All
        </Button>
        {categories.map((category) => (
          <Button key={category} variant={selectedCategory === category ? 'default' : 'outline'} size="sm" onClick={() => onCategoryChange(category)}>
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
