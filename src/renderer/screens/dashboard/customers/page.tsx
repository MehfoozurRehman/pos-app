import { Card, CardContent } from '@renderer/components/ui/card';
import { CustomerDetails, CustomerFilters, CustomerGrid, CustomerHeader } from './components';
import { useMemo, useState } from 'react';

import { Order } from 'src/types';
import useSWR from 'swr';

interface CustomerData {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  favoriteProducts: Array<{
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    totalSpent: number;
  }>;
  orders: Order[];
}

export default function CustomersPage() {
  const { data: orders, error } = useSWR('orders', () => window.api.db.get('orders'));
  const { data: products } = useSWR('products', () => window.api.db.get('products'));
  const { data: inventory } = useSWR('inventory', () => window.api.db.get('inventory'));

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'lastOrder'>('name');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);

  const customersData = useMemo(() => {
    if (!orders || !products || !inventory) return [];

    const customerMap = new Map<string, CustomerData>();

    orders.forEach((order) => {
      const customerKey = `${order.customerName}-${order.customerPhone}`;

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          name: order.customerName,
          phone: order.customerPhone,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: order.createdAt,
          favoriteProducts: [],
          orders: [],
        });
      }

      const customer = customerMap.get(customerKey)!;
      customer.totalOrders += 1;
      customer.orders.push(order);

      if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.createdAt;
      }

      const productMap = new Map<string, { quantity: number; totalSpent: number }>();

      order.items.forEach((item) => {
        const inventoryItem = inventory.find((inv) => inv.barcode === item.barcode);
        const product = products.find((p) => p.id === item.productId);

        if (inventoryItem && product) {
          const price = inventoryItem.sellingPrice * (1 - (item.discount || 0) / 100);
          customer.totalSpent += price;

          if (productMap.has(item.productId)) {
            const existing = productMap.get(item.productId)!;
            existing.quantity += 1;
            existing.totalSpent += price;
          } else {
            productMap.set(item.productId, {
              quantity: 1,
              totalSpent: price,
            });
          }
        }
      });

      productMap.forEach((data, productId) => {
        const product = products.find((p) => p.id === productId);
        if (product) {
          const existingFav = customer.favoriteProducts.find((fav) => fav.productId === productId);
          if (existingFav) {
            existingFav.quantity += data.quantity;
            existingFav.totalSpent += data.totalSpent;
          } else {
            customer.favoriteProducts.push({
              productId,
              productName: product.name,
              productImage: product.picture || '',
              quantity: data.quantity,
              totalSpent: data.totalSpent,
            });
          }
        }
      });
    });

    customerMap.forEach((customer) => {
      customer.favoriteProducts.sort((a, b) => b.quantity - a.quantity);
    });

    return Array.from(customerMap.values());
  }, [orders, products, inventory]);

  const filteredCustomers = useMemo(() => {
    if (!customersData) return [];

    let filtered = customersData.filter((customer) => {
      const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || customer.phone.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'orders':
          return b.totalOrders - a.totalOrders;
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'lastOrder':
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [customersData, searchQuery, sortBy]);

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Error loading customers</h3>
            <p className="text-muted-foreground">Please try refreshing the page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <CustomerHeader totalCustomers={customersData.length} />
      <CustomerFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} sortBy={sortBy} onSortChange={setSortBy} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CustomerGrid customers={filteredCustomers} onSelectCustomer={setSelectedCustomer} selectedCustomer={selectedCustomer} />
        </div>
        <div className="lg:col-span-1">
          <CustomerDetails customer={selectedCustomer} />
        </div>
      </div>
    </div>
  );
}
