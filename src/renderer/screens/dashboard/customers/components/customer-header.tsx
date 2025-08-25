import { Users } from 'lucide-react';

interface CustomerHeaderProps {
  totalCustomers: number;
}

export function CustomerHeader({ totalCustomers }: CustomerHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Customers
        </h1>
        <p className="text-muted-foreground">View customer insights and purchase history ({totalCustomers} customers)</p>
      </div>
    </div>
  );
}
