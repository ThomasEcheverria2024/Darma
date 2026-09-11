export type Product = {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  cost: number;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  notes: string;
};

export type Sale = {
  id: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  costTotal: number;
  customerId?: string;
  customerName?: string;
  total: number;
};

export type AppState = {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
};
