import { supabase } from "@/lib/supabase";
import type { AppState, Customer, Product, Sale } from "@/types";

const STORAGE_KEY = "darma-state-v1";

const defaultProducts: Product[] = [
  { id: "prod-1", code: "LAV-001", name: "ATOMIC", category: "Lava autos", stock: 18, minStock: 4 },
  { id: "prod-2", code: "LAV-002", name: "BANANA", category: "Lava autos", stock: 20, minStock: 5 },
  { id: "prod-3", code: "LAV-003", name: "WAX", category: "Lava autos", stock: 16, minStock: 4 },
  { id: "prod-4", code: "LAV-004", name: "SUPREME", category: "Lava autos", stock: 14, minStock: 4 },
  { id: "prod-5", code: "LAV-005", name: "PURE FOAM", category: "Lava autos", stock: 15, minStock: 4 },
  { id: "prod-6", code: "LAV-006", name: "LUXURY FOAM", category: "Lava autos", stock: 12, minStock: 3 },
  { id: "prod-7", code: "LAV-007", name: "ELITE", category: "Lava autos", stock: 13, minStock: 3 },
  { id: "prod-8", code: "LAV-008", name: "DIP CLUB", category: "Lava autos", stock: 10, minStock: 3 },
  { id: "prod-9", code: "LAV-009", name: "ENERGY", category: "Lava autos", stock: 11, minStock: 3 },
  { id: "prod-10", code: "LAV-010", name: "HYPER BLACK", category: "Lava autos", stock: 9, minStock: 2 },

  { id: "prod-11", code: "CER-001", name: "CHERRY QUICK", category: "Ceras líquidas", stock: 12, minStock: 3 },
  { id: "prod-12", code: "CER-002", name: "EXTREME DETAIL", category: "Ceras líquidas", stock: 10, minStock: 3 },
  { id: "prod-13", code: "CER-003", name: "WATERLESS", category: "Ceras líquidas", stock: 11, minStock: 3 },
  { id: "prod-14", code: "CER-004", name: "ILLUSION WAX", category: "Ceras líquidas", stock: 8, minStock: 2 },
  { id: "prod-15", code: "CER-005", name: "LUXURY", category: "Ceras líquidas", stock: 9, minStock: 2 },
  { id: "prod-16", code: "CER-006", name: "LA LAVISH", category: "Ceras líquidas", stock: 7, minStock: 2 },
  { id: "prod-17", code: "CER-007", name: "THE BOSS SHINE", category: "Ceras líquidas", stock: 8, minStock: 2 },
  { id: "prod-18", code: "CER-008", name: "ENERGY SEAL", category: "Ceras líquidas", stock: 6, minStock: 2 },
  { id: "prod-19", code: "CER-009", name: "SEAL IT ALL", category: "Ceras líquidas", stock: 7, minStock: 2 },

  { id: "prod-20", code: "LIM-001", name: "INFERNO GEL", category: "Lavadores", stock: 12, minStock: 3 },
  { id: "prod-21", code: "LIM-002", name: "ALL CLEAN", category: "Lavadores", stock: 11, minStock: 3 },
  { id: "prod-22", code: "LIM-003", name: "ALKALINE WHEELS", category: "Lavadores", stock: 10, minStock: 3 },
  { id: "prod-23", code: "LIM-004", name: "FORMULE CONQUEST", category: "Lavadores", stock: 8, minStock: 2 },
  { id: "prod-24", code: "LIM-005", name: "WATER SPOT", category: "Lavadores", stock: 7, minStock: 2 },
  { id: "prod-25", code: "LIM-006", name: "ALU WASH", category: "Lavadores", stock: 9, minStock: 2 },
  { id: "prod-26", code: "LIM-007", name: "CTRL Z", category: "Lavadores", stock: 10, minStock: 3 },
  { id: "prod-27", code: "LIM-008", name: "BUG REMOVER", category: "Lavadores", stock: 9, minStock: 2 },
  { id: "prod-28", code: "LIM-009", name: "CLEAN VISION", category: "Lavadores", stock: 8, minStock: 2 },
  { id: "prod-29", code: "LIM-010", name: "X-TAR", category: "Lavadores", stock: 6, minStock: 2 },
  { id: "prod-30", code: "LIM-011", name: "IRON WARNING", category: "Lavadores", stock: 7, minStock: 2 },

  { id: "prod-31", code: "REV-001", name: "NTP", category: "Revitalizadores de exteriores", stock: 8, minStock: 2 },
  { id: "prod-32", code: "REV-002", name: "HELLS", category: "Revitalizadores de exteriores", stock: 7, minStock: 2 },
  { id: "prod-33", code: "REV-003", name: "NEW TIRE", category: "Revitalizadores de exteriores", stock: 9, minStock: 2 },
  { id: "prod-34", code: "REV-004", name: "GEL SHINE", category: "Revitalizadores de exteriores", stock: 10, minStock: 3 },
  { id: "prod-35", code: "REV-005", name: "DARK FLUID", category: "Revitalizadores de exteriores", stock: 8, minStock: 2 },
  { id: "prod-36", code: "REV-006", name: "HITS BONES", category: "Revitalizadores de exteriores", stock: 7, minStock: 2 },

  { id: "prod-37", code: "INT-001", name: "BUBBLE GUM", category: "Revidores de interiores", stock: 6, minStock: 2 },
  { id: "prod-38", code: "INT-002", name: "TRIM LOOK CANDY", category: "Revidores de interiores", stock: 7, minStock: 2 },
  { id: "prod-39", code: "INT-003", name: "MANGO GO", category: "Revidores de interiores", stock: 8, minStock: 2 },
  { id: "prod-40", code: "INT-004", name: "SPRAY LEATHER", category: "Revidores de interiores", stock: 9, minStock: 2 },
  { id: "prod-41", code: "INT-005", name: "HOLY GLOSS", category: "Revidores de interiores", stock: 7, minStock: 2 },
  { id: "prod-42", code: "INT-006", name: "CANDY CREAM", category: "Revidores de interiores", stock: 8, minStock: 2 },
  { id: "prod-43", code: "INT-007", name: "UVA SHAKE", category: "Revidores de interiores", stock: 6, minStock: 2 },
  { id: "prod-44", code: "INT-008", name: "MASH MELON", category: "Revidores de interiores", stock: 7, minStock: 2 },
  { id: "prod-45", code: "INT-009", name: "FRUTY CREAM", category: "Revidores de interiores", stock: 8, minStock: 2 },
  { id: "prod-46", code: "INT-010", name: "CREME LOOK", category: "Revidores de interiores", stock: 7, minStock: 2 },
  { id: "prod-47", code: "INT-011", name: "ENERGY TRIM", category: "Revidores de interiores", stock: 7, minStock: 2 },
  { id: "prod-48", code: "INT-012", name: "SNEAKERS", category: "Revidores de interiores", stock: 8, minStock: 2 },
  { id: "prod-49", code: "INT-013", name: "TRIM LEATHER", category: "Revidores de interiores", stock: 7, minStock: 2 },
  { id: "prod-50", code: "INT-014", name: "LUXURY TRIM", category: "Revidores de interiores", stock: 8, minStock: 2 },
  { id: "prod-51", code: "INT-015", name: "FASCIA SIO2", category: "Revidores de interiores", stock: 7, minStock: 2 },

  { id: "prod-52", code: "PRO-001", name: "CLAY LUB", category: "Línea profesional", stock: 9, minStock: 2 },
  { id: "prod-53", code: "PRO-002", name: "PAINT PREPARE", category: "Línea profesional", stock: 8, minStock: 2 },
  { id: "prod-54", code: "PRO-003", name: "POLISH", category: "Línea profesional", stock: 7, minStock: 2 },
  { id: "prod-55", code: "PRO-004", name: "FINISH", category: "Línea profesional", stock: 8, minStock: 2 },
  { id: "prod-56", code: "PRO-005", name: "LIGHT COLORS", category: "Línea profesional", stock: 7, minStock: 2 },
  { id: "prod-57", code: "PRO-006", name: "DARK COLORS", category: "Línea profesional", stock: 7, minStock: 2 },
  { id: "prod-58", code: "PRO-007", name: "ALL IN ONE", category: "Línea profesional", stock: 8, minStock: 2 },
  { id: "prod-59", code: "PRO-008", name: "CREME WAX BANANA", category: "Línea profesional", stock: 7, minStock: 2 },
  { id: "prod-60", code: "PRO-009", name: "MYSTIC SEAL", category: "Línea profesional", stock: 7, minStock: 2 },
  { id: "prod-61", code: "PRO-010", name: "WATERMELON", category: "Línea profesional", stock: 8, minStock: 2 },

  { id: "prod-62", code: "250-001", name: "NTP", category: "250", stock: 9, minStock: 2 },
  { id: "prod-63", code: "250-002", name: "HELLS", category: "250", stock: 8, minStock: 2 },
  { id: "prod-64", code: "250-003", name: "NEW TIRE", category: "250", stock: 8, minStock: 2 },
  { id: "prod-65", code: "250-004", name: "GEL SHINE", category: "250", stock: 7, minStock: 2 },
  { id: "prod-66", code: "250-005", name: "CREME LOOK", category: "250", stock: 6, minStock: 2 },
  { id: "prod-67", code: "250-006", name: "LUXURY TRIM", category: "250", stock: 7, minStock: 2 },
  { id: "prod-68", code: "250-007", name: "FASCIA SIO2", category: "250", stock: 8, minStock: 2 },

  { id: "prod-69", code: "MIN-001", name: "MINI ALL IN ONE", category: "Mins", stock: 10, minStock: 3 },
  { id: "prod-70", code: "MIN-002", name: "MINI POLISH", category: "Mins", stock: 10, minStock: 3 },
  { id: "prod-71", code: "MIN-003", name: "MINI FINISH", category: "Mins", stock: 9, minStock: 2 },
  { id: "prod-72", code: "MIN-004", name: "MINI LIGHT COLORS", category: "Mins", stock: 9, minStock: 2 },
  { id: "prod-73", code: "MIN-005", name: "MINI DARK COLORS", category: "Mins", stock: 9, minStock: 2 },
  { id: "prod-74", code: "MIN-006", name: "MINI MYSTIC", category: "Mins", stock: 10, minStock: 3 },
  { id: "prod-75", code: "MIN-007", name: "MINI WAX BANANA", category: "Mins", stock: 10, minStock: 3 },
  { id: "prod-76", code: "MIN-008", name: "MINI WATERMELON", category: "Mins", stock: 9, minStock: 2 },

  { id: "prod-77", code: "PER-001", name: "PARTY SUMMER", category: "Perfumes", stock: 12, minStock: 4 },
  { id: "prod-78", code: "PER-002", name: "NEW CAR", category: "Perfumes", stock: 11, minStock: 4 },
  { id: "prod-79", code: "PER-003", name: "CANDY BANANA", category: "Perfumes", stock: 12, minStock: 4 },
  { id: "prod-80", code: "PER-004", name: "SWEET FRUITY", category: "Perfumes", stock: 10, minStock: 3 },
  { id: "prod-81", code: "PER-005", name: "CHERRY", category: "Perfumes", stock: 12, minStock: 4 },
  { id: "prod-82", code: "PER-006", name: "MANGO GO", category: "Perfumes", stock: 11, minStock: 4 },
  { id: "prod-83", code: "PER-007", name: "BUBBLE GUM", category: "Perfumes", stock: 10, minStock: 3 },
  { id: "prod-84", code: "PER-008", name: "UVA", category: "Perfumes", stock: 10, minStock: 3 },
  { id: "prod-85", code: "PER-009", name: "THE BOSS", category: "Perfumes", stock: 11, minStock: 3 },
  { id: "prod-86", code: "PER-010", name: "FRESH LEMON & MINT", category: "Perfumes", stock: 10, minStock: 3 },
  { id: "prod-87", code: "PER-011", name: "ROCKET POWER", category: "Perfumes", stock: 9, minStock: 2 },
  { id: "prod-88", code: "PER-012", name: "SNEAKERS", category: "Perfumes", stock: 9, minStock: 2 },
  { id: "prod-89", code: "PER-013", name: "INVICTUS", category: "Perfumes", stock: 8, minStock: 2 },
  { id: "prod-90", code: "PER-014", name: "LADY", category: "Perfumes", stock: 8, minStock: 2 },
  { id: "prod-91", code: "PER-015", name: "WANAWE", category: "Perfumes", stock: 8, minStock: 2 },
  { id: "prod-92", code: "PER-016", name: "ENERGY", category: "Perfumes", stock: 9, minStock: 2 },
  { id: "prod-93", code: "PER-017", name: "LUXURY", category: "Perfumes", stock: 8, minStock: 2 },
  { id: "prod-94", code: "PER-018", name: "FASCIA", category: "Perfumes", stock: 7, minStock: 2 },

  { id: "prod-95", code: "ARO-001", name: "BUBBLE GUM", category: "Aromatizantes", stock: 10, minStock: 3 },
  { id: "prod-96", code: "ARO-002", name: "DARK SECRET", category: "Aromatizantes", stock: 9, minStock: 2 },
  { id: "prod-97", code: "ARO-003", name: "VANILLA GOLD", category: "Aromatizantes", stock: 9, minStock: 2 },
  { id: "prod-98", code: "ARO-004", name: "UVA", category: "Aromatizantes", stock: 8, minStock: 2 },
  { id: "prod-99", code: "ARO-005", name: "LIMÓN", category: "Aromatizantes", stock: 8, minStock: 2 },
  { id: "prod-100", code: "ARO-006", name: "CHAMPÁK", category: "Aromatizantes", stock: 8, minStock: 2 },

  { id: "prod-101", code: "SEL-001", name: "ANTI FOG", category: "Selladores", stock: 9, minStock: 2 },
  { id: "prod-102", code: "SEL-002", name: "T1 SEMI PERMANENTE", category: "Selladores", stock: 8, minStock: 2 },
  { id: "prod-103", code: "SEL-003", name: "CRISTAL TITANIUM", category: "Selladores", stock: 7, minStock: 2 },
  { id: "prod-104", code: "SEL-004", name: "CARNAUBA PURE WAX", category: "Selladores", stock: 7, minStock: 2 },
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
