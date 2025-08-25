import { Card, CardContent } from '@renderer/components/ui/card';
import { CustomerData, Order } from 'src/types';

import { CustomerCard } from './customer-card';
import { Users } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

type CustomerGridProps = {
  customers: CustomerData[];
  onSelectCustomer: (customer: CustomerData) => void;
  selectedCustomer: CustomerData | null;
};

export function CustomerGrid({ customers, onSelectCustomer, selectedCustomer }: CustomerGridProps) {
  const [parent] = useAutoAnimate();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Customer List</h2>
      <div ref={parent} className="space-y-3">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No customers found</h3>
              <p className="text-muted-foreground">Customers will appear here once orders are placed</p>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <CustomerCard
              key={`${customer.name}-${customer.phone}`}
              customer={customer}
              onClick={() => onSelectCustomer(customer)}
              isSelected={selectedCustomer?.name === customer.name && selectedCustomer?.phone === customer.phone}
            />
          ))
        )}
      </div>
    </div>
  );
}
