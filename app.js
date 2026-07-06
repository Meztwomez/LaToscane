const STORAGE_KEY = "restaurant-caisse-local-v1";
const DB_NAME = "restaurant-caisse-local-db";
const DB_VERSION = 1;
const DB_STORE = "state";
const DB_STATE_KEY = "current";

const seed = {
  restaurantName: "Le Comptoir",
  currentTableId: "t1",
  selectedCategory: "Tous",
  selectedZone: "Toutes",
  activeView: "menu",
  productSearch: "",
  paymentMethod: "Carte",
  tables: [
    { id: "t1", name: "Table 1", seats: 2, zone: "Salle" },
    { id: "t2", name: "Table 2", seats: 4, zone: "Salle" },
    { id: "t3", name: "Table 3", seats: 4, zone: "Salle" },
    { id: "t4", name: "Terrasse 1", seats: 2, zone: "Terrasse" },
    { id: "t5", name: "Terrasse 2", seats: 4, zone: "Terrasse" },
    { id: "t6", name: "Comptoir", seats: 1, zone: "Comptoir" }
  ],
  products: [
    { id: "p1", name: "Espresso", category: "Boissons", price: 2.2, taxRate: 0.1 },
    { id: "p2", name: "Cafe creme", category: "Boissons", price: 3.8, taxRate: 0.1 },
    { id: "p3", name: "Limonade maison", category: "Boissons", price: 4.5, taxRate: 0.1 },
    { id: "p4", name: "Verre de vin", category: "Boissons", price: 6.0, taxRate: 0.2 },
    { id: "p5", name: "Planche mixte", category: "Entrees", price: 14.0, taxRate: 0.1 },
    { id: "p6", name: "Soupe du moment", category: "Entrees", price: 8.5, taxRate: 0.1 },
    { id: "p7", name: "Burger maison", category: "Plats", price: 17.5, taxRate: 0.1 },
    { id: "p8", name: "Risotto champignons", category: "Plats", price: 18.0, taxRate: 0.1 },
    { id: "p9", name: "Poisson du jour", category: "Plats", price: 22.0, taxRate: 0.1 },
    { id: "p10", name: "Fondant chocolat", category: "Desserts", price: 7.5, taxRate: 0.1 },
    { id: "p11", name: "Tarte citron", category: "Desserts", price: 7.0, taxRate: 0.1 }
  ],
  orders: {},
  sales: [],
  canceledOrders: [],
  cashSession: {
    openingFloat: 0,
    cashCounted: 0,
    closedAt: null
  },
  cashClosures: []
};

let state = loadState();
let dbHandle = null;
let dbReady = false;
let saveTimer = null;
let editingLineProductId = null;

const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR"
});

const el = {
  brandName: document.querySelector("#brandName"),
  tablesList: document.querySelector("#tablesList"),
  zoneTabs: document.querySelector("#zoneTabs"),
  productsGrid: document.querySelector("#productsGrid"),
  categoryTabs: document.querySelector("#categoryTabs"),
  productSearch: document.querySelector("#productSearch"),
  currentTableTitle: document.querySelector("#currentTableTitle"),
  ticketTitle: document.querySelector("#ticketTitle"),
  orderLines: document.querySelector("#orderLines"),
  subtotal: document.querySelector("#subtotal"),
  discountTotal: document.querySelector("#discountTotal"),
  tax: document.querySelector("#tax"),
  total: document.querySelector("#total"),
  viewTabs: document.querySelector("#viewTabs"),
  menuPanel: document.querySelector("#menuPanel"),
  kitchenPanel: document.querySelector("#kitchenPanel"),
  salesPanel: document.querySelector("#salesPanel"),
  kitchenList: document.querySelector("#kitchenList"),
  dayReport: document.querySelector("#dayReport"),
  salesList: document.querySelector("#salesList"),
  cancellationsList: document.querySelector("#cancellationsList"),
  openingFloatInput: document.querySelector("#openingFloatInput"),
  cashCountedInput: document.querySelector("#cashCountedInput"),
  closeCashButton: document.querySelector("#closeCashButton"),
  newServiceButton: document.querySelector("#newServiceButton"),
  openTablesCount: document.querySelector("#openTablesCount"),
  dayTotal: document.querySelector("#dayTotal"),
  serviceLabel: document.querySelector("#serviceLabel"),
  discountInput: document.querySelector("#discountInput"),
  transferSelect: document.querySelector("#transferSelect"),
  transferButton: document.querySelector("#transferButton"),
  mergeTableButton: document.querySelector("#mergeTableButton"),
  clearOrderButton: document.querySelector("#clearOrderButton"),
  holdButton: document.querySelector("#holdButton"),
  previewReceiptButton: document.querySelector("#previewReceiptButton"),
  payButton: document.querySelector("#payButton"),
  paymentButtons: document.querySelectorAll("[data-payment]"),
  paymentAmountInput: document.querySelector("#paymentAmountInput"),
  fillRemainingButton: document.querySelector("#fillRemainingButton"),
  addPaymentButton: document.querySelector("#addPaymentButton"),
  paymentList: document.querySelector("#paymentList"),
  paymentSummary: document.querySelector("#paymentSummary"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  addTableButton: document.querySelector("#addTableButton"),
  editTableButton: document.querySelector("#editTableButton"),
  tableDialog: document.querySelector("#tableDialog"),
  tableNameInput: document.querySelector("#tableNameInput"),
  tableSeatsInput: document.querySelector("#tableSeatsInput"),
  tableZoneInput: document.querySelector("#tableZoneInput"),
  zoneList: document.querySelector("#zoneList"),
  saveTableButton: document.querySelector("#saveTableButton"),
  lineDialog: document.querySelector("#lineDialog"),
  lineDialogTitle: document.querySelector("#lineDialogTitle"),
  linePriceInput: document.querySelector("#linePriceInput"),
  lineDiscountInput: document.querySelector("#lineDiscountInput"),
  lineNoteInput: document.querySelector("#lineNoteInput"),
  saveLineButton: document.querySelector("#saveLineButton"),
  deleteLineButton: document.querySelector("#deleteLineButton"),
  restaurantNameInput: document.querySelector("#restaurantNameInput"),
  saveRestaurantButton: document.querySelector("#saveRestaurantButton"),
  saveProductButton: document.querySelector("#saveProductButton"),
  productName: document.querySelector("#productName"),
  productPrice: document.querySelector("#productPrice"),
  productCategory: document.querySelector("#productCategory"),
  productTaxRate: document.querySelector("#productTaxRate"),
  categoryList: document.querySelector("#categoryList"),
  settingsCategories: document.querySelector("#settingsCategories"),
  settingsProducts: document.querySelector("#settingsProducts"),
  exportButton: document.querySelector("#exportButton"),
  exportCsvButton: document.querySelector("#exportCsvButton"),
  importInput: document.querySelector("#importInput"),
  reportButton: document.querySelector("#reportButton"),
  reportDialog: document.querySelector("#reportDialog"),
  reportContent: document.querySelector("#reportContent"),
  receiptDialog: document.querySelector("#receiptDialog"),
  receiptPreview: document.querySelector("#receiptPreview"),
  printReceiptButton: document.querySelector("#printReceiptButton")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState(saved ? { ...seed, ...saved } : structuredClone(seed));
  } catch {
    return normalizeState(structuredClone(seed));
  }
}

function normalizeState(nextState) {
  nextState.tables = (nextState.tables || seed.tables).map((table) => ({
    seats: 2,
    zone: inferTableZone(table),
    ...table,
    zone: table.zone || inferTableZone(table)
  }));
  nextState.selectedZone = nextState.selectedZone || seed.selectedZone;
  nextState.products = nextState.products.map((product) => ({
    favorite: false,
    available: true,
    taxRate: 0.1,
    ...product
  }));
  nextState.restaurantName = nextState.restaurantName || seed.restaurantName;
  nextState.productSearch = nextState.productSearch || "";
  nextState.orders = nextState.orders || {};
  nextState.sales = (nextState.sales || []).map((sale) => ({ voided: false, ...sale }));
  nextState.canceledOrders = nextState.canceledOrders || [];
  nextState.cashSession = {
    openingFloat: 0,
    cashCounted: 0,
    closedAt: null,
    ...(nextState.cashSession || {})
  };
  nextState.cashClosures = nextState.cashClosures || [];
  return nextState;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  queueDbSave();
}

function openDatabase() {
  if (!("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

function readDbState() {
  if (!dbHandle) return Promise.resolve(null);
  return new Promise((resolve) => {
    const transaction = dbHandle.transaction(DB_STORE, "readonly");
    const request = transaction.objectStore(DB_STORE).get(DB_STATE_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

function writeDbState() {
  if (!dbHandle) return;
  const snapshot = structuredClone(state);
  const transaction = dbHandle.transaction(DB_STORE, "readwrite");
  transaction.objectStore(DB_STORE).put(snapshot, DB_STATE_KEY);
}

function queueDbSave() {
  if (!dbReady || !dbHandle) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeDbState, 120);
}

async function hydrateFromIndexedDb() {
  dbHandle = await openDatabase();
  dbReady = Boolean(dbHandle);
  if (!dbHandle) return;
  const dbState = await readDbState();
  if (dbState) {
    state = normalizeState({ ...seed, ...dbState });
    render();
    return;
  }
  writeDbState();
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function uid(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function getCurrentTable() {
  return state.tables.find((table) => table.id === state.currentTableId) || null;
}

function getOrder(tableId = state.currentTableId) {
  if (!tableId) return null;
  if (!state.orders[tableId]) {
    state.orders[tableId] = { lines: [], status: "open", openedAt: new Date().toISOString(), discountPercent: 0, payments: [] };
  }
  if (typeof state.orders[tableId].discountPercent !== "number") state.orders[tableId].discountPercent = 0;
  if (!Array.isArray(state.orders[tableId].payments)) state.orders[tableId].payments = [];
  normalizeOrderLines(state.orders[tableId]);
  return state.orders[tableId];
}

function orderTotals(order) {
  const lines = order?.lines || [];
  const subtotal = lines.reduce((sum, line) => sum + lineGross(line), 0);
  const lineDiscount = lines.reduce((sum, line) => sum + lineDiscountAmount(line), 0);
  const discountedSubtotal = Math.max(0, subtotal - lineDiscount);
  const discountPercent = Math.min(100, Math.max(0, Number(order?.discountPercent || 0)));
  const ticketDiscount = discountedSubtotal * (discountPercent / 100);
  const discount = lineDiscount + ticketDiscount;
  const taxFactor = discountedSubtotal > 0 ? (discountedSubtotal - ticketDiscount) / discountedSubtotal : 1;
  const tax = lines.reduce((sum, line) => {
    const taxIncluded = line.price - line.price / (1 + line.taxRate);
    const lineFactor = 1 - lineDiscountPercent(line) / 100;
    return sum + taxIncluded * line.qty * lineFactor * taxFactor;
  }, 0);
  return { subtotal, discount, tax, total: Math.max(0, subtotal - discount) };
}

function normalizeOrderLines(order) {
  order.lines = (order.lines || []).map((line) => ({
    originalPrice: line.price,
    lineDiscountPercent: 0,
    ...line
  }));
}

function lineGross(line) {
  return line.price * line.qty;
}

function lineDiscountPercent(line) {
  return Math.min(100, Math.max(0, Number(line.lineDiscountPercent || 0)));
}

function lineDiscountAmount(line) {
  return lineGross(line) * (lineDiscountPercent(line) / 100);
}

function lineNetTotal(line) {
  return Math.max(0, lineGross(line) - lineDiscountAmount(line));
}

function lineReceiptLabel(line) {
  const discount = lineDiscountPercent(line);
  return `${line.qty} x ${escapeHtml(line.name)}${discount ? ` (-${discount}%)` : ""}`;
}

function paymentTotals(order, total) {
  const payments = order?.payments || [];
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return {
    paid,
    remaining: Math.max(0, total - paid),
    change: Math.max(0, paid - total)
  };
}

function appliedPayments(payments, total) {
  const result = structuredClone(payments || []);
  let over = Math.max(0, result.reduce((sum, payment) => sum + payment.amount, 0) - total);
  for (let index = result.length - 1; index >= 0 && over > 0; index -= 1) {
    const payment = result[index];
    const reduction = Math.min(payment.amount, over);
    payment.amount -= reduction;
    over -= reduction;
  }
  return result.filter((payment) => payment.amount > 0.009);
}

function paymentLabel(payments, fallback = state.paymentMethod) {
  if (!payments?.length) return fallback;
  const methods = Array.from(new Set(payments.map((payment) => payment.method)));
  return methods.length === 1 ? methods[0] : "Mixte";
}

function categories() {
  return ["Tous", "Favoris", ...actualCategories()];
}

function actualCategories() {
  return Array.from(new Set(state.products.map((product) => product.category))).sort();
}

function inferTableZone(table) {
  const name = (table?.name || "").toLowerCase();
  if (name.includes("terrasse")) return "Terrasse";
  if (name.includes("comptoir") || name.includes("bar")) return "Comptoir";
  return "Salle";
}

function zones() {
  return ["Toutes", ...Array.from(new Set(state.tables.map((table) => table.zone || inferTableZone(table)))).sort()];
}

function zoneIcon(zone) {
  const icons = {
    Toutes: "🧭",
    Salle: "🍽️",
    Terrasse: "☀️",
    Comptoir: "🍸"
  };
  return icons[zone] || "📍";
}

function paymentIcon(method) {
  const icons = {
    Carte: "💳",
    Especes: "💵",
    "Ticket resto": "🎟️"
  };
  return icons[method] || "💶";
}

function categoryIcon(category) {
  const icons = {
    Tous: "🍽️",
    Favoris: "⭐",
    Boissons: "🥤",
    Entrees: "🥗",
    Plats: "🍽️",
    Desserts: "🍰"
  };
  return icons[category] || "🏷️";
}

function productIcon(product) {
  const name = product.name.toLowerCase();
  if (name.includes("espresso") || name.includes("cafe")) return "☕";
  if (name.includes("vin")) return "🍷";
  if (name.includes("limonade")) return "🥤";
  if (name.includes("burger")) return "🍔";
  if (name.includes("poisson")) return "🐟";
  if (name.includes("risotto")) return "🍚";
  if (name.includes("soupe")) return "🍲";
  if (name.includes("planche")) return "🧀";
  if (name.includes("chocolat")) return "🍫";
  if (name.includes("tarte")) return "🥧";
  return categoryIcon(product.category);
}

function statusIcon(status) {
  const icons = {
    free: "⚪",
    open: "🟠",
    sent: "👨‍🍳",
    ready: "✅"
  };
  return icons[status] || "🟠";
}

function render() {
  renderBrand();
  renderServiceLabel();
  renderZones();
  renderTables();
  renderCategories();
  renderProducts();
  renderTicket();
  renderView();
  renderKitchen();
  renderSales();
  renderTransferOptions();
  renderSettings();
  saveState();
}

function renderZones() {
  const available = zones();
  if (!available.includes(state.selectedZone)) state.selectedZone = "Toutes";
  el.zoneTabs.replaceChildren(
    ...available.map((zone) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = zone === state.selectedZone ? "selected" : "";
      button.dataset.zone = zone;
      button.innerHTML = `<span>${zoneIcon(zone)}</span><span>${escapeHtml(zone)}</span>`;
      return button;
    })
  );
  el.zoneList.replaceChildren(...available.filter((zone) => zone !== "Toutes").map((zone) => new Option(zone)));
}

function renderBrand() {
  el.brandName.textContent = state.restaurantName;
  document.title = `${state.restaurantName} · Caisse locale`;
}

function renderServiceLabel() {
  el.serviceLabel.textContent = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
}

function renderTables() {
  const openTables = state.tables.filter((table) => state.orders[table.id]?.lines.length).length;
  const dayTotal = state.sales
    .filter((sale) => sale.createdAt.slice(0, 10) === todayKey())
    .reduce((sum, sale) => sum + sale.total, 0);

  el.openTablesCount.textContent = openTables;
  el.dayTotal.textContent = money.format(dayTotal);

  const visibleTables = state.selectedZone === "Toutes"
    ? state.tables
    : state.tables.filter((table) => table.zone === state.selectedZone);

  el.tablesList.replaceChildren(
    ...visibleTables.map((table) => {
      const order = state.orders[table.id];
      const totals = orderTotals(order);
      const status = order?.lines.length ? order.status || "open" : "free";
      const statusLabel = {
        free: "Libre",
        open: "Ouverte",
        sent: "Cuisine",
        ready: "Prete"
      }[status] || "Ouverte";
      const button = document.createElement("button");
      button.className = `table-card status-${status}${table.id === state.currentTableId ? " selected" : ""}`;
      button.type = "button";
      button.dataset.tableId = table.id;
      button.innerHTML = `
        <span class="table-main">
          <span class="title-with-icon"><span class="emoji-badge">${statusIcon(status)}</span><strong>${escapeHtml(table.name)}</strong></span>
          <small>${table.seats} couverts · ${escapeHtml(table.zone || inferTableZone(table))}</small>
        </span>
        <span class="table-meta">
          <em>${statusLabel}</em>
          <strong>${order?.lines.length ? money.format(totals.total) : "0,00 €"}</strong>
        </span>
      `;
      return button;
    })
  );
}

function renderCategories() {
  const available = categories();
  if (!available.includes(state.selectedCategory)) state.selectedCategory = "Tous";
  el.categoryTabs.replaceChildren(
    ...available.map((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<span class="tab-label"><span>${categoryIcon(category)}</span><span>${escapeHtml(category)}</span></span>`;
      button.className = category === state.selectedCategory ? "selected" : "";
      button.dataset.category = category;
      return button;
    })
  );
}

function renderProducts() {
  const search = state.productSearch.trim().toLowerCase();
  el.productSearch.value = state.productSearch;
  const products = state.products.filter((product) => {
    const inCategory = state.selectedCategory === "Tous"
      || (state.selectedCategory === "Favoris" && product.favorite)
      || product.category === state.selectedCategory;
    const inSearch = !search || `${product.name} ${product.category}`.toLowerCase().includes(search);
    return inCategory && inSearch;
  });

  if (products.length === 0) {
    el.productsGrid.innerHTML = `<div class="empty-state">Aucun produit ne correspond.</div>`;
    return;
  }

  el.productsGrid.replaceChildren(
    ...products.map((product) => {
      const button = document.createElement("button");
      button.className = `product-card${product.available ? "" : " unavailable"}`;
      button.type = "button";
      button.dataset.productId = product.id;
      button.disabled = !product.available;
      button.innerHTML = `
        <span>
          <span class="product-icon">${productIcon(product)}</span>
          <strong>${product.favorite ? "⭐ " : ""}${escapeHtml(product.name)}</strong>
          <small>${escapeHtml(product.category)}${product.available ? "" : " · indisponible"}</small>
        </span>
        <span class="product-price">${money.format(product.price)}</span>
      `;
      return button;
    })
  );
}

function renderTicket() {
  const table = getCurrentTable();
  const order = table ? getOrder(table.id) : null;
  const totals = orderTotals(order);

  el.currentTableTitle.textContent = table ? table.name : "Choisir une table";
  el.ticketTitle.textContent = table ? table.name : "Aucune table";
  el.subtotal.textContent = money.format(totals.subtotal);
  el.discountTotal.textContent = `-${money.format(totals.discount)}`;
  el.tax.textContent = money.format(totals.tax);
  el.total.textContent = money.format(totals.total);
  el.discountInput.value = order?.discountPercent || 0;
  renderPaymentSplit(order, totals);

  el.paymentButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.payment === state.paymentMethod);
  });

  if (!order || order.lines.length === 0) {
    el.orderLines.innerHTML = `<div class="empty-state">Ajoute des articles depuis le menu.</div>`;
    return;
  }

  el.orderLines.replaceChildren(
    ...order.lines.map((line) => {
      const row = document.createElement("article");
      row.className = "order-line";
      const discountLabel = lineDiscountPercent(line) ? ` · remise ${lineDiscountPercent(line)}%` : "";
      const priceLabel = line.originalPrice !== line.price ? ` · prix modifie` : "";
      row.innerHTML = `
        <div>
          <p class="line-title">${escapeHtml(line.name)}</p>
          <span class="line-note">${money.format(line.price)} · ${money.format(lineNetTotal(line))}${discountLabel}${priceLabel}${line.note ? ` · ${escapeHtml(line.note)}` : ""}</span>
        </div>
        <div class="line-controls">
          <button type="button" data-transfer-line="${line.productId}" aria-label="Transferer une unite">↔</button>
          <button type="button" data-price="${line.productId}" aria-label="Modifier le prix">€</button>
          <button type="button" data-line-discount="${line.productId}" aria-label="Remise ligne">%</button>
          <button type="button" data-note="${line.productId}" aria-label="Note">✎</button>
          <button type="button" data-delete-line="${line.productId}" aria-label="Supprimer la ligne">×</button>
          <button type="button" data-dec="${line.productId}" aria-label="Retirer">−</button>
          <span>${line.qty}</span>
          <button type="button" data-inc="${line.productId}" aria-label="Ajouter">+</button>
        </div>
      `;
      return row;
    })
  );
}

function renderPaymentSplit(order, totals) {
  const payments = order?.payments || [];
  const summary = paymentTotals(order, totals.total);
  const disabled = !order || order.lines.length === 0;
  el.paymentAmountInput.disabled = disabled;
  el.fillRemainingButton.disabled = disabled;
  el.addPaymentButton.disabled = disabled;

  if (payments.length === 0) {
    el.paymentList.innerHTML = `<div class="empty-payment">Aucun paiement ajoute.</div>`;
  } else {
    el.paymentList.replaceChildren(
      ...payments.map((payment) => {
        const row = document.createElement("div");
        row.className = "payment-line";
        row.innerHTML = `
          <span>${paymentIcon(payment.method)} ${escapeHtml(payment.method)}</span>
          <strong>${money.format(payment.amount)}</strong>
          <button type="button" data-delete-payment="${payment.id}" aria-label="Supprimer paiement">×</button>
        `;
        return row;
      })
    );
  }

  el.paymentSummary.innerHTML = `
    <div><span>Regle</span><strong>${money.format(summary.paid)}</strong></div>
    <div><span>Reste</span><strong>${money.format(summary.remaining)}</strong></div>
    <div><span>Rendu</span><strong>${money.format(summary.change)}</strong></div>
  `;
}

function getCurrentSaleDraft() {
  const table = getCurrentTable();
  const order = table ? getOrder(table.id) : null;
  if (!table || !order || order.lines.length === 0) return null;
  const totals = orderTotals(order);
  const summary = paymentTotals(order, totals.total);
  const payments = appliedPayments(order.payments || [], totals.total);
  return {
    id: "draft",
    tableName: table.name,
    paymentMethod: paymentLabel(payments, state.paymentMethod),
    payments,
    tenderedPayments: structuredClone(order.payments || []),
    changeDue: summary.change,
    createdAt: new Date().toISOString(),
    lines: structuredClone(order.lines),
    discountPercent: order.discountPercent || 0,
    discount: totals.discount,
    total: totals.total,
    tax: totals.tax
  };
}

function renderView() {
  const activeView = state.activeView || "menu";
  el.menuPanel.hidden = activeView !== "menu";
  el.kitchenPanel.hidden = activeView !== "kitchen";
  el.salesPanel.hidden = activeView !== "sales";
  el.viewTabs.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.view === activeView);
  });
}

function renderTransferOptions() {
  const currentId = state.currentTableId;
  const options = state.tables
    .filter((table) => table.id !== currentId)
    .map((table) => {
      const option = document.createElement("option");
      option.value = table.id;
      option.textContent = table.name;
      return option;
    });
  el.transferSelect.replaceChildren(...options);
}

function renderKitchen() {
  const cards = state.tables
    .map((table) => ({ table, order: state.orders[table.id] }))
    .filter(({ order }) => order?.lines.length);

  if (cards.length === 0) {
    el.kitchenList.innerHTML = `<div class="empty-state">Aucune commande en cours.</div>`;
    return;
  }

  el.kitchenList.replaceChildren(
    ...cards.map(({ table, order }) => {
      const card = document.createElement("article");
      card.className = "kitchen-card";
      card.innerHTML = `
        <header>
          <div>
            <h3>${escapeHtml(table.name)}</h3>
            <small>${order.status === "ready" ? "Pret a servir" : order.status === "sent" ? "En cuisine" : "Non envoye"}</small>
          </div>
          <strong>${money.format(orderTotals(order).total)}</strong>
        </header>
        <ul>
          ${order.lines.map((line) => `<li>${line.qty} x ${escapeHtml(line.name)}${line.note ? ` (${escapeHtml(line.note)})` : ""}</li>`).join("")}
        </ul>
        <div class="kitchen-actions">
          <button type="button" data-kitchen-select="${table.id}">Ouvrir</button>
          <button type="button" data-ready="${table.id}">Pret</button>
          <button type="button" data-serve="${table.id}">Servi</button>
        </div>
      `;
      return card;
    })
  );
}

function renderSales() {
  const sales = todaySales();
  const cancellations = todayCancellations();
  const report = buildReport(sales);

  el.dayReport.replaceChildren(
    reportTile("CA net", money.format(report.total)),
    reportTile("Tickets", String(report.ticketCount)),
    reportTile("Panier moyen", money.format(report.average)),
    reportTile("Especes attendues", money.format(report.expectedCash)),
    reportTile("Especes comptees", money.format(report.cashCounted)),
    reportTile("Ecart caisse", money.format(report.cashDifference)),
    reportTile("TVA", money.format(report.tax)),
    reportTile("Annulations", String(report.voidedCount + cancellations.length))
  );

  el.openingFloatInput.value = state.cashSession.openingFloat || "";
  el.cashCountedInput.value = state.cashSession.cashCounted || "";

  if (sales.length === 0) {
    el.salesList.innerHTML = `<div class="empty-state">Aucune vente encaissee aujourd'hui.</div>`;
  } else {
    el.salesList.replaceChildren(
      ...sales.slice().reverse().map((sale) => {
        const card = document.createElement("article");
        card.className = `sale-card${sale.voided ? " voided" : ""}`;
        card.innerHTML = `
          <header>
            <div>
              <h3>${escapeHtml(sale.tableName)}${sale.voided ? " · annule" : ""}</h3>
              <small>${new Date(sale.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · ${escapeHtml(sale.paymentMethod)}</small>
            </div>
            <strong>${money.format(sale.total)}</strong>
          </header>
          <ul>
            ${sale.lines.map((line) => `<li>${lineReceiptLabel(line)} · ${money.format(lineNetTotal(line))}</li>`).join("")}
          </ul>
          <p class="payment-detail">${salePayments(sale).map((payment) => `${escapeHtml(payment.method)} ${money.format(payment.amount)}`).join(" · ")}${sale.changeDue ? ` · Rendu ${money.format(sale.changeDue)}` : ""}</p>
          <div class="sale-actions">
            <button type="button" data-reprint-sale="${sale.id}">Reimprimer</button>
            ${sale.voided ? `<p class="audit-note">Annule : ${escapeHtml(sale.voidReason || "sans motif")}</p>` : `<button type="button" data-void-sale="${sale.id}">Annuler ticket</button>`}
          </div>
        `;
        return card;
      })
    );
  }

  if (cancellations.length === 0) {
    el.cancellationsList.innerHTML = "";
  } else {
    el.cancellationsList.replaceChildren(
      ...cancellations.slice().reverse().map((cancellation) => {
        const card = document.createElement("article");
        card.className = "sale-card voided";
        const total = cancellation.total || orderTotals(cancellation.order).total;
      card.innerHTML = `
        <header>
          <div>
              <h3>${escapeHtml(cancellation.tableName)} · abandon</h3>
              <small>${new Date(cancellation.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</small>
          </div>
            <strong>${money.format(total)}</strong>
        </header>
        <ul>
            ${cancellation.order.lines.map((line) => `<li>${lineReceiptLabel(line)} · ${money.format(lineNetTotal(line))}</li>`).join("")}
        </ul>
          <p class="audit-note">${escapeHtml(cancellation.reason)}</p>
      `;
      return card;
      })
    );
  }
}

function reportTile(label, value) {
  const tile = document.createElement("article");
  tile.className = "report-tile";
  tile.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
  return tile;
}

function renderSettings() {
  const cats = actualCategories();
  el.restaurantNameInput.value = state.restaurantName;
  el.categoryList.replaceChildren(...cats.map((category) => new Option(category)));
  el.settingsCategories.replaceChildren(
    ...cats.map((category) => {
      const pill = document.createElement("div");
      pill.className = "pill";
      pill.textContent = category;
      return pill;
    })
  );

  el.settingsProducts.replaceChildren(
    ...state.products.map((product) => {
      const row = document.createElement("div");
      row.className = "settings-product";
      row.innerHTML = `
        <span>${escapeHtml(product.name)} · ${money.format(product.price)}</span>
        <small>${escapeHtml(product.category)} · TVA ${Math.round(product.taxRate * 1000) / 10}%</small>
        <button type="button" data-toggle-favorite="${product.id}" aria-label="Favori">${product.favorite ? "★" : "☆"}</button>
        <button type="button" data-toggle-available="${product.id}">${product.available ? "Dispo" : "Pause"}</button>
        <button type="button" data-delete-product="${product.id}" aria-label="Supprimer">×</button>
      `;
      return row;
    })
  );
}

function addProductToOrder(productId) {
  const product = state.products.find((item) => item.id === productId);
  const order = getOrder();
  if (!product || !product.available || !order) return;
  const line = order.lines.find((item) => item.productId === product.id);

  if (line) {
    line.qty += 1;
  } else {
    order.lines.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.price,
      taxRate: product.taxRate,
      lineDiscountPercent: 0,
      qty: 1
    });
  }

  order.status = "open";
  render();
}

function changeQuantity(productId, delta) {
  const order = getOrder();
  if (!order) return;
  const line = order.lines.find((item) => item.productId === productId);
  if (!line) return;

  line.qty += delta;
  if (line.qty <= 0) {
    order.lines = order.lines.filter((item) => item.productId !== productId);
  }

  if (order.lines.length === 0) {
    delete state.orders[state.currentTableId];
  }
  render();
}

function deleteLine(productId) {
  const order = getOrder();
  if (!order) return;
  order.lines = order.lines.filter((item) => item.productId !== productId);
  if (order.lines.length === 0) {
    delete state.orders[state.currentTableId];
  }
  render();
}

function cancelOpenOrder(reason = "Ticket ouvert abandonne") {
  if (!state.currentTableId) return;
  const table = getCurrentTable();
  const order = state.orders[state.currentTableId];
  if (order?.lines.length) {
    state.canceledOrders.push({
      id: uid("c"),
      tableId: state.currentTableId,
      tableName: table?.name || "Table",
      reason,
      createdAt: new Date().toISOString(),
      total: orderTotals(order).total,
      order: structuredClone(order)
    });
  }
  delete state.orders[state.currentTableId];
  render();
}

function clearOrder() {
  const order = state.orders[state.currentTableId];
  if (order?.lines.length && !safeConfirm("Annuler ce ticket ouvert et l'ajouter au journal d'annulation ?")) return;
  cancelOpenOrder();
}

function holdOrder() {
  const order = getOrder();
  if (!order || order.lines.length === 0) return;
  order.status = "sent";
  order.sentAt = new Date().toISOString();
  render();
}

function setDiscount(value) {
  const order = getOrder();
  if (!order) return;
  order.discountPercent = Math.min(100, Math.max(0, Number(value) || 0));
  render();
}

function fillRemainingPayment() {
  const order = getOrder();
  const totals = orderTotals(order);
  const summary = paymentTotals(order, totals.total);
  el.paymentAmountInput.value = summary.remaining.toFixed(2);
  el.paymentAmountInput.focus();
}

function addPayment() {
  const order = getOrder();
  if (!order?.lines.length) return;
  const totals = orderTotals(order);
  const summary = paymentTotals(order, totals.total);
  const rawAmount = Number(el.paymentAmountInput.value);
  const requestedAmount = Math.max(0, rawAmount || summary.remaining);
  const cappedAmount = state.paymentMethod === "Especes" ? requestedAmount : Math.min(requestedAmount, summary.remaining);
  const amount = Math.round(cappedAmount * 100) / 100;
  if (!amount) return;

  order.payments.push({
    id: uid("pay"),
    method: state.paymentMethod,
    amount
  });
  el.paymentAmountInput.value = "";
  render();
}

function deletePayment(paymentId) {
  const order = getOrder();
  if (!order) return;
  order.payments = order.payments.filter((payment) => payment.id !== paymentId);
  render();
}

function transferOrder() {
  const fromId = state.currentTableId;
  const toId = el.transferSelect.value;
  const source = state.orders[fromId];
  if (!fromId || !toId || !source?.lines.length) return;

  const target = getOrder(toId);
  source.lines.forEach((line) => {
    mergeOrderLine(target, line);
  });
  (source.payments || []).forEach((payment) => target.payments.push(structuredClone(payment)));
  target.status = source.status || "open";
  target.discountPercent = Math.max(target.discountPercent || 0, source.discountPercent || 0);
  delete state.orders[fromId];
  state.currentTableId = toId;
  render();
}

function mergeTable() {
  const targetId = state.currentTableId;
  const sourceId = el.transferSelect.value;
  const source = state.orders[sourceId];
  if (!targetId || !sourceId || !source?.lines.length) return;

  const target = getOrder(targetId);
  source.lines.forEach((line) => mergeOrderLine(target, line));
  (source.payments || []).forEach((payment) => target.payments.push(structuredClone(payment)));
  target.status = source.status === "ready" ? "ready" : target.status || source.status || "open";
  target.discountPercent = Math.max(target.discountPercent || 0, source.discountPercent || 0);
  delete state.orders[sourceId];
  render();
}

function transferLine(productId) {
  const fromId = state.currentTableId;
  const toId = el.transferSelect.value;
  const source = state.orders[fromId];
  const line = source?.lines.find((item) => item.productId === productId);
  if (!fromId || !toId || !line) return;

  const target = getOrder(toId);
  mergeOrderLine(target, { ...line, qty: 1 });
  target.status = target.status || "open";
  line.qty -= 1;
  if (line.qty <= 0) {
    source.lines = source.lines.filter((item) => item.productId !== productId);
  }
  if (source.lines.length === 0) delete state.orders[fromId];
  render();
}

function mergeOrderLine(order, line) {
  const existing = order.lines.find((item) => item.productId === line.productId && item.note === line.note);
  if (existing) {
    existing.qty += line.qty;
  } else {
    order.lines.push(structuredClone(line));
  }
}

function setLineNote(productId) {
  const order = getOrder();
  const line = order?.lines.find((item) => item.productId === productId);
  if (!line) return;

  const note = safePrompt("Note cuisine", line.note || "");
  if (note === null) return;
  line.note = note.trim();
  render();
}

function openLineEditor(productId) {
  const order = getOrder();
  const line = order?.lines.find((item) => item.productId === productId);
  if (!line) return;
  editingLineProductId = productId;
  el.lineDialogTitle.textContent = line.name;
  el.linePriceInput.value = line.price.toFixed(2);
  el.lineDiscountInput.value = lineDiscountPercent(line);
  el.lineNoteInput.value = line.note || "";
  el.lineDialog.showModal();
}

function saveLineEdit() {
  const order = getOrder();
  const line = order?.lines.find((item) => item.productId === editingLineProductId);
  if (!line) return;

  const price = Math.round(Math.max(0, Number(el.linePriceInput.value) || 0) * 100) / 100;
  if (!price) return;
  line.price = price;
  line.lineDiscountPercent = Math.min(100, Math.max(0, Number(el.lineDiscountInput.value) || 0));
  line.note = el.lineNoteInput.value.trim();
  editingLineProductId = null;
  el.lineDialog.close();
  render();
}

function deleteEditingLine() {
  if (!editingLineProductId) return;
  const productId = editingLineProductId;
  editingLineProductId = null;
  el.lineDialog.close();
  deleteLine(productId);
}

function setLinePrice(productId) {
  const order = getOrder();
  const line = order?.lines.find((item) => item.productId === productId);
  if (!line) return;

  const value = safePrompt("Prix unitaire exceptionnel", String(line.price));
  if (value === null) return;
  const price = Math.round(Math.max(0, Number(value.replace(",", ".")) || 0) * 100) / 100;
  if (!price) return;
  line.price = price;
  render();
}

function setLineDiscount(productId) {
  const order = getOrder();
  const line = order?.lines.find((item) => item.productId === productId);
  if (!line) return;

  const value = safePrompt("Remise sur cette ligne (%)", String(lineDiscountPercent(line)));
  if (value === null) return;
  line.lineDiscountPercent = Math.min(100, Math.max(0, Number(value.replace(",", ".")) || 0));
  render();
}

function updateKitchenStatus(tableId, status) {
  const order = state.orders[tableId];
  if (!order?.lines.length) return;
  order.status = status;
  if (status === "ready") order.readyAt = new Date().toISOString();
  if (status === "open") order.servedAt = new Date().toISOString();
  render();
}

function selectTable(tableId, view = state.activeView) {
  state.currentTableId = tableId;
  state.activeView = view;
  render();
}

function payOrder() {
  const table = getCurrentTable();
  const order = table ? getOrder(table.id) : null;
  if (!table || !order || order.lines.length === 0) return;

  const totals = orderTotals(order);
  if (!order.payments.length) {
    order.payments.push({ id: uid("pay"), method: state.paymentMethod, amount: totals.total });
  }
  const paymentSummary = paymentTotals(order, totals.total);
  if (paymentSummary.remaining > 0.009) {
    el.paymentAmountInput.value = paymentSummary.remaining.toFixed(2);
    el.paymentAmountInput.focus();
    return;
  }
  const payments = appliedPayments(order.payments, totals.total);
  const sale = {
    id: uid("s"),
    tableName: table.name,
    paymentMethod: paymentLabel(payments),
    payments,
    tenderedPayments: structuredClone(order.payments),
    changeDue: paymentSummary.change,
    createdAt: new Date().toISOString(),
    lines: structuredClone(order.lines),
    discountPercent: order.discountPercent || 0,
    discount: totals.discount,
    total: totals.total,
    tax: totals.tax
  };

  state.sales.push(sale);
  delete state.orders[table.id];
  render();
  printReceipt(sale);
}

function todaySales() {
  return state.sales.filter((sale) => sale.createdAt.slice(0, 10) === todayKey());
}

function activeSales(sales = todaySales()) {
  return sales.filter((sale) => !sale.voided);
}

function todayCancellations() {
  return state.canceledOrders.filter((item) => item.createdAt.slice(0, 10) === todayKey());
}

function buildReport(sales = todaySales()) {
  const active = activeSales(sales);
  const total = active.reduce((sum, sale) => sum + sale.total, 0);
  const tax = active.reduce((sum, sale) => sum + sale.tax, 0);
  const discount = active.reduce((sum, sale) => sum + (sale.discount || 0), 0);
  const byPayment = active.reduce((acc, sale) => {
    salePayments(sale).forEach((payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
    });
    return acc;
  }, {});
  const cashTotal = byPayment.Especes || 0;
  const openingFloat = Number(state.cashSession.openingFloat || 0);
  const cashCounted = Number(state.cashSession.cashCounted || 0);
  const expectedCash = openingFloat + cashTotal;
  return {
    total,
    tax,
    discount,
    byPayment,
    ticketCount: active.length,
    voidedCount: sales.length - active.length,
    cashTotal,
    openingFloat,
    expectedCash,
    cashCounted,
    cashDifference: cashCounted - expectedCash,
    average: active.length ? total / active.length : 0
  };
}

function salePayments(sale) {
  if (Array.isArray(sale.payments) && sale.payments.length) return sale.payments;
  return [{ method: sale.paymentMethod || "Carte", amount: sale.total || 0 }];
}

function showReport() {
  const sales = todaySales();
  const report = buildReport(sales);
  const lines = [
    state.restaurantName.toUpperCase(),
    `Rapport du ${new Date().toLocaleDateString("fr-FR")}`,
    "",
    `Chiffre d'affaires : ${money.format(report.total)}`,
    `Tickets : ${sales.length}`,
    `Panier moyen : ${money.format(report.average)}`,
    `Remises : ${money.format(report.discount)}`,
    `TVA estimee : ${money.format(report.tax)}`,
    `Fond de caisse : ${money.format(report.openingFloat)}`,
    `Especes attendues : ${money.format(report.expectedCash)}`,
    `Especes comptees : ${money.format(report.cashCounted)}`,
    `Ecart caisse : ${money.format(report.cashDifference)}`,
    `Tickets annules : ${report.voidedCount}`,
    `Tickets ouverts abandonnes : ${todayCancellations().length}`,
    "",
    "Paiements",
    ...Object.entries(report.byPayment).map(([method, total]) => `${method} : ${money.format(total)}`)
  ];
  el.reportContent.textContent = lines.join("\n");
  el.reportDialog.showModal();
}

function voidSale(saleId) {
  const sale = state.sales.find((item) => item.id === saleId);
  if (!sale || sale.voided) return;
  const reason = safePrompt("Motif d'annulation du ticket encaisse", "Erreur d'encaissement");
  if (reason === null) return;
  sale.voided = true;
  sale.voidedAt = new Date().toISOString();
  sale.voidReason = reason.trim() || "Sans motif";
  render();
}

function updateCashSession() {
  state.cashSession.openingFloat = Math.max(0, Number(el.openingFloatInput.value) || 0);
  state.cashSession.cashCounted = Math.max(0, Number(el.cashCountedInput.value) || 0);
  state.cashSession.closedAt = null;
  render();
}

function closeCashSession() {
  const report = buildReport();
  if (!safeConfirm(`Cloturer la caisse avec un ecart de ${money.format(report.cashDifference)} ?`)) return;
  const closure = {
    id: uid("z"),
    createdAt: new Date().toISOString(),
    openingFloat: report.openingFloat,
    cashExpected: report.expectedCash,
    cashCounted: report.cashCounted,
    cashDifference: report.cashDifference,
    total: report.total,
    tax: report.tax,
    ticketCount: report.ticketCount,
    voidedCount: report.voidedCount,
    canceledOpenOrders: todayCancellations().length,
    byPayment: report.byPayment
  };
  state.cashClosures.push(closure);
  state.cashSession.closedAt = closure.createdAt;
  render();
}

function printReceipt(sale) {
  const existing = document.querySelector(".receipt");
  if (existing) existing.remove();

  const template = document.querySelector("#receiptTemplate");
  const node = template.content.cloneNode(true);
  fillReceiptNode(node, sale);
  document.body.appendChild(node);
  window.print();
}

function fillReceiptNode(root, sale) {
  root.querySelector("h1").textContent = state.restaurantName;
  root.querySelector(".receipt-meta").textContent = `${sale.tableName} · ${new Date(sale.createdAt).toLocaleString("fr-FR")} · ${sale.paymentMethod}`;
  root.querySelector(".receipt-lines").innerHTML = sale.lines
    .map((line) => `<p><span>${lineReceiptLabel(line)}</span><strong>${money.format(lineNetTotal(line))}</strong></p>`)
    .join("");
  root.querySelector(".receipt-total").innerHTML = `
    ${sale.discount ? `<p><span>Remise</span><strong>-${money.format(sale.discount)}</strong></p>` : ""}
    <p><span>TVA incluse</span><strong>${money.format(sale.tax)}</strong></p>
    ${salePayments(sale).map((payment) => `<p><span>${escapeHtml(payment.method)}</span><strong>${money.format(payment.amount)}</strong></p>`).join("")}
    ${sale.changeDue ? `<p><span>Rendu</span><strong>${money.format(sale.changeDue)}</strong></p>` : ""}
    <h2><span>Total</span><strong>${money.format(sale.total)}</strong></h2>
    ${sale.voided ? `<p class="audit-note">Ticket annule</p>` : ""}
  `;
}

function showReceiptPreview(sale = getCurrentSaleDraft()) {
  if (!sale) return;
  const template = document.querySelector("#receiptTemplate");
  const node = template.content.cloneNode(true);
  fillReceiptNode(node, sale);
  el.receiptPreview.replaceChildren(node.querySelector(".receipt"));
  el.receiptPreview.dataset.saleId = sale.id;
  el.receiptDialog.showModal();
}

function printReceiptFromPreview() {
  const saleId = el.receiptPreview.dataset.saleId;
  const sale = saleId === "draft" ? getCurrentSaleDraft() : state.sales.find((item) => item.id === saleId);
  if (sale) printReceipt(sale);
}

function addTable() {
  const number = state.tables.length + 1;
  const zone = state.selectedZone === "Toutes" ? "Salle" : state.selectedZone;
  const table = { id: uid("t"), name: `Table ${number}`, seats: 2, zone };
  state.tables.push(table);
  state.currentTableId = table.id;
  state.selectedZone = zone;
  render();
}

function openTableEditor() {
  const table = getCurrentTable();
  if (!table) return;
  el.tableNameInput.value = table.name;
  el.tableSeatsInput.value = table.seats || 2;
  el.tableZoneInput.value = table.zone || inferTableZone(table);
  el.tableDialog.showModal();
}

function saveTable() {
  const table = getCurrentTable();
  if (!table) return;
  const name = el.tableNameInput.value.trim();
  const seats = Math.max(1, Math.min(30, Number(el.tableSeatsInput.value) || 1));
  const zone = el.tableZoneInput.value.trim() || "Salle";
  if (!name) return;
  table.name = name;
  table.seats = seats;
  table.zone = zone;
  state.selectedZone = zone;
  el.tableDialog.close();
  render();
}

function saveProduct() {
  const name = el.productName.value.trim();
  const price = Number(el.productPrice.value);
  const category = el.productCategory.value.trim() || "Carte";
  const taxRate = Number(el.productTaxRate.value) || 0.1;

  if (!name || !Number.isFinite(price) || price <= 0) return;

  state.products.push({
    id: uid("p"),
    name,
    category,
    price,
    taxRate,
    favorite: false,
    available: true
  });

  el.productName.value = "";
  el.productPrice.value = "";
  el.productCategory.value = category;
  state.selectedCategory = category;
  render();
}

function saveRestaurant() {
  const name = el.restaurantNameInput.value.trim();
  if (!name) return;
  state.restaurantName = name;
  render();
}

function deleteProduct(productId) {
  state.products = state.products.filter((product) => product.id !== productId);
  Object.values(state.orders).forEach((order) => {
    order.lines = order.lines.filter((line) => line.productId !== productId);
  });
  render();
}

function toggleProductFavorite(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  product.favorite = !product.favorite;
  render();
}

function toggleProductAvailability(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  product.available = !product.available;
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `caisse-restaurant-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportSalesCsv() {
  const sales = todaySales();
  const rows = [
    ["date", "heure", "statut", "table", "paiement", "detail_paiements", "rendu", "article", "quantite", "prix_unitaire", "remise_ligne", "total_ligne", "remise_totale", "total_ticket", "motif_annulation"]
  ];

  sales.forEach((sale) => {
    const date = new Date(sale.createdAt);
    const paymentDetail = salePayments(sale).map((payment) => `${payment.method} ${payment.amount.toFixed(2)}`).join(" + ");
    sale.lines.forEach((line) => {
      rows.push([
        date.toLocaleDateString("fr-FR"),
        date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        sale.voided ? "annule" : "encaisse",
        sale.tableName,
        sale.paymentMethod,
        paymentDetail,
        (sale.changeDue || 0).toFixed(2),
        line.name,
        line.qty,
        line.price.toFixed(2),
        lineDiscountAmount(line).toFixed(2),
        lineNetTotal(line).toFixed(2),
        (sale.discount || 0).toFixed(2),
        sale.total.toFixed(2),
        sale.voidReason || ""
      ]);
    });
  });

  todayCancellations().forEach((item) => {
    const date = new Date(item.createdAt);
    item.order.lines.forEach((line) => {
      rows.push([
        date.toLocaleDateString("fr-FR"),
        date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        "abandon",
        item.tableName,
        "",
        "",
        "",
        line.name,
        line.qty,
        line.price.toFixed(2),
        lineDiscountAmount(line).toFixed(2),
        lineNetTotal(line).toFixed(2),
        "",
        (item.total || 0).toFixed(2),
        item.reason
      ]);
    });
  });

  downloadText(`ventes-${todayKey()}.csv`, rows.map(csvRow).join("\n"), "text/csv;charset=utf-8");
}

function csvRow(values) {
  return values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.tables) || !Array.isArray(data.products)) return;
      state = normalizeState({ ...seed, ...data });
      render();
    } catch {
      return;
    }
  };
  reader.readAsText(file);
}

function startNewService() {
  const hasOpenOrders = Object.values(state.orders).some((order) => order.lines.length);
  if (hasOpenOrders && !safeConfirm("Des tables sont encore ouvertes. Demarrer quand meme un nouveau service ?")) return;
  if (!safeConfirm("Conserver l'historique des ventes, journaliser les tickets ouverts, et vider les tables ?")) return;
  Object.entries(state.orders).forEach(([tableId, order]) => {
    if (!order.lines.length) return;
    const table = state.tables.find((item) => item.id === tableId);
    state.canceledOrders.push({
      id: uid("c"),
      tableId,
      tableName: table?.name || "Table",
      reason: "Nouveau service",
      createdAt: new Date().toISOString(),
      total: orderTotals(order).total,
      order: structuredClone(order)
    });
  });
  state.orders = {};
  state.currentTableId = state.tables[0]?.id || null;
  state.activeView = "menu";
  state.cashSession = { openingFloat: 0, cashCounted: 0, closedAt: null };
  render();
}

function escapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

function safePrompt(message, defaultValue = "") {
  try {
    return window.prompt(message, defaultValue);
  } catch {
    return defaultValue;
  }
}

function safeConfirm(message) {
  try {
    return window.confirm(message);
  } catch {
    return true;
  }
}

el.tablesList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-table-id]");
  if (!card) return;
  state.currentTableId = card.dataset.tableId;
  render();
});

el.zoneTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-zone]");
  if (!button) return;
  state.selectedZone = button.dataset.zone;
  render();
});

el.categoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.selectedCategory = button.dataset.category;
  render();
});

el.productSearch.addEventListener("input", (event) => {
  state.productSearch = event.target.value;
  render();
});

el.productsGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-product-id]");
  if (!card) return;
  addProductToOrder(card.dataset.productId);
});

el.orderLines.addEventListener("click", (event) => {
  const inc = event.target.closest("[data-inc]");
  const dec = event.target.closest("[data-dec]");
  const note = event.target.closest("[data-note]");
  const transfer = event.target.closest("[data-transfer-line]");
  const price = event.target.closest("[data-price]");
  const discount = event.target.closest("[data-line-discount]");
  const deleteButton = event.target.closest("[data-delete-line]");
  if (inc) changeQuantity(inc.dataset.inc, 1);
  if (dec) changeQuantity(dec.dataset.dec, -1);
  if (note) openLineEditor(note.dataset.note);
  if (transfer) transferLine(transfer.dataset.transferLine);
  if (price) openLineEditor(price.dataset.price);
  if (discount) openLineEditor(discount.dataset.lineDiscount);
  if (deleteButton) deleteLine(deleteButton.dataset.deleteLine);
});

el.viewTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  state.activeView = button.dataset.view;
  render();
});

el.kitchenList.addEventListener("click", (event) => {
  const select = event.target.closest("[data-kitchen-select]");
  const ready = event.target.closest("[data-ready]");
  const serve = event.target.closest("[data-serve]");
  if (select) selectTable(select.dataset.kitchenSelect, "menu");
  if (ready) updateKitchenStatus(ready.dataset.ready, "ready");
  if (serve) updateKitchenStatus(serve.dataset.serve, "open");
});

el.salesList.addEventListener("click", (event) => {
  const voidButton = event.target.closest("[data-void-sale]");
  const reprintButton = event.target.closest("[data-reprint-sale]");
  if (voidButton) voidSale(voidButton.dataset.voidSale);
  if (reprintButton) {
    const sale = state.sales.find((item) => item.id === reprintButton.dataset.reprintSale);
    showReceiptPreview(sale);
  }
});

el.paymentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.paymentMethod = button.dataset.payment;
    render();
  });
});

el.paymentList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-payment]");
  if (!button) return;
  deletePayment(button.dataset.deletePayment);
});

el.settingsButton.addEventListener("click", () => el.settingsDialog.showModal());
el.addTableButton.addEventListener("click", addTable);
el.editTableButton.addEventListener("click", openTableEditor);
el.saveTableButton.addEventListener("click", saveTable);
el.saveLineButton.addEventListener("click", saveLineEdit);
el.deleteLineButton.addEventListener("click", deleteEditingLine);
el.saveRestaurantButton.addEventListener("click", saveRestaurant);
el.saveProductButton.addEventListener("click", saveProduct);
el.clearOrderButton.addEventListener("click", clearOrder);
el.holdButton.addEventListener("click", holdOrder);
el.previewReceiptButton.addEventListener("click", () => showReceiptPreview());
el.payButton.addEventListener("click", payOrder);
el.discountInput.addEventListener("input", (event) => setDiscount(event.target.value));
el.fillRemainingButton.addEventListener("click", fillRemainingPayment);
el.addPaymentButton.addEventListener("click", addPayment);
el.paymentAmountInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addPayment();
});
el.transferButton.addEventListener("click", transferOrder);
el.mergeTableButton.addEventListener("click", mergeTable);
el.openingFloatInput.addEventListener("input", updateCashSession);
el.cashCountedInput.addEventListener("input", updateCashSession);
el.closeCashButton.addEventListener("click", closeCashSession);
el.exportButton.addEventListener("click", exportData);
el.exportCsvButton.addEventListener("click", exportSalesCsv);
el.reportButton.addEventListener("click", showReport);
el.printReceiptButton.addEventListener("click", printReceiptFromPreview);
el.newServiceButton.addEventListener("click", startNewService);
el.importInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importData(file);
  event.target.value = "";
});

el.settingsProducts.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-product]");
  const favorite = event.target.closest("[data-toggle-favorite]");
  const available = event.target.closest("[data-toggle-available]");
  if (button) deleteProduct(button.dataset.deleteProduct);
  if (favorite) toggleProductFavorite(favorite.dataset.toggleFavorite);
  if (available) toggleProductAvailability(available.dataset.toggleAvailable);
});

render();
hydrateFromIndexedDb();
