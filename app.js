const seedProducts = [
  { id:'p1', name:'コーヒー豆 200g', sku:'COF-001', jan:'4901234567890', stock:3, minStock:10, price:980, category:'飲料', location:'A-1-3', supplier:'株式会社コーヒー商事', icon:'☕' },
  { id:'p2', name:'ドリップコーヒー 10袋', sku:'COF-002', jan:'4901234567891', stock:28, minStock:8, price:650, category:'飲料', location:'A-1-4', supplier:'株式会社コーヒー商事', icon:'▤' },
  { id:'p3', name:'ミネラルウォーター 500ml', sku:'WAT-001', jan:'4901234567892', stock:120, minStock:24, price:120, category:'飲料', location:'B-2-1', supplier:'水産業株式会社', icon:'💧' },
  { id:'p4', name:'緑茶 ペットボトル', sku:'TEA-001', jan:'4901234567893', stock:48, minStock:12, price:150, category:'飲料', location:'B-2-2', supplier:'茶葉株式会社', icon:'🍵' },
  { id:'p5', name:'紙コップ 100個入', sku:'SUP-001', jan:'4901234567894', stock:230, minStock:50, price:520, category:'備品', location:'C-1-1', supplier:'備品販売株式会社', icon:'🥛' },
  { id:'p6', name:'シュガー 3g', sku:'SUP-002', jan:'4901234567895', stock:15, minStock:20, price:300, category:'食品', location:'C-1-2', supplier:'食品株式会社', icon:'▭' },
  { id:'p7', name:'ミルク 5ml', sku:'SUP-003', jan:'4901234567896', stock:8, minStock:10, price:350, category:'食品', location:'C-1-3', supplier:'食品株式会社', icon:'◉' },
  { id:'p8', name:'ストロー 100本', sku:'SUP-004', jan:'4901234567897', stock:74, minStock:20, price:280, category:'備品', location:'C-2-1', supplier:'備品販売株式会社', icon:'Ⅱ' }
];

const initialHistory = [
  {id:crypto.randomUUID(), productId:'p1', type:'out', qty:2, memo:'店舗出庫', at:new Date(Date.now()-300000).toISOString(), user:'Tanaka'},
  {id:crypto.randomUUID(), productId:'p3', type:'in', qty:24, memo:'定期仕入れ', at:new Date(Date.now()-720000).toISOString(), user:'Sato'},
  {id:crypto.randomUUID(), productId:'p4', type:'out', qty:6, memo:'店舗出庫', at:new Date(Date.now()-1500000).toISOString(), user:'Tanaka'},
  {id:crypto.randomUUID(), productId:'p5', type:'in', qty:100, memo:'一括入庫', at:new Date(Date.now()-2500000).toISOString(), user:'Sato'}
];

const store = {
  products: JSON.parse(localStorage.getItem('stockly-products') || 'null') || seedProducts,
  history: JSON.parse(localStorage.getItem('stockly-history') || 'null') || initialHistory,
  route:'home', selectedId:null, productFilter:'all', historyFilter:'all', query:'',
  save(){ localStorage.setItem('stockly-products',JSON.stringify(this.products)); localStorage.setItem('stockly-history',JSON.stringify(this.history)); }
};

const app = document.querySelector('#app');
const title = document.querySelector('#headerTitle');
const eyebrow = document.querySelector('#headerEyebrow');
const sheet = document.querySelector('#transactionSheet');
const backdrop = document.querySelector('#sheetBackdrop');
let transactionMode = 'in';
let transactionProductId = null;
let toastTimer;

const yen = n => new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(n);
const number = n => new Intl.NumberFormat('ja-JP').format(n);
const productById = id => store.products.find(p=>p.id===id);
const totalStock = () => store.products.reduce((sum,p)=>sum+p.stock,0);
const escapeHtml = value => String(value).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const formatDate = iso => new Intl.DateTimeFormat('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));

function setHeader(main, sub='在庫管理') { title.textContent=main; eyebrow.textContent=sub; }
function toast(message){ const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('is-visible'),2200); }
function icon(product){ return `<span class="product-thumb" aria-hidden="true">${escapeHtml(product.icon)}</span>`; }
function productRow(product){ return `<button class="list-row" data-product="${product.id}">${icon(product)}<span class="row-copy"><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.sku)}</small></span><span class="row-value ${product.stock<=product.minStock?'low':''}">${number(product.stock)} ›</span></button>`; }
function historyRow(item){ const p=productById(item.productId); if(!p)return''; const sign=item.type==='out'?'-':'+'; return `<div class="list-row">${icon(p)}<span class="row-copy"><strong>${escapeHtml(p.name)}</strong><small>${item.type==='out'?'出庫':'入庫'}・${formatDate(item.at)}・${escapeHtml(item.user)}</small></span><span class="row-value ${item.type==='out'?'low':''}">${sign}${number(item.qty)}</span></div>`; }

function renderHome(){
  setHeader('ホーム');
  const low=store.products.filter(p=>p.stock<=p.minStock);
  const over=store.products.filter(p=>p.stock>=p.minStock*4);
  app.innerHTML=`<section class="hero-greeting"><p>おはようございます</p><h2>Tanakaさん</h2></section>
  <section class="inventory-hero"><p>総在庫数</p><div class="inventory-number">${number(totalStock())}</div><div class="inventory-change">すべての保管場所</div></section>
  <section class="stats-grid"><button class="stat-card" data-filter-jump="low"><span class="stat-label"><i class="dot-icon red">!</i>在庫不足</span><strong>${low.length}<small> 件</small></strong></button><button class="stat-card" data-filter-jump="over"><span class="stat-label"><i class="dot-icon blue">▥</i>過剰在庫</span><strong>${over.length}<small> 件</small></strong></button></section>
  <div class="section-title"><h3>クイックアクション</h3></div><section class="quick-grid"><button class="quick-action" data-quick="in"><span>＋</span><small>入庫</small></button><button class="quick-action out" data-quick="out"><span>−</span><small>出庫</small></button><button class="quick-action scan" data-route-action="scan"><span>⌗</span><small>スキャン</small></button><button class="quick-action count" data-route-action="products"><span>≡</span><small>棚卸</small></button></section>
  <div class="section-title"><h3>最近の動き</h3><button class="text-button" data-route-action="history">すべて見る ›</button></div><section class="list">${store.history.slice(0,4).map(historyRow).join('')}</section>`;
}

function renderProducts(){
 setHeader('商品一覧');
 const q=store.query.toLowerCase();
 let items=store.products.filter(p=>[p.name,p.sku,p.jan].some(v=>v.toLowerCase().includes(q)));
 if(store.productFilter==='available')items=items.filter(p=>p.stock>p.minStock);
 if(store.productFilter==='low')items=items.filter(p=>p.stock<=p.minStock);
 if(store.productFilter==='over')items=items.filter(p=>p.stock>=p.minStock*4);
 app.innerHTML=`<div class="searchbox"><input id="productSearch" value="${escapeHtml(store.query)}" placeholder="商品名・コード・JANで検索" aria-label="商品検索"></div><div class="segmented" aria-label="商品絞り込み">${[['all','すべて'],['available','在庫あり'],['low','在庫不足'],['over','過剰']].map(([k,v])=>`<button data-product-filter="${k}" class="${store.productFilter===k?'is-active':''}">${v}</button>`).join('')}</div><div class="page-summary"><span>${number(items.length)}件</span><span>在庫数順</span></div><section class="list">${items.length?items.map(productRow).join(''):'<div class="empty"><b>商品が見つかりません</b>検索条件を変更してください</div>'}</section>`;
 document.querySelector('#productSearch').addEventListener('input',e=>{store.query=e.target.value;renderProducts();document.querySelector('#productSearch').focus();});
}

function renderDetail(id){ const p=productById(id); if(!p){navigate('products');return;} setHeader('商品詳細',p.sku); const low=p.stock<=p.minStock; app.innerHTML=`<section class="detail-hero"><div class="detail-image">${escapeHtml(p.icon)}</div><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.sku)}　${escapeHtml(p.category)}</p></section><section class="stock-panel"><div><small>現在の在庫数</small><strong class="${low?'negative':''}">${number(p.stock)}</strong> /個</div><div class="min-stock"><small>最低在庫数</small><strong>${number(p.minStock)}</strong></div>${low?'<p class="warning">▲ 在庫が最低在庫数以下です</p>':''}</section><div class="action-pair"><button class="primary-button" data-transaction="in" data-id="${p.id}">＋ 入庫</button><button class="secondary-button" data-transaction="out" data-id="${p.id}">− 出庫</button></div><section class="info-list"><div class="info-row"><span>JANコード</span><strong>${escapeHtml(p.jan)}</strong></div><div class="info-row"><span>単価</span><strong>${yen(p.price)}</strong></div><div class="info-row"><span>カテゴリ</span><strong>${escapeHtml(p.category)}</strong></div><div class="info-row"><span>保管場所</span><strong>${escapeHtml(p.location)}</strong></div><div class="info-row"><span>仕入先</span><strong>${escapeHtml(p.supplier)}</strong></div></section>`; }

function renderHistory(){ setHeader('履歴'); let items=store.history; if(store.historyFilter!=='all')items=items.filter(i=>i.type===store.historyFilter); app.innerHTML=`<div class="segmented">${[['all','すべて'],['in','入庫'],['out','出庫']].map(([k,v])=>`<button data-history-filter="${k}" class="${store.historyFilter===k?'is-active':''}">${v}</button>`).join('')}</div><section class="list">${items.length?items.map(historyRow).join(''):'<div class="empty"><b>履歴はありません</b>入出庫を登録すると表示されます</div>'}</section>`; }

function renderSettings(){ setHeader('設定'); app.innerHTML=`<section class="settings-card"><div class="settings-row"><div><strong>在庫不足通知</strong><div class="eyebrow">最低在庫数以下で通知</div></div><button class="switch is-on" aria-label="通知を切り替える"></button></div><div class="settings-row"><div><strong>触覚フィードバック</strong><div class="eyebrow">対応端末で振動</div></div><button class="switch is-on" aria-label="触覚を切り替える"></button></div></section><section class="settings-card"><div class="settings-row"><span>データ保存</span><strong>この端末</strong></div><div class="settings-row"><span>バージョン</span><strong>1.0.0</strong></div><div class="settings-row"><span>デモデータ</span><button class="text-button" id="resetData">初期化</button></div></section>`; }

function renderScan(){ setHeader('スキャン'); app.innerHTML=`<section class="scan-view"><div class="scan-top"><button class="icon-button" data-route-action="home">‹</button><h2>バーコードスキャン</h2><button class="icon-button" aria-label="ライト">⌁</button></div><div class="scan-frame"></div><div class="scan-code">4901234567890</div><div class="scan-bottom"><p>JANコードを読み取るか入力してください</p><form id="janForm"><input id="janInput" inputmode="numeric" placeholder="JANコード" value="4901234567890" required><button>検索</button></form></div></section>`; }

function navigate(route,id=null){ store.route=route; store.selectedId=id; document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('is-active',t.dataset.route===route)); if(route==='home')renderHome(); else if(route==='products')renderProducts(); else if(route==='detail')renderDetail(id); else if(route==='history')renderHistory(); else if(route==='scan')renderScan(); else renderSettings(); app.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'smooth'}); }

function openTransaction(mode,id){ const p=productById(id) || store.products[0]; transactionMode=mode; transactionProductId=p.id; document.querySelector('#sheetKind').textContent=mode==='in'?'在庫を増やす':'在庫を減らす'; document.querySelector('#sheetTitle').textContent=mode==='in'?'入庫登録':'出庫登録'; document.querySelector('#sheetProduct').innerHTML=`${icon(p)}<span><strong>${escapeHtml(p.name)}</strong><br><small>現在庫 ${number(p.stock)}個</small></span>`; document.querySelector('#quantity').value='1'; document.querySelector('#memo').value=''; document.querySelector('#formError').textContent=''; document.querySelector('#submitTransaction').textContent=mode==='in'?'入庫を登録':'出庫を登録'; sheet.hidden=false;backdrop.hidden=false;document.body.style.overflow='hidden';setTimeout(()=>document.querySelector('#quantity').focus(),50); }
function closeSheet(){sheet.hidden=true;backdrop.hidden=true;document.body.style.overflow='';}

app.addEventListener('click',e=>{ const product=e.target.closest('[data-product]'); if(product)return navigate('detail',product.dataset.product); const route=e.target.closest('[data-route-action]'); if(route)return navigate(route.dataset.routeAction); const f=e.target.closest('[data-product-filter]'); if(f){store.productFilter=f.dataset.productFilter;return renderProducts();} const hf=e.target.closest('[data-history-filter]'); if(hf){store.historyFilter=hf.dataset.historyFilter;return renderHistory();} const tx=e.target.closest('[data-transaction]'); if(tx)return openTransaction(tx.dataset.transaction,tx.dataset.id); const quick=e.target.closest('[data-quick]'); if(quick)return openTransaction(quick.dataset.quick,store.products[0].id); const jump=e.target.closest('[data-filter-jump]'); if(jump){store.productFilter=jump.dataset.filterJump;navigate('products');} const sw=e.target.closest('.switch'); if(sw)sw.classList.toggle('is-on'); if(e.target.id==='resetData'){localStorage.removeItem('stockly-products');localStorage.removeItem('stockly-history');location.reload();} });

document.querySelector('.tabbar').addEventListener('click',e=>{const btn=e.target.closest('[data-route]');if(btn)navigate(btn.dataset.route);});
app.addEventListener('submit',e=>{if(e.target.id!=='janForm')return;e.preventDefault();const jan=document.querySelector('#janInput').value.trim();const p=store.products.find(x=>x.jan===jan);if(p)navigate('detail',p.id);else toast('一致する商品がありません');});
document.querySelector('#sheetClose').addEventListener('click',closeSheet);backdrop.addEventListener('click',closeSheet);
document.querySelector('#decreaseQuantity').addEventListener('click',()=>{const q=document.querySelector('#quantity');q.value=Math.max(1,Number(q.value||1)-1);});document.querySelector('#increaseQuantity').addEventListener('click',()=>{const q=document.querySelector('#quantity');q.value=Math.max(1,Number(q.value||1)+1);});
document.querySelector('#transactionForm').addEventListener('submit',e=>{e.preventDefault();const p=productById(transactionProductId);const qty=Number(document.querySelector('#quantity').value);const error=document.querySelector('#formError');if(!Number.isInteger(qty)||qty<1){error.textContent='1以上の整数を入力してください';return;}if(transactionMode==='out'&&qty>p.stock){error.textContent=`現在庫 ${p.stock}個を超えて出庫できません`;return;}p.stock += transactionMode==='in'?qty:-qty;store.history.unshift({id:crypto.randomUUID(),productId:p.id,type:transactionMode,qty,memo:document.querySelector('#memo').value.trim(),at:new Date().toISOString(),user:'Tanaka'});store.save();closeSheet();navigator.vibrate?.(30);toast(transactionMode==='in'?`${qty}個を入庫しました`:`${qty}個を出庫しました`);navigate('detail',p.id);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)closeSheet();});
document.querySelector('#notificationButton').addEventListener('click',()=>toast(`在庫不足の商品が ${store.products.filter(p=>p.stock<=p.minStock).length}件あります`));
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
navigate('home');
