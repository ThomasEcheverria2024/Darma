import type { Product } from "@/types";

const PRODUCT_KEYS = [
  "codigo",
  "code",
  "sku",
  "código",
  "producto",
  "nombre",
  "name",
  "articulo",
  "artículo",
];

const CATEGORY_KEYS = ["categoria", "category", "familia", "tipo", "linea"];
const STOCK_KEYS = ["stock", "cantidad", "qty", "unidades", "existencias"];
const MIN_STOCK_KEYS = ["stock_minimo", "min_stock", "minimo", "stockm", "stock_min"];
const COST_KEYS = ["costo", "cost", "precio_costo", "cost_price", "valor_costo"];

export function findFirstValue(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  for (const [k, v] of Object.entries(row)) {
    const normalizedKey = String(k).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (keys.some((key) => normalizedKey.includes(key.toLowerCase().replace(/[^a-z0-9]/g, "")))) {
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        return String(v).trim();
      }
    }
  }

  return "";
}

export function normalizeImportedProduct(row: Record<string, any>, index: number): Product | null {
  const code = findFirstValue(row, PRODUCT_KEYS) || `D-${String(index + 1).padStart(4, "0")}`;
  const name = findFirstValue(row, ["nombre", "name", "producto", "articulo", "artículo", "descripcion"]) || `Producto ${index + 1}`;
  const category = findFirstValue(row, CATEGORY_KEYS) || "General";
  const stockValue = findFirstValue(row, STOCK_KEYS);
  const minStockValue = findFirstValue(row, MIN_STOCK_KEYS);
  const costValue = findFirstValue(row, COST_KEYS);

  const stock = Number(stockValue || 0);
  const minStock = Number(minStockValue || 0);
  const cost = Number(costValue || 0);

  return {
    id: `import-${Date.now()}-${index}`,
    code,
    name,
    category,
    stock: Number.isFinite(stock) ? stock : 0,
    minStock: Number.isFinite(minStock) ? minStock : 0,
    cost: Number.isFinite(cost) ? cost : 0,
  };
}
