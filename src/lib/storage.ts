import { supabase } from "@/lib/supabase";
import type { AppState, Customer, Product, Sale } from "@/types";

const STORAGE_KEY = "darma-state-v1";

const defaultProducts: Product[] = [
  { id: "prod-1", code: "D-001", name: "Shampoo Automotriz 500ml", category: "Lavado", stock: 12, minStock: 4 },
  { id: "prod-2", code: "D-002", name: "Limpiador de Tapizados", category: "Interior", stock: 7, minStock: 3 },
  { id: "prod-3", code: "D-003", name: "Cera Protectora 1L", category: "Pulido", stock: 5, minStock: 2 },
];

const defaultCustomers: Customer[] = [
  { id: "cli-1", name: "Juan Pérez", phone: "+54 11 5555-1212", notes: "Cliente frecuente" },
  { id: "cli-2", name: "María López", phone: "+54 11 5555-9898", notes: "Entrega en taller" },
];

const defaultSales: Sale[] = [
  {
    id: "sale-1",
    date: new Date().toISOString(),
    productId: "prod-1",
    productName: "Shampoo Automotriz 500ml",
    quantity: 2,
    salePrice: 1800,
    customerId: "cli-1",
    customerName: "Juan Pérez",
    total: 3600,
  },
];

export function createInitialState(): AppState {
  return {
    products: defaultProducts,
    customers: defaultCustomers,
    sales: defaultSales,
  };
}

function normalizeState(input: Partial<AppState> | null | undefined): AppState {
  const base = createInitialState();

  if (!input) {
    return base;
  }

  return {
    products: Array.isArray(input.products) ? input.products : base.products,
    customers: Array.isArray(input.customers) ? input.customers : base.customers,
    sales: Array.isArray(input.sales) ? input.sales : base.sales,
  };
}

export async function loadState(): Promise<AppState> {
  if (supabase) {
    const { data, error } = await supabase.from("products").select("*, sales(*), customers(*)");

    if (!error && data) {
      return normalizeState({
        products: data.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          category: item.category,
          stock: Number(item.stock ?? 0),
          minStock: Number(item.min_stock ?? 0),
        })),
        customers: [],
        sales: [],
      });
    }
  }

  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return createInitialState();
    }

    return normalizeState(JSON.parse(saved));
  } catch {
    return createInitialState();
  }
}

export async function persistState(state: AppState) {
  if (supabase) {
    await supabase.from("products").upsert(
      state.products.map((product) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        stock: product.stock,
        min_stock: product.minStock,
      })),
      { onConflict: "id" },
    );

    await supabase.from("customers").upsert(
      state.customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        notes: customer.notes,
      })),
      { onConflict: "id" },
    );

    await supabase.from("sales").upsert(
      state.sales.map((sale) => ({
        id: sale.id,
        date: sale.date,
        product_id: sale.productId,
        product_name: sale.productName,
        quantity: sale.quantity,
        sale_price: sale.salePrice,
        customer_id: sale.customerId ?? null,
        customer_name: sale.customerName ?? null,
        total: sale.total,
      })),
      { onConflict: "id" },
    );

    return;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
