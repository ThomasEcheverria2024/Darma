"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import * as XLSX from "xlsx";
import { loginUser } from "@/lib/auth";
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

type TabKey = "dashboard" | "products" | "customers" | "sales";

type SaleLineDraft = {
  id: string;
  productId: string;
  quantity: string;
  salePrice: string;
  search: string;
};

function getProductSalePrice(product?: Product) {
  return String(product?.cost ?? 0);
}

function createEmptySaleLine(productId = "", salePrice = "0", search = ""): SaleLineDraft {
  return {
    id: crypto.randomUUID(),
    productId,
    quantity: "1",
    salePrice,
    search,
  };
}

function matchesProductQuery(product: Product, query: string) {
  if (!query) {
    return true;
  }

  return (
    product.name.toLowerCase().includes(query) ||
    product.code.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query)
  );
}

export default function HomePage() {
  const [state, setState] = useState<AppState>(defaultState);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [productCode, setProductCode] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("General");
  const [productStock, setProductStock] = useState("0");
  const [productMinStock, setProductMinStock] = useState("0");
  const [productCost, setProductCost] = useState("0");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [saleLines, setSaleLines] = useState<SaleLineDraft[]>([createEmptySaleLine()]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [loginEmail, setLoginEmail] = useState("admin@darma.com");
  const [loginPassword, setLoginPassword] = useState("darma123");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("Todas");

  useEffect(() => {
    document.body.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    async function init() {
      const loaded = await loadState();
      setState(loaded);
      if (loaded.products[0]) {
        const firstProduct = loaded.products[0];
        setSaleLines([createEmptySaleLine(firstProduct.id, getProductSalePrice(firstProduct))]);
      }

      const savedSession = localStorage.getItem("darma-auth-session");

      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession) as { loggedIn?: boolean; email?: string };
          if (parsedSession.loggedIn) {
            setIsAuthenticated(true);
            setLoginEmail(parsedSession.email ?? "admin@darma.com");
          }
        } catch {
          localStorage.removeItem("darma-auth-session");
        }
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

  const categories = useMemo(
    () => ["Todas", ...new Set(state.products.map((product) => product.category).filter(Boolean))],
    [state.products],
  );

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    return state.products.filter((product) => {
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      const matchesCategory =
        productCategoryFilter === "Todas" || product.category === productCategoryFilter;

      return matchesQuery && matchesCategory;
    });
  }, [productCategoryFilter, productSearch, state.products]);

  const totalSale = useMemo(
    () =>
      saleLines.reduce((sum, line) => {
        const qty = Number(line.quantity || 0);
        const price = Number(line.salePrice || 0);
        return sum + qty * price;
      }, 0),
    [saleLines],
  );

  const lowStockProducts = state.products.filter(
    (product) => product.stock <= product.minStock,
  );

  const salesRevenue = useMemo(
    () => state.sales.reduce((sum, sale) => sum + sale.total, 0),
    [state.sales],
  );

  const totalCost = useMemo(
    () => state.sales.reduce((sum, sale) => sum + sale.costTotal, 0),
    [state.sales],
  );

  const grossProfit = salesRevenue - totalCost;

  const bestSeller = useMemo(() => {
    const ranking = state.sales.reduce<Record<string, number>>((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] ?? 0) + sale.quantity;
      return acc;
    }, {});

    const [productName, quantity] = Object.entries(ranking).sort(([, a], [, b]) => b - a)[0] ?? ["Sin ventas", 0];
    return { productName, quantity };
  }, [state.sales]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, productPage]);

  function resetProductForm() {
    setEditingProductId(null);
    setProductCode("");
    setProductName("");
    setProductCategory("General");
    setProductStock("0");
    setProductMinStock("0");
    setProductCost("0");
  }

  function resetCustomerForm() {
    setEditingCustomerId(null);
    setCustomer(emptyCustomer);
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
    const parsedCost = Number(productCost || 0);

    if (Number.isNaN(parsedStock) || Number.isNaN(parsedMinStock) || Number.isNaN(parsedCost)) {
      setError("Los valores de stock y costo deben ser numéricos.");
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
                cost: parsedCost,
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
      cost: parsedCost,
    };

    setState((prev) => ({
      ...prev,
      products: [newProduct, ...prev.products],
    }));

    setError("");
    setSuccess("Producto agregado correctamente.");
    resetProductForm();
  }

  function editProduct(product: Product) {
    setEditingProductId(product.id);
    setProductCode(product.code);
    setProductName(product.name);
    setProductCategory(product.category);
    setProductStock(String(product.stock));
    setProductMinStock(String(product.minStock));
    setProductCost(String(product.cost ?? 0));
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

    setSaleLines((lines) => {
      const remainingProducts = state.products.filter((item) => item.id !== productId);
      const fallbackProductId = remainingProducts[0]?.id ?? "";

      return lines.map((line) =>
        line.productId === productId
          ? { ...line, productId: fallbackProductId }
          : line,
      );
    });

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

    if (editingCustomerId) {
      setState((prev) => ({
        ...prev,
        customers: prev.customers.map((customerItem) =>
          customerItem.id === editingCustomerId
            ? {
                ...customerItem,
                name,
                phone: customer.phone.trim(),
                notes: customer.notes.trim(),
              }
            : customerItem,
        ),
      }));

      setError("");
      setSuccess("Cliente actualizado.");
      resetCustomerForm();
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

    setSelectedCustomerId(newCustomer.id);
    resetCustomerForm();
    setError("");
    setSuccess("Cliente guardado.");
  }

  function editCustomer(customerItem: Customer) {
    setEditingCustomerId(customerItem.id);
    setCustomer({
      name: customerItem.name,
      phone: customerItem.phone,
      notes: customerItem.notes,
    });
    setError("");
    setSuccess("Editando cliente seleccionado.");
    setActiveTab("customers");
  }

  function deleteCustomer(customerId: string) {
    const customerItem = state.customers.find((item) => item.id === customerId);
    if (!customerItem) {
      return;
    }

    const confirmed = typeof window !== "undefined"
      ? window.confirm(`¿Eliminar el cliente ${customerItem.name}?`)
      : true;

    if (!confirmed) {
      return;
    }

    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((item) => item.id !== customerId),
      sales: prev.sales.map((sale) =>
        sale.customerId === customerId
          ? { ...sale, customerId: undefined, customerName: "Sin cliente" }
          : sale,
      ),
    }));

    if (editingCustomerId === customerId) {
      resetCustomerForm();
    }

    if (selectedCustomerId === customerId) {
      setSelectedCustomerId("");
    }

    setError("");
    setSuccess("Cliente eliminado correctamente.");
  }

  function deleteSale(saleId: string) {
    const sale = state.sales.find((item) => item.id === saleId);
    if (!sale) {
      return;
    }

    const confirmed = typeof window !== "undefined"
      ? window.confirm(`¿Eliminar la venta de ${sale.productName}?`)
      : true;

    if (!confirmed) {
      return;
    }

    setState((prev) => ({
      ...prev,
      sales: prev.sales.filter((item) => item.id !== saleId),
      products: prev.products.map((product) =>
        product.id === sale.productId
          ? { ...product, stock: product.stock + sale.quantity }
          : product,
      ),
    }));

    setError("");
    setSuccess("Venta eliminada correctamente.");
  }

  function addSaleLine() {
    const defaultProduct = state.products[0];
    setSaleLines((lines) => [
      ...lines,
      createEmptySaleLine(defaultProduct?.id ?? "", getProductSalePrice(defaultProduct)),
    ]);
  }

  function removeSaleLine(lineId: string) {
    setSaleLines((lines) => {
      if (lines.length === 1) {
        return lines;
      }

      return lines.filter((line) => line.id !== lineId);
    });
  }

  function updateSaleLine(lineId: string, patch: Partial<SaleLineDraft>) {
    setSaleLines((lines) =>
      lines.map((line) => {
        if (line.id !== lineId) return line;

        const updated = { ...line, ...patch };

        if (patch.search !== undefined) {
          const query = patch.search.trim().toLowerCase();
          const matches = state.products.filter((product) => matchesProductQuery(product, query));

          if (!matches.some((product) => product.id === updated.productId)) {
            const firstMatch = matches[0];
            updated.productId = firstMatch?.id ?? "";
            if (firstMatch) {
              updated.salePrice = getProductSalePrice(firstMatch);
            }
          }
        }

        if (patch.productId && patch.productId !== line.productId) {
          const newProduct = state.products.find((p) => p.id === patch.productId);
          if (newProduct && (line.salePrice === "0" || !line.salePrice)) {
            updated.salePrice = getProductSalePrice(newProduct);
          }
        }

        return updated;
      }),
    );
  }

  function handleSale(event: FormEvent) {
    event.preventDefault();

    if (!state.products.length) {
      setError("No hay productos cargados para vender.");
      return;
    }

    const customerSelected = state.customers.find((item) => item.id === selectedCustomerId);
    const validatedLines: Array<{ product: Product; quantity: number; price: number }> = [];

    for (const line of saleLines) {
      const product = state.products.find((item) => item.id === line.productId);

      if (!product) {
        setError("Seleccioná un producto válido en cada artículo.");
        return;
      }

      const quantity = Number(line.quantity || 0);
      const price = Number(line.salePrice || 0);

      if (quantity <= 0 || price < 0) {
        setError("La cantidad y el precio de venta deben ser válidos en todos los artículos.");
        return;
      }

      validatedLines.push({ product, quantity, price });
    }

    const stockNeeded = validatedLines.reduce<Record<string, number>>((acc, line) => {
      acc[line.product.id] = (acc[line.product.id] ?? 0) + line.quantity;
      return acc;
    }, {});

    for (const [productId, needed] of Object.entries(stockNeeded)) {
      const product = state.products.find((item) => item.id === productId);

      if (product && product.stock < needed) {
        setError(`No hay suficiente stock de ${product.name} (necesitás ${needed}, hay ${product.stock}).`);
        return;
      }
    }

    const saleDate = new Date().toISOString();
    const newSales: Sale[] = validatedLines.map((line) => ({
      id: crypto.randomUUID(),
      date: saleDate,
      productId: line.product.id,
      productName: line.product.name,
      quantity: line.quantity,
      salePrice: line.price,
      costTotal: Number(line.product.cost ?? 0) * line.quantity,
      customerId: customerSelected?.id,
      customerName: customerSelected?.name,
      total: line.quantity * line.price,
    }));

    setState((prev) => ({
      ...prev,
      sales: [...newSales, ...prev.sales],
      products: prev.products.map((product) => {
        const used = stockNeeded[product.id];
        return used ? { ...product, stock: product.stock - used } : product;
      }),
    }));

    const defaultProduct = state.products[0];
    setSaleLines([createEmptySaleLine(defaultProduct?.id ?? "", getProductSalePrice(defaultProduct))]);
    setSuccess(
      newSales.length === 1
        ? "Venta registrada con éxito."
        : `Venta registrada con ${newSales.length} artículos.`,
    );
    setError("");
  }

  async function handleExcelImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });

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

  function persistAuthSession(email: string, name: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "darma-auth-session",
        JSON.stringify({ loggedIn: true, email, name }),
      );
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Ingresá email y contraseña para continuar.");
      return;
    }

    setAuthSubmitting(true);

    try {
      const result = await loginUser(loginEmail, loginPassword);

      if (result.user) {
        setIsAuthenticated(true);
        setError("");
        setSuccess("Sesión iniciada correctamente.");
        persistAuthSession(result.user.email, result.user.name);
        return;
      }

      setError(result.error ?? "Credenciales inválidas. Revisá el email y la contraseña.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setError("");
    setSuccess("Sesión cerrada correctamente.");
    if (typeof window !== "undefined") {
      localStorage.removeItem("darma-auth-session");
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="login-shell">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-mark" aria-hidden="true">
              <span className="mark-slice slice-one" />
              <span className="mark-slice slice-two" />
            </div>
            <div>
              <p className="eyebrow">Darma</p>
              <h1>Gestión de ventas</h1>
            </div>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <label>
              Email
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@darma.com"
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error ? <div className="alert error">{error}</div> : null}
            {success ? <div className="alert success">{success}</div> : null}

            <button type="submit" className="primary-btn login-btn" disabled={authSubmitting}>
              {authSubmitting ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="login-credentials">
            Demo: <strong>admin@darma.com</strong> / <strong>darma123</strong>
          </p>
        </div>
      </main>
    );
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
          <button type="button" className="secondary-btn logout-btn" onClick={handleLogout}>
            Cerrar sesión
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
          { key: "dashboard", label: "Dashboard" },
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

      <section className={activeTab === "dashboard" ? "panel visible" : "panel hidden"}>
        <div className="metrics-row dashboard-metrics">
          <div className="metric metric-green">
            <span>Ventas realizadas</span>
            <strong>{state.sales.length}</strong>
            <small>total de comprobantes</small>
          </div>
          <div className="metric metric-blue">
            <span>Dinero generado</span>
            <strong>$ {salesRevenue.toLocaleString("es-AR")}</strong>
            <small>ingresos por ventas</small>
          </div>
          <div className="metric metric-gold">
            <span>Ganancia bruta</span>
            <strong>$ {grossProfit.toLocaleString("es-AR")}</strong>
            <small>ventas menos costo</small>
          </div>
          <div className="metric metric-danger">
            <span>Producto más vendido</span>
            <strong>{bestSeller.quantity}</strong>
            <small>{bestSeller.productName}</small>
          </div>
        </div>

        <div className="card dashboard-panel">
          <h2>Resumen operativo</h2>
          <div className="dashboard-grid">
            <div>
              <p className="muted-label">Ventas totales</p>
              <h3>$ {salesRevenue.toLocaleString("es-AR")}</h3>
            </div>
            <div>
              <p className="muted-label">Costo total</p>
              <h3>$ {totalCost.toLocaleString("es-AR")}</h3>
            </div>
            <div>
              <p className="muted-label">Productos con stock bajo</p>
              <h3>{lowStockProducts.length}</h3>
            </div>
          </div>
        </div>
      </section>

      <section className={activeTab === "products" ? "panel visible" : "panel hidden"}>
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

            <div className="row four-cols">
              <label>
                Stock
                <input type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} />
              </label>
              <label>
                Stock mínimo
                <input type="number" value={productMinStock} onChange={(e) => setProductMinStock(e.target.value)} />
              </label>
              <label>
                Costo
                <input type="number" min="0" value={productCost} onChange={(e) => setProductCost(e.target.value)} />
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

        <div className="card product-table-card">
          <div className="table-toolbar">
            <h2>Inventario</h2>
            <span>{filteredProducts.length} productos</span>
          </div>

          <div className="product-filter-bar">
            <label className="search-field">
              Buscar producto
              <input
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductPage(1);
                }}
                placeholder="Nombre, código o categoría"
              />
            </label>

            <label className="search-field">
              Categoría
              <select
                value={productCategoryFilter}
                onChange={(e) => {
                  setProductCategoryFilter(e.target.value);
                  setProductPage(1);
                }}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
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
                {paginatedProducts.length ? (
                  paginatedProducts.map((product) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-results">
                      No se encontraron productos con ese filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredProducts.length > PAGE_SIZE ? (
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
            <h2>{editingCustomerId ? "Editar cliente" : "Crear cliente"}</h2>
            <span>{state.customers.length} registrados</span>
          </div>

          <form onSubmit={addCustomer} className="stack customer-form-box">
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
            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {editingCustomerId ? "Guardar cambios" : "Guardar cliente"}
              </button>
              {editingCustomerId ? (
                <button type="button" className="secondary-btn" onClick={resetCustomerForm}>
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </div>

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
                    <div className="customer-item">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerId(customerItem.id)}
                        className={selectedCustomerId === customerItem.id ? "selected customer-select" : "customer-select"}
                      >
                        <div className="customer-avatar">{customerItem.name.charAt(0).toUpperCase()}</div>
                        <div className="customer-info">
                          <strong>{customerItem.name}</strong>
                          <span>{customerItem.phone || "Sin teléfono"}</span>
                        </div>
                      </button>

                      <div className="action-group compact-actions">
                        <button type="button" className="row-btn edit-btn" onClick={() => editCustomer(customerItem)}>
                          Editar
                        </button>
                        <button type="button" className="row-btn delete-btn" onClick={() => deleteCustomer(customerItem.id)}>
                          Eliminar
                        </button>
                      </div>
                    </div>
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
            <div className="sale-lines">
              {saleLines.map((line, index) => {
                const query = (line.search ?? "").trim().toLowerCase();
                const filteredSaleProducts = state.products.filter((product) =>
                  matchesProductQuery(product, query),
                );
                const lineProduct = state.products.find((product) => product.id === line.productId);

                return (
                  <div key={line.id} className="sale-line-row">
                    <div className="sale-product-selector">
                      <label>
                        Buscar producto
                        <input
                          value={line.search}
                          onChange={(e) => updateSaleLine(line.id, { search: e.target.value })}
                          placeholder="Nombre, código o categoría"
                        />
                      </label>

                      <label>
                        Artículo {index + 1}
                        <select
                          value={line.productId}
                          onChange={(e) => updateSaleLine(line.id, { productId: e.target.value })}
                        >
                          {filteredSaleProducts.length ? (
                            filteredSaleProducts.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.code} — {product.name}
                              </option>
                            ))
                          ) : (
                            <option value="">No hay coincidencias</option>
                          )}
                        </select>
                        {lineProduct ? (
                          <span className="sale-line-stock">Stock disponible: {lineProduct.stock}</span>
                        ) : (
                          <span className="sale-line-stock">Escribí para filtrar el listado.</span>
                        )}
                      </label>
                    </div>
                    <label>
                      Cantidad
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateSaleLine(line.id, { quantity: e.target.value })}
                      />
                    </label>
                    <label>
                      Precio de venta
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={line.salePrice}
                        onChange={(e) => updateSaleLine(line.id, { salePrice: e.target.value })}
                      />
                    </label>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => removeSaleLine(line.id)}
                      disabled={saleLines.length === 1}
                      aria-label={`Quitar artículo ${index + 1}`}
                    >
                      Quitar
                    </button>
                  </div>
                );
              })}
            </div>

            <button type="button" className="secondary-btn add-sale-line-btn" onClick={addSaleLine}>
              + Agregar artículo
            </button>

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
                <small>{saleLines.length} artículo{saleLines.length === 1 ? "" : "s"} en la venta</small>
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
                  <th>Acciones</th>
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
                    <td>
                      <button type="button" className="row-btn delete-btn" onClick={() => deleteSale(sale.id)}>
                        Eliminar
                      </button>
                    </td>
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
