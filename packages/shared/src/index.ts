// Common types for POS system
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  barcode?: string;
  description?: string;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Transaction {
  id: string;
  customerId?: string;
  items: TransactionItem[];
  total: number;
  tax: number;
  discount: number;
  paymentMethod: PaymentMethod;
  timestamp: Date;
  status: TransactionStatus;
}

export interface TransactionItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'card' | 'digital';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const calculateTax = (amount: number, taxRate: number = 0.08): number => {
  return amount * taxRate;
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};