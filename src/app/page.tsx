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

type TabKey = "dashboard" | "products" | "customers" | "sales";

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
  const [saleProductId, setSaleProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [salePrice, setSalePrice] = useState("0");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
    setProductPage((current) => Math.min(current, totalPages));
  }, [filteredProducts.length]);

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
    const costTotal = Number(selectedProduct.cost ?? 0) * quantity;

    const sale: Sale = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      salePrice: price,
      costTotal,
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

  function handleLogin(event: FormEvent) {
    event.preventDefault();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Ingresá email y contraseña para continuar.");
      return;
    }

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

    if (email === "admin@darma.com" && password === "darma123") {
      setIsAuthenticated(true);
      setError("");
      setSuccess("Sesión iniciada correctamente.");
      return;
    }

    setError("Credenciales inválidas. Usá admin@darma.com / darma123");
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

            <button type="submit" className="primary-btn login-btn">
              Ingresar
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

          <div className="card">
            <h2>{editingCustomerId ? "Editar cliente" : "Clientes"}</h2>
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
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Nombre, código o categoría"
              />
            </label>

            <label className="search-field">
              Categoría
              <select value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)}>
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
