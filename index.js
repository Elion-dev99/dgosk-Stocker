"use strict";

const STORAGE_KEYS = {
  products: "stockly.spa.products.v1",
  movements: "stockly.spa.movements.v1",
  stocktakes: "stockly.spa.stocktakes.v1",
  orders: "stockly.spa.orders.v1"
};

const seedProducts = [
  { id: "p1", name: "コーヒー豆 200g", sku: "COF-001", jan: "4901234567890", category: "飲料", stock: 3, minimum: 10, location: "A-1-3", supplier: "株式会社コーヒー商事", icon: "☕" },
  { id: "p2", name: "ミルク 1L", sku: "MIL-001", jan: "4901234567891", category: "飲料", stock: 2, minimum: 8, location: "A-1-4", supplier: "乳製品商事", icon: "🥛" },
  { id: "p3", name: "紙コップ 100個入", sku: "SUP-001", jan: "4901234567892", category: "消耗品", stock: 5, minimum: 20, location: "B-2-1", supplier: "備品販売", icon: "🥤" },
  { id: "p4", name: "ミネラルウォーター 500ml", sku: "WAT-001", jan: "4901234567893", category: "飲料", stock: 120, minimum: 24, location: "B-2-2", supplier: "ウォーター販売", icon: "💧" },
  { id: "p5", name: "緑茶 ペットボトル", sku: "TEA-001", jan: "4901234567894", category: "飲料", stock: 48, minimum: 12, location: "B-2-3", supplier: "お茶商事", icon: "🍵" },
  { id: "p6", name: "シュガー 3g", sku: "SUP-002", jan: "4901234567895", category: "食品", stock: 15, minimum: 20, location: "C-1-1", supplier: "食品販売", icon: "▱" }
];

const state = {
  products: load(STORAGE_KEYS.products, seedProducts),
  movements: load(STORAGE_KEYS.movements, []),
  stocktakes: load(STORAGE_KEYS.stocktakes, []),
  orders: load(STORAGE_KEYS.orders, []),
  searchQuery: "",
  category: "すべて"
};

const content = document.querySelector("#content");
const pageTitle = document.querySelector("#pageTitle");
const backButton = document.querySelector("#backButton");
const headerAction = document.querySelector("#headerAction");
const bottomNav = document.querySelector("#bottomNav");
const modalRoot = document.querySelector("#modalRoot");
const toastElement = document.querySelector("#toast");
let toastTimer;

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function save() {
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(state.products));
  localStorage.setItem(STORAGE_KEYS.movements, JSON.stringify(state.movements));
  localStorage.setItem(STORAGE_KEYS.stocktakes, JSON.stringify(state.stocktakes));
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(state.orders));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatNumber(value) {
  return new Intl.NumberFormat("ja-JP").format(value);
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastElement.classList.remove("show"), 1900);
}

function getRoute() {
  const hash = location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  return { name: parts[0] || "home", id: parts[1] || null };
}

function navigate(path) {
  location.hash = `#/${path}`;
}

function productById(id) {
  return state.products.find(product => product.id === id) || null;
}

function productIcon(product) {
  return `<span class="product-icon" aria-hidden="true">${escapeHtml(product.icon)}</span>`;
}

function productRow(product) {
  const low = product.stock <= product.minimum;
  return `<button class="product-row" data-product-id="${product.id}">
    ${productIcon(product)}
    <span class="row-copy"><b>${escapeHtml(product.name)}</b><small>${escapeHtml(product.sku)}　${escapeHtml(product.location)}</small></span>
    <span class="stock-value ${low ? "low" : ""}">残り <b>${formatNumber(product.stock)}</b></span>
    <span class="chevron">›</span>
  </button>`;
}

function renderList(products) {
  if (!products.length) return `<div class="card empty"><b>商品が見つかりません</b>検索条件を変更してください</div>`;
  return `<section class="card list">${products.map(productRow).join("")}</section>`;
}

function renderHome() {
  const low = state.products.filter(product => product.stock <= product.minimum);
  const total = state.products.reduce((sum, product) => sum + product.stock, 0);
  return `<section class="grid-2">
    <article class="card metric-card danger"><span>対応が必要</span><strong>${low.length}<small>件</small></strong></article>
    <article class="card metric-card"><span>総在庫数</span><strong>${formatNumber(total)}<small>個</small></strong></article>
  </section>
  <div class="section-header"><h2>補充が必要</h2><button class="text-button" data-nav="inventory">すべて見る</button></div>
  ${renderList(low.slice(0, 4))}
  <div class="section-header"><h2>最近の操作</h2><button class="text-button" data-nav="history">すべて見る</button></div>
  ${renderHistoryList(state.movements.slice(0, 5))}`;
}

function renderSearch() {
  const query = state.searchQuery.toLowerCase();
  const products = state.products.filter(product => [product.name, product.sku, product.jan, product.location].some(value => value.toLowerCase().includes(query)));
  return `<label class="search-box"><span>⌕</span><input id="searchInput" value="${escapeHtml(state.searchQuery)}" placeholder="商品名・SKU・JANで検索"><button id="clearSearch" type="button" ${state.searchQuery ? "" : "hidden"}>×</button></label>
  <div class="chips"><button class="chip" data-search-word="コーヒー">コーヒー</button><button class="chip" data-search-word="ミルク">ミルク</button><button class="chip" data-search-word="紙コップ">紙コップ</button></div>
  <div class="section-header"><h2>検索結果</h2><span>${products.length}件</span></div>${renderList(products)}`;
}

function renderScan() {
  return `<section class="scan-screen"><div class="scan-frame"></div><p class="scan-copy">バーコードを読み取ってください</p><div class="scan-controls"><select id="scanProduct">${state.products.map(product => `<option value="${product.id}">${escapeHtml(product.name)}　${escapeHtml(product.jan)}</option>`).join("")}</select><button id="simulateScan" class="primary-button full-button">デモ読み取り</button></div></section>`;
}

function renderInventory() {
  const categories = ["すべて", ...new Set(state.products.map(product => product.category))];
  const products = state.products.filter(product => state.category === "すべて" || product.category === state.category);
  return `<label class="search-box"><span>⌕</span><input id="inventorySearch" placeholder="商品名・SKUで絞り込み"></label>
  <div class="chips">${categories.map(category => `<button class="chip ${state.category === category ? "active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}</div>
  <div class="section-header"><h2>在庫一覧</h2><span>${products.length}件</span></div><div id="inventoryResults">${renderList(products)}</div>`;
}

function renderOperations() {
  return `<section class="card list">
    <button class="menu-row" data-nav="stocktakes"><span class="menu-icon">✓</span><span class="row-copy"><b>棚卸</b><small>実在庫を入力して差異を確定</small></span><span class="chevron">›</span></button>
    <button class="menu-row" data-nav="orders"><span class="menu-icon">▤</span><span class="row-copy"><b>発注管理</b><small>不足商品の発注と入荷</small></span><span class="chevron">›</span></button>
    <button class="menu-row" data-nav="history"><span class="menu-icon">↕</span><span class="row-copy"><b>操作履歴</b><small>入庫・出庫の記録</small></span><span class="chevron">›</span></button>
  </section>
  <button id="resetData" class="danger-button full-button" style="margin-top:14px">デモデータを初期化</button>`;
}

function renderProductDetail(id) {
  const product = productById(id);
  if (!product) return `<div class="card empty"><b>商品が見つかりません</b></div>`;
  const low = product.stock <= product.minimum;
  return `<section class="detail-hero">${productIcon(product)}<h2>${escapeHtml(product.name)}</h2><p>${escapeHtml(product.sku)}　${escapeHtml(product.category)}</p><strong id="detailStock" class="detail-stock">${formatNumber(product.stock)}</strong><span class="detail-stock-label">在庫数</span></section>
  ${low ? `<div class="alert">補充が必要です　最低在庫数 ${product.minimum}</div>` : ""}
  <section class="stack"><div class="quick-actions"><button data-change="10" data-product="${product.id}">+10</button><button data-change="20" data-product="${product.id}">+20</button><button data-change="50" data-product="${product.id}">+50</button></div><div class="quick-actions out"><button data-change="-1" data-product="${product.id}">-1</button><button data-change="-5" data-product="${product.id}">-5</button><button data-change="-10" data-product="${product.id}">-10</button></div></section>
  <section class="card" style="margin-top:14px"><div class="fact-row"><span>JANコード</span><b>${escapeHtml(product.jan)}</b></div><div class="fact-row"><span>カテゴリ</span><b>${escapeHtml(product.category)}</b></div><div class="fact-row"><span>保管場所</span><b>${escapeHtml(product.location)}</b></div><div class="fact-row"><span>仕入先</span><b>${escapeHtml(product.supplier)}</b></div></section>`;
}

function renderHistoryList(items) {
  if (!items.length) return `<div class="card empty"><b>履歴はありません</b>入出庫を行うと表示されます</div>`;
  return `<section class="card list">${items.map(item => { const product = productById(item.productId); if (!product) return ""; return `<div class="history-row"><span class="movement-icon ${item.type}">${item.type === "in" ? "↓" : "↑"}</span><span class="row-copy"><b>${escapeHtml(product.name)}</b><small>${new Date(item.createdAt).toLocaleString("ja-JP")}</small></span><strong class="history-qty ${item.type}">${item.type === "in" ? "+" : "-"}${item.quantity}</strong></div>`; }).join("")}</section>`;
}

function renderHistory() { return renderHistoryList(state.movements); }

function renderStocktakes() {
  return `<button id="startStocktake" class="primary-button full-button">棚卸を開始</button><div class="section-header"><h2>棚卸履歴</h2><span>${state.stocktakes.length}件</span></div>${state.stocktakes.length ? `<section class="card list">${state.stocktakes.map(item => `<button class="menu-row" data-stocktake-id="${item.id}"><span class="menu-icon">✓</span><span class="row-copy"><b>${escapeHtml(item.name)}</b><small>${item.status === "counting" ? "実施中" : "完了"}　${item.items.filter(row => row.counted !== null).length}/${item.items.length}商品</small></span><span class="chevron">›</span></button>`).join("")}</section>` : `<div class="card empty"><b>棚卸はありません</b></div>`}`;
}

function renderStocktakeDetail(id) {
  const stocktake = state.stocktakes.find(item => item.id === id);
  if (!stocktake) return `<div class="card empty"><b>棚卸が見つかりません</b></div>`;
  return `<div class="card"><div class="fact-row"><span>状態</span><b>${stocktake.status === "counting" ? "実施中" : "完了"}</b></div><div class="fact-row"><span>対象商品</span><b>${stocktake.items.length}件</b></div></div>
  <div class="section-header"><h2>実在庫入力</h2><span>${stocktake.items.filter(item => item.counted !== null).length}/${stocktake.items.length}</span></div>
  <section class="card list">${stocktake.items.map(item => { const product = productById(item.productId); return `<div class="product-row" style="grid-template-columns:50px 1fr 80px">${productIcon(product)}<span class="row-copy"><b>${escapeHtml(product.name)}</b><small>理論在庫 ${item.expected}</small></span><input class="field stocktake-input" style="padding:9px;text-align:center" type="number" min="0" inputmode="numeric" value="${item.counted ?? ""}" data-stocktake="${stocktake.id}" data-product="${product.id}" placeholder="実数"></div>`; }).join("")}</section>
  ${stocktake.status === "counting" ? `<button id="completeStocktake" data-stocktake="${stocktake.id}" class="primary-button full-button" style="margin-top:14px">差異を反映して完了</button>` : ""}`;
}

function reorderCandidates() { return state.products.filter(product => product.stock <= product.minimum); }
function renderOrders() {
  return `<button id="createOrder" class="primary-button full-button">不足商品から発注を作成</button><div class="section-header"><h2>発注一覧</h2><span>${state.orders.length}件</span></div>${state.orders.length ? `<section class="card list">${state.orders.map(order => `<button class="menu-row" data-order-id="${order.id}"><span class="menu-icon">▤</span><span class="row-copy"><b>${escapeHtml(order.number)}</b><small>${escapeHtml(order.status)}　${order.items.reduce((sum,item)=>sum+item.quantity,0)}個</small></span><span class="chevron">›</span></button>`).join("")}</section>` : `<div class="card empty"><b>発注はありません</b></div>`}`;
}

function renderOrderDetail(id) {
  const order = state.orders.find(item => item.id === id);
  if (!order) return `<div class="card empty"><b>発注が見つかりません</b></div>`;
  const statusActions = { "下書き": ["申請", "申請済"], "申請済": ["承認", "承認済"], "承認済": ["入荷", "入荷済"] };
  return `<section class="card"><div class="fact-row"><span>発注番号</span><b>${escapeHtml(order.number)}</b></div><div class="fact-row"><span>ステータス</span><b>${escapeHtml(order.status)}</b></div><div class="fact-row"><span>作成日</span><b>${new Date(order.createdAt).toLocaleDateString("ja-JP")}</b></div></section>
  <div class="section-header"><h2>発注明細</h2></div><section class="card list">${order.items.map(item => { const product=productById(item.productId); return `<div class="product-row" style="grid-template-columns:50px 1fr auto">${productIcon(product)}<span class="row-copy"><b>${escapeHtml(product.name)}</b><small>${escapeHtml(product.sku)}</small></span><strong>${item.quantity}個</strong></div>`; }).join("")}</section>
  ${statusActions[order.status] ? `<button class="primary-button full-button order-transition" data-order="${order.id}" data-next="${statusActions[order.status][1]}" style="margin-top:14px">${statusActions[order.status][0]}</button>` : ""}`;
}

const routes = {
  home: { title: "ホーム", render: renderHome, tab: "home" },
  search: { title: "検索", render: renderSearch, tab: "search" },
  scan: { title: "スキャン", render: renderScan, tab: "scan" },
  inventory: { title: "在庫一覧", render: renderInventory, tab: "inventory" },
  operations: { title: "業務", render: renderOperations, tab: "operations" },
  product: { title: "商品詳細", render: renderProductDetail, back: true, tab: "inventory" },
  history: { title: "操作履歴", render: renderHistory, back: true, tab: "operations" },
  stocktakes: { title: "棚卸", render: renderStocktakes, back: true, tab: "operations" },
  stocktake: { title: "棚卸入力", render: renderStocktakeDetail, back: true, tab: "operations" },
  orders: { title: "発注管理", render: renderOrders, back: true, tab: "operations" },
  order: { title: "発注詳細", render: renderOrderDetail, back: true, tab: "operations" }
};

function render() {
  const route = getRoute();
  const config = routes[route.name] || routes.home;
  pageTitle.textContent = config.title;
  backButton.hidden = !config.back;
  headerAction.hidden = route.name === "scan";
  content.innerHTML = config.render(route.id);
  document.querySelectorAll("[data-tab]").forEach(element => element.classList.toggle("active", element.dataset.tab === config.tab));
  content.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "auto" });
  bindPageEvents(route);
}

function bindPageEvents(route) {
  document.querySelectorAll("[data-nav]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.nav)));
  document.querySelectorAll("[data-product-id]").forEach(button => button.addEventListener("click", () => navigate(`product/${button.dataset.productId}`)));

  const searchInput = document.querySelector("#searchInput");
  if (searchInput) searchInput.addEventListener("input", event => { state.searchQuery = event.target.value; render(); document.querySelector("#searchInput")?.focus(); });
  document.querySelector("#clearSearch")?.addEventListener("click", () => { state.searchQuery = ""; render(); });
  document.querySelectorAll("[data-search-word]").forEach(button => button.addEventListener("click", () => { state.searchQuery = button.dataset.searchWord; render(); }));

  document.querySelectorAll("[data-category]").forEach(button => button.addEventListener("click", () => { state.category = button.dataset.category; render(); }));
  const inventorySearch = document.querySelector("#inventorySearch");
  if (inventorySearch) inventorySearch.addEventListener("input", event => { const value=event.target.value.toLowerCase(); const products=state.products.filter(product => (state.category === "すべて" || product.category === state.category) && [product.name,product.sku].some(text=>text.toLowerCase().includes(value))); document.querySelector("#inventoryResults").innerHTML=renderList(products); bindPageEvents(route); });

  document.querySelector("#simulateScan")?.addEventListener("click", () => { const product=document.querySelector("#scanProduct").value; navigate(`product/${product}`); showToast("商品を読み取りました"); });
  document.querySelectorAll("[data-change]").forEach(button => button.addEventListener("click", () => changeStock(button.dataset.product, Number(button.dataset.change))));
  document.querySelector("#resetData")?.addEventListener("click", resetData);
  document.querySelector("#startStocktake")?.addEventListener("click", startStocktake);
  document.querySelectorAll("[data-stocktake-id]").forEach(button=>button.addEventListener("click",()=>navigate(`stocktake/${button.dataset.stocktakeId}`)));
  document.querySelectorAll(".stocktake-input").forEach(input=>input.addEventListener("change",()=>updateStocktake(input.dataset.stocktake,input.dataset.product,input.value)));
  document.querySelector("#completeStocktake")?.addEventListener("click", event=>completeStocktake(event.currentTarget.dataset.stocktake));
  document.querySelector("#createOrder")?.addEventListener("click", createOrder);
  document.querySelectorAll("[data-order-id]").forEach(button=>button.addEventListener("click",()=>navigate(`order/${button.dataset.orderId}`)));
  document.querySelector(".order-transition")?.addEventListener("click", event=>transitionOrder(event.currentTarget.dataset.order,event.currentTarget.dataset.next));
}

function changeStock(productId, delta) {
  const product = productById(productId);
  if (!product) return;
  if (product.stock + delta < 0) return showToast("現在庫を超えて出庫できません");
  product.stock += delta;
  state.movements.unshift({ id: crypto.randomUUID(), productId, type: delta > 0 ? "in" : "out", quantity: Math.abs(delta), createdAt: new Date().toISOString() });
  save();
  render();
  navigator.vibrate?.(25);
  showToast(delta > 0 ? `${delta}個を入庫しました` : `${Math.abs(delta)}個を出庫しました`);
}

function startStocktake() {
  const stocktake = { id: crypto.randomUUID(), name: `${new Date().toLocaleDateString("ja-JP")} 棚卸`, status: "counting", createdAt: new Date().toISOString(), items: state.products.map(product => ({ productId: product.id, expected: product.stock, counted: null })) };
  state.stocktakes.unshift(stocktake); save(); navigate(`stocktake/${stocktake.id}`);
}
function updateStocktake(stocktakeId, productId, value) { const item=state.stocktakes.find(x=>x.id===stocktakeId)?.items.find(x=>x.productId===productId); if(item){ item.counted=value===""?null:Number(value); save(); } }
function completeStocktake(id) { const stocktake=state.stocktakes.find(x=>x.id===id); if(!stocktake)return; if(stocktake.items.some(item=>item.counted===null))return showToast("未入力の商品があります"); stocktake.items.forEach(item=>{ const product=productById(item.productId); if(product)product.stock=item.counted; }); stocktake.status="completed"; stocktake.completedAt=new Date().toISOString(); save(); render(); showToast("棚卸を完了しました"); }
function createOrder() { const candidates=reorderCandidates(); if(!candidates.length)return showToast("発注候補はありません"); const order={id:crypto.randomUUID(),number:`PO-${Date.now()}`,status:"下書き",createdAt:new Date().toISOString(),items:candidates.map(product=>({productId:product.id,quantity:Math.max(product.minimum*2-product.stock,1)}))}; state.orders.unshift(order); save(); navigate(`order/${order.id}`); }
function transitionOrder(id,next) { const order=state.orders.find(x=>x.id===id); if(!order)return; order.status=next; if(next==="入荷済"){ order.items.forEach(item=>{const product=productById(item.productId);if(product){product.stock+=item.quantity;state.movements.unshift({id:crypto.randomUUID(),productId:product.id,type:"in",quantity:item.quantity,createdAt:new Date().toISOString()});}}); } save(); render(); showToast(`ステータスを「${next}」に変更しました`); }
function resetData() { if(!confirm("デモデータを初期化しますか？"))return; Object.values(STORAGE_KEYS).forEach(key=>localStorage.removeItem(key)); location.reload(); }

backButton.addEventListener("click", () => history.length > 1 ? history.back() : navigate("home"));
headerAction.addEventListener("click", () => showToast("追加メニューは今後拡張できます"));
window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => { if (!location.hash) location.hash = "#/home"; else render(); });
