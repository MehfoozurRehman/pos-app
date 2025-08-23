export type Notes = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  categories: string[];
  picture: string;
  createdAt: string;
};

export type Inventory = {
  id: string;
  productId: string;
  barcode: string;
  actualPrice: number;
  sellingPrice: number;
  createdAt: string;
};

export type OrderItem = {
  productId: string;
  barcode: string;
  discount?: number;
};

export type Order = {
  id: string;
  orderId: string;
  status: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  discount?: number;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
};

export type Shop = {
  id: string;
  shopId: string;
  owner: string;
  name: string;
  logo: string;
  location: string;
  phone?: string;
  email?: string;
  address?: string;
  currency?: string;
  taxRate?: number;
  createdAt?: string;
};

export type DBSchema = {
  notes: Notes[];
  products: Product[];
  inventory: Inventory[];
  orders: Order[];
  customers: Customer[];
  shop: Shop | null;
  changes: {
    id: string;
    table: keyof DBSchema | string;
    action: 'create' | 'update' | 'delete';
    itemId: string;
    timestamp: string;
    data?: any;
  }[];
};
