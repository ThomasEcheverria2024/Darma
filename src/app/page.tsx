"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import * as XLSX from "xlsx";
import { loadState, persistState } from "@/lib/storage";
import { normalizeImportedProduct } from "@/lib/excel";
import type { AppState, Customer, Product, Sale } from "@/types";

const emptyCustomer: Omit<Customer, "id"> = {
  name: "",
  phone: "",
  notes: "",
};

const defaultState: AppState = {
  products: [],
  customers: [],
  sales: [],
};

const PAGE_SIZE = 8;

type TabKey = "products" | "customers" | "sales";

export default function HomePage() {
  const [state, setState] = useState<AppState>(defaultState);
  const [activeTab, setActiveTab] = useState<TabKey>("products");
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("General");
  const [productStock, setProductStock] = useState("0");
  const [productMinStock, setProductMinStock] = useState("0");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [saleProductId, setSaleProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [salePrice, setSalePrice] = useState("0");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productPage, setProductPage] = useState(1);

  useEffect(() => {
    document.body.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    async function init() {
      const loaded = await loadState();
      setState(loaded);
      if (loaded.products[0]) {
        setSaleProductId(loaded.products[0].id);
      }
      setLoading(false);
    }

    init();
  }, []);

  useEffect(() => {
    if (!loading) {
      persistState(state).catch(() => undefined);
    }
  }, [state, loading]);

  useEffect(() => {
    if (!state.products.some((product) => product.id === saleProductId)) {
      setSaleProductId(state.products[0]?.id ?? "");
    }
  }, [saleProductId, state.products]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(state.products.length / PAGE_SIZE));
    setProductPage((current) => Math.min(current, totalPages));
  }, [state.products.length]);

  const selectedProduct = useMemo(
    () => state.products.find((product) => product.id === saleProductId) ?? null,
    [saleProductId, state.products],
  );

  const totalSale = useMemo(() => {
    const qty = Number(saleQuantity || 0);
    const price = Number(salePrice || 0);
    return qty * price;
  }, [saleQuantity, salePrice]);

  const lowStockProducts = state.products.filter(
    (product) => product.stock <= product.minStock,
  );

  const totalPages = Math.max(1, Math.ceil(state.products.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * PAGE_SIZE;
    return state.products.slice(start, start + PAGE_SIZE);
  }, [productPage, state.products]);

  function resetProductForm() {
    setEditingProductId(null);
    setProductCode("");
    setProductName("");
    setProductCategory("General");
    setProductStock("0");
    setProductMinStock("0");
  }

  function addProduct(event: FormEvent) {
    event.preventDefault();
    const code = productCode.trim();
    const name = productName.trim();

    if (!code || !name) {
      setError("Debes completar código y nombre del producto.");
      return;
    }

    const parsedStock = Number(productStock || 0);
    const parsedMinStock = Number(productMinStock || 0);

    if (Number.isNaN(parsedStock) || Number.isNaN(parsedMinStock)) {
      setError("Los valores de stock deben ser numéricos.");
      return;
    }

    if (editingProductId) {
      setState((prev) => ({
        ...prev,
        products: prev.products.map((product) =>
          product.id === editingProductId
            ? {
                ...product,
                code,
                name,
                category: productCategory || "General",
                stock: parsedStock,
                minStock: parsedMinStock,
              }
            : product,
        ),
      }));

      setSuccess("Producto actualizado correctamente.");
      setError("");
      resetProductForm();
      return;
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      code,
      name,
      category: productCategory || "General",
      stock: parsedStock,
      minStock: parsedMinStock,
    };

    setState((prev) => ({
      ...prev,
      products: [newProduct, ...prev.products],
    }));

    setError("");
    setSuccess("Producto agregado correctamente.");
    setSaleProductId(newProduct.id);
    resetProductForm();
  }

  function editProduct(product: Product) {
    setEditingProductId(product.id);
    setProductCode(product.code);
    setProductName(product.name);
    setProductCategory(product.category);
    setProductStock(String(product.stock));
    setProductMinStock(String(product.minStock));
    setError("");
    setSuccess("Editando producto seleccionado.");
    setActiveTab("products");
  }

  function deleteProduct(productId: string) {
    const product = state.products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    const confirmed = typeof window !== "undefined"
      ? window.confirm(`¿Eliminar el producto ${product.name}?`)
      : true;

    if (!confirmed) {
      return;
    }

    setState((prev) => ({
      ...prev,
      products: prev.products.filter((item) => item.id !== productId),
      sales: prev.sales.filter((sale) => sale.productId !== productId),
    }));

    if (editingProductId === productId) {
      resetProductForm();
    }

    if (saleProductId === productId) {
      const nextProduct = state.products.find((item) => item.id !== productId);
      setSaleProductId(nextProduct?.id ?? "");
    }

    setError("");
    setSuccess("Producto eliminado correctamente.");
  }

  function addCustomer(event: FormEvent) {
    event.preventDefault();
    const name = customer.name.trim();

    if (!name) {
      setError("El nombre del cliente es obligatorio para registrarlo.");
      return;
    }

    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name,
      phone: customer.phone.trim(),
      notes: customer.notes.trim(),
    };

    setState((prev) => ({
      ...prev,
      customers: [newCustomer, ...prev.customers],
    }));

    setCustomer(emptyCustomer);
    setSelectedCustomerId(newCustomer.id);
    setError("");
    setSuccess("Cliente guardado.");
  }

  function handleSale(event: FormEvent) {
    event.preventDefault();
    if (!selectedProduct) {
      setError("Debes seleccionar un producto para la venta.");
      return;
    }

    const quantity = Number(saleQuantity || 0);
    const price = Number(salePrice || 0);

    if (quantity <= 0 || price < 0) {
      setError("La cantidad y el precio de venta deben ser válidos.");
      return;
    }

    if (selectedProduct.stock < quantity) {
      setError("No hay suficiente stock para esa venta.");
      return;
    }

    const customerSelected = state.customers.find((item) => item.id === selectedCustomerId);

    const sale: Sale = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      salePrice: price,
      customerId: customerSelected?.id,
      customerName: customerSelected?.name,
      total: quantity * price,
    };

    setState((prev) => ({
      ...prev,
      sales: [sale, ...prev.sales],
      products: prev.products.map((product) =>
        product.id === selectedProduct.id
          ? { ...product, stock: product.stock - quantity }
          : product,
      ),
    }));

    setSaleQuantity("1");
    setSalePrice("0");
    setSuccess("Venta registrada con éxito.");
    setError("");
  }

  async function handleExcelImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, { defval: "" });

    const importedProducts = rows
      .map((row, index) => normalizeImportedProduct(row, index))
      .filter(Boolean) as Product[];

    if (!importedProducts.length) {
      setError("No se encontraron productos válidos en el archivo.");
      return;
    }

    setState((prev) => ({
      ...prev,
      products: [...importedProducts, ...prev.products],
    }));

    setSuccess(`Se importaron ${importedProducts.length} productos desde la lista.`);
    setError("");
    event.target.value = "";
  }

  return (
    <main className="page-shell">
      <header className="brand-header">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <span className="mark-slice slice-one" />
            <span className="mark-slice slice-two" />
          </div>
          <div className="brand-copy">
            <h1>DARMA</h1>
            <span>DISTRIBUTION</span>
          </div>
        </div>

        <div className="header-actions">
          <button type="button" className="theme-toggle" onClick={() => setDarkMode((current) => !current)}>
            {darkMode ? "Modo claro" : "Modo oscuro"}
          </button>
          <div className="top-status">
            <span>{loading ? "Cargando..." : `${state.products.length} productos`}</span>
          </div>
        </div>
      </header>

      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      <nav className="tabs" aria-label="Secciones principales">
        {[
          { key: "products", label: "Productos" },
          { key: "customers", label: "Clientes" },
          { key: "sales", label: "Ventas" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? "tab-button active" : "tab-button"}
            onClick={() => setActiveTab(tab.key as TabKey)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className={activeTab === "products" ? "panel visible" : "panel hidden"}>
        <div className="panel-grid two-up">
          <div className="card">
            <h2>{editingProductId ? "Editar producto" : "Productos"}</h2>
            <form onSubmit={addProduct} className="stack">
              <div className="row three-cols">
                <label>
                  Código
                  <input value={productCode} onChange={(e) => setProductCode(e.target.value)} />
                </label>
                <label>
                  Nombre
                  <input value={productName} onChange={(e) => setProductName(e.target.value)} />
                </label>
                <label>
                  Categoría
                  <input value={productCategory} onChange={(e) => setProductCategory(e.target.value)} />
                </label>
              </div>

              <div className="row three-cols">
                <label>
                  Stock
                  <input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} />
                </label>
                <label>
                  Stock mínimo
                  <input type="number" value={productMinStock} onChange={(e) => setProductMinStock(e.target.value)} />
                </label>
                <div className="form-actions">
                  <button type="submit" className="primary-btn">
                    {editingProductId ? "Guardar cambios" : "Agregar producto"}
                  </button>
                  {editingProductId ? (
                    <button type="button" className="secondary-btn" onClick={resetProductForm}>
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>
            </form>

            <div className="import-box">
              <label className="upload-label">
                Importar lista de Excel
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} />
              </label>
            </div>
          </div>

          <div className="card">
            <h2>Clientes</h2>
            <form onSubmit={addCustomer} className="stack">
              <div className="row two-cols">
                <label>
                  Nombre
                  <input value={customer.name} onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))} />
                </label>
                <label>
                  Teléfono
                  <input value={customer.phone} onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))} />
                </label>
              </div>
              <label>
                Observaciones
                <textarea value={customer.notes} onChange={(e) => setCustomer((prev) => ({ ...prev, notes: e.target.value }))} />
              </label>
              <button type="submit" className="primary-btn">Guardar cliente</button>
            </form>
          </div>
        </div>

        <div className="card product-table-card">
          <div className="table-toolbar">
            <h2>Inventario</h2>
            <span>{state.products.length} productos</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className={product.stock <= product.minStock ? "low-stock" : ""}>
                    <td>{product.code}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td>{product.minStock}</td>
                    <td>
                      <div className="action-group">
                        <button type="button" className="row-btn edit-btn" onClick={() => editProduct(product)}>
                          Editar
                        </button>
                        <button type="button" className="row-btn delete-btn" onClick={() => deleteProduct(product.id)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {state.products.length > PAGE_SIZE ? (
            <div className="pagination">
              <button
                type="button"
                className="secondary-btn"
                disabled={productPage === 1}
                onClick={() => setProductPage((page) => Math.max(1, page - 1))}
              >
                Anterior
              </button>

              <span>
                Página {productPage} de {totalPages}
              </span>

              <button
                type="button"
                className="secondary-btn"
                disabled={productPage >= totalPages}
                onClick={() => setProductPage((page) => Math.min(totalPages, page + 1))}
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className={activeTab === "customers" ? "panel visible" : "panel hidden"}>
        <div className="card customer-panel">
          <div className="customer-header">
            <h2>Listado de clientes</h2>
            <span>{state.customers.length} registrados</span>
          </div>

          <div className="list-box customer-list-box">
            {state.customers.length ? (
              <ul className="customer-list">
                {state.customers.map((customerItem) => (
                  <li key={customerItem.id}>
                    <button type="button" onClick={() => setSelectedCustomerId(customerItem.id)} className={selectedCustomerId === customerItem.id ? "selected" : ""}>
                      <div className="customer-avatar">{customerItem.name.charAt(0).toUpperCase()}</div>
                      <div className="customer-info">
                        <strong>{customerItem.name}</strong>
                        <span>{customerItem.phone || "Sin teléfono"}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No hay clientes cargados aún.</p>
            )}
          </div>
        </div>
      </section>

      <section className={activeTab === "sales" ? "panel visible" : "panel hidden"}>
        <div className="card sales-card">
          <h2>Registrar venta</h2>
          <form onSubmit={handleSale} className="stack">
            <div className="row three-cols">
              <label>
                Producto
                <select value={saleProductId} onChange={(e) => setSaleProductId(e.target.value)}>
                  {state.products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Cantidad
                <input type="number" min="1" value={saleQuantity} onChange={(e) => setSaleQuantity(e.target.value)} />
              </label>
              <label>
                Precio de venta
                <input type="number" min="0" step="1" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
              </label>
            </div>

            <div className="row two-cols sales-summary-row">
              <label>
                Cliente (opcional)
                <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                  <option value="">Sin cliente</option>
                  {state.customers.map((customerItem) => (
                    <option key={customerItem.id} value={customerItem.id}>{customerItem.name}</option>
                  ))}
                </select>
              </label>

              <div className="summary-box">
                <span>TOTAL</span>
                <strong>$ {totalSale.toLocaleString("es-AR")}</strong>
                {selectedProduct ? <small>Stock disponible: {selectedProduct.stock}</small> : null}
              </div>
            </div>

            <button type="submit" className="primary-btn submit-btn">Guardar venta</button>
          </form>
        </div>

        <div className="card sales-history-card">
          <h2>Resumen</h2>
          <div className="metrics-row">
            <div className="metric">
              <span>Ventas</span>
              <strong>{state.sales.length}</strong>
            </div>
            <div className="metric">
              <span>Clientes</span>
              <strong>{state.customers.length}</strong>
            </div>
            <div className="metric danger">
              <span>Stock bajo</span>
              <strong>{lowStockProducts.length}</strong>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Cliente</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {state.sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.date).toLocaleDateString("es-AR")}</td>
                    <td>{sale.productName}</td>
                    <td>{sale.quantity}</td>
                    <td>{sale.customerName || "Sin cliente"}</td>
                    <td>$ {sale.total.toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
