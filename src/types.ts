type Notes = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  categories: string[];
  picture: string;
  createdAt: string;
};

type Inventory = {
  id: string;
  productId: string;
  barcode: string;
  actualPrice: number;
  sellingPrice: number;
  createdAt: string;
};

type OrderItem = {
  productId: string;
  barcode: string;
  discount?: number;
};

type Order = {
  id: string;
  orderId: string;
  status: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  discount?: number;
  createdAt: string;
};

type Payment = {
  id: string;
  month: string;
  year: string;
  createdAt: string;
};

type Shop = {
  id: string;
  shopId: string;
  owner: string;
  name: string;
  logo: string;
  location: string;
  createdAt?: string;
};

export type DBSchema = {
  notes: Notes[];
  users: User[];
  products: Product[];
  inventory: Inventory[];
  orders: Order[];
  payments: Payment[];
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
