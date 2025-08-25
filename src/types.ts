export type EnrichedOrder = Order & {
  productDetails: Array<{
    productId: string;
    productName: string;
    productImage: string;
    barcode: string;
    price: number;
    discount: number;
    finalPrice: number;
  }>;
  total: number;
  itemsCount: number;
};

export type CustomerData = {
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
};

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
  pictureUrl?: string;
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
  quantity: number;
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
  updatedAt?: string;
};

export type Shop = {
  id: string;
  shopId: string;
  owner: string;
  name: string;
  logo: string;
  logoUrl?: string;
  location: string;
  phone?: string;
  email?: string;
  description?: string;
  theme?: 'light' | 'dark' | 'system';
  createdAt?: string;
};

export type DBSchema = {
  notes: Notes[];
  products: Product[];
  inventory: Inventory[];
  orders: Order[];
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
