/* ==========================================================
   VALORIASMP STORE V2
   EDIT ONLY THE CONFIG + PRODUCTS SECTION.
   ========================================================== */

const CONFIG = {
  serverName: "ValoriaSMP",
  serverIp: "play.valoriasmp.fun",
  discord: "https://discord.gg/PcC4bC69WG",

  // >>> PUT YOUR REAL UPI ID HERE <<<
  upiId: "yourupi@bank",

  currency: "₹",
  coupon: { code: "VLS3", percent: 10, expires: "2026-09-20T23:59:59+05:30" }
};

const PRODUCTS = [
  {id:"vip",name:"VIP",price:60,category:"ranks",icon:"👑",desc:"Your first step into Valoria's premium experience.",features:["Premium rank","Exclusive perks","Special server features"]},
  {id:"vip-plus",name:"VIP+",price:90,category:"ranks",icon:"🌟",desc:"More perks, more flexibility, more Valoria.",features:["Everything in VIP","Extra homes","Priority queue"]},
  {id:"mvp",name:"MVP",price:120,category:"ranks",icon:"🔥",desc:"Stand out with a rank built for regulars.",features:["Everything in VIP+","Particle effects","Custom join message"]},
  {id:"mvp-plus",name:"MVP+",price:170,category:"ranks",icon:"💠",desc:"A serious upgrade for serious players.",features:["Everything in MVP","Extra kits","Colored chat"]},
  {id:"valoria-plus",name:"Valoria+",price:215,category:"ranks",icon:"💎",desc:"The full Valoria experience, no compromises.",features:["Everything in MVP+","All future perks","Highest priority support"]},
  {id:"daku-plus",name:"Daku+",price:215,category:"ranks",icon:"🗡️",desc:"For players who like to play differently.",features:["Everything in MVP+","Unique cosmetics","Signature title"]},
  {id:"starter-bundle",name:"Starter Bundle",price:114,category:"bundles",icon:"🎒",desc:"Everything a new player needs to get going fast.",features:["Basic rank perks","Starter kit","Bonus crate keys"]},
  {id:"pvp-bundle",name:"PvP Bundle",price:164,category:"bundles",icon:"⚔️",desc:"Gear up and get an edge in combat.",features:["PvP kit","Combat perks","Bonus crate keys"]}
];

let cart = JSON.parse(localStorage.getItem("vls_cart") || "[]");
let filter = "all";
let couponApplied = localStorage.getItem("vls_coupon") || "";
let modalProduct = null, modalQty = 1;
let currentOrder = null;

const $ = id => document.getElementById(id);
const money = n => CONFIG.currency + Math.round(n);
const product = id => PRODUCTS.find(p => p.id === id);

function save(){ localStorage.setItem("vls_cart", JSON.stringify(cart)); }
function count(){ return cart.reduce((a,i)=>a+i.qty,0); }
function subtotal(){ return cart.reduce((a,i)=>a + (product(i.id)?.price || 0)*i.qty,0); }
function validCoupon(){
  if(!couponApplied) return null;
  if(couponApplied.toUpperCase() !== CONFIG.coupon.code) return null;
  if(CONFIG.coupon.expires && new Date() > new Date(CONFIG.coupon.expires)) return null;
  return CONFIG.coupon;
}
function discount(){ const c=validCoupon(); return c ? Math.round(subtotal()*c.percent/100) : 0; }
function total(){ return Math.max(0, subtotal()-discount()); }
function show(id){ $(id).classList.add("open"); document.body.classList.add("locked"); }
function hide(id){ $(id).classList.remove("open"); if(!document.querySelector(".modal-wrap.open") && !$("cartDrawer").classList.contains("open")) document.body.classList.remove("locked"); }
function toast(msg){ const e=document.createElement("div"); e.className="toast"; e.textContent=msg; $("toastStack").appendChild(e); setTimeout(()=>e.remove(),2600); }

function renderProducts(){
  const list = filter==="all" ? PRODUCTS : PRODUCTS.filter(p=>p.category===filter);
  $("products").innerHTML = list.map(p=>`
    <article class="product-card ${p.id==="valoria-plus"?"featured":""}">
      ${p.id==="valoria-plus"?'<span class="featured-tag">BEST VALUE</span>':''}
      <div class="pc-top"><span class="pc-icon">${p.icon}</span><span class="pill">${p.category}</span></div>
      <h3>${p.name}</h3><p>${p.desc}</p>
      <ul>${p.features.slice(0,3).map(x=>`<li>✓ ${x}</li>`).join("")}</ul>
      <div class="pc-bottom"><strong>${money(p.price)}</strong><button class="btn primary" data-buy="${p.id}">Add to cart</button></div>
      <button class="details" data-view="${p.id}">View details →</button>
    </article>`).join("");
  document.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>add(b.dataset.buy));
  document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>openProduct(b.dataset.view));
}

function renderRanks(){
  const ranks=PRODUCTS.filter(p=>p.category==="ranks");
  $("rankTable").innerHTML=ranks.map((p,i)=>`
    <div class="rank-row ${i===4?"highlight":""}">
      <div><span class="rank-icon">${p.icon}</span><b>${p.name}</b>${i===4?'<em>Recommended</em>':''}</div>
      <span>${p.features[0]}</span><span>${p.features[1]}</span><strong>${money(p.price)}</strong>
      <button class="mini-buy" data-rank="${p.id}">Get</button>
    </div>`).join("");
  document.querySelectorAll("[data-rank]").forEach(b=>b.onclick=()=>add(b.dataset.rank));
}

function add(id,qty=1){
  const item=cart.find(x=>x.id===id);
  if(item) item.qty+=qty; else cart.push({id,qty});
  save(); renderCart(); toast(`${product(id).name} added to cart`);
}
function remove(id){ cart=cart.filter(x=>x.id!==id); save(); renderCart(); }
function change(id,delta){
  const x=cart.find(i=>i.id===id); if(!x)return;
  x.qty+=delta; if(x.qty<1) remove(id); else {save();renderCart();}
}
function renderCart(){
  $("cartBadge").textContent=count();
  if(!cart.length){
    $("cartItems").innerHTML=`<div class="empty-cart"><div>🛒</div><h3>Your cart is empty</h3><p>Add a rank or bundle to get started.</p><a href="#store" class="btn primary" id="shopNow">Browse store</a></div>`;
    $("shopNow")?.addEventListener("click",()=>hideCart());
  }else{
    $("cartItems").innerHTML=cart.map(i=>{const p=product(i.id);return `
      <div class="cart-item"><div class="cart-item-icon">${p.icon}</div><div class="cart-item-main"><div><b>${p.name}</b><button class="remove" data-remove="${p.id}">Remove</button></div>
      <small>${money(p.price)} each</small><div class="cart-controls"><button data-dec="${p.id}">−</button><span>${i.qty}</span><button data-inc="${p.id}">+</button><strong>${money(p.price*i.qty)}</strong></div></div></div>`}).join("");
    document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>remove(b.dataset.remove));
    document.querySelectorAll("[data-dec]").forEach(b=>b.onclick=()=>change(b.dataset.dec,-1));
    document.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>change(b.dataset.inc,1));
  }
  const d=discount();
  $("subtotal").textContent=money(subtotal()); $("total").textContent=money(total());
  $("discountLine").hidden=!d; $("discount").textContent="-"+money(d);
  $("coupon").value=couponApplied;
}

function openProduct(id){
  const p=product(id); if(!p)return; modalProduct=p; modalQty=1;
  $("pmIcon").textContent=p.icon;$("pmCategory").textContent=p.category;$("pmName").textContent=p.name;$("pmDesc").textContent=p.desc;
  $("pmFeatures").innerHTML=p.features.map(x=>`<li>${x}</li>`).join(""); $("pmQty").textContent=1;$("pmPrice").textContent=money(p.price);
  show("productWrap");
}
function updateModal(){ $("pmQty").textContent=modalQty; $("pmPrice").textContent=money(modalProduct.price*modalQty); }

function openCheckout(){
  if(!cart.length){toast("Your cart is empty");return;}
  $("checkoutOrder").innerHTML=cart.map(i=>{const p=product(i.id);return `<div><span>${p.icon} ${p.name} × ${i.qty}</span><b>${money(p.price*i.qty)}</b></div>`}).join("");
  $("checkoutTotal").textContent=money(total());
  show("checkoutWrap");
}
function makeOrder(){
  const now=new Date(); const id="VLS-"+String(now.getTime()).slice(-6);
  currentOrder={id,mc:$("mcName").value.trim(),discord:$("dcName").value.trim(),total:total(),items:cart.map(i=>({id:i.id,qty:i.qty}))};
  $("payAmount").textContent=money(currentOrder.total); $("orderId").textContent=id; $("upiId").textContent=CONFIG.upiId;
  const uri=`upi://pay?pa=${encodeURIComponent(CONFIG.upiId)}&pn=${encodeURIComponent(CONFIG.serverName)}&am=${currentOrder.total}&cu=INR&tn=${encodeURIComponent(id)}`;
  $("qr").innerHTML="";
  if(window.QRCode && CONFIG.upiId!=="yourupi@bank") new QRCode($("qr"),{text:uri,width:210,height:210,colorDark:"#111111",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});
  else $("qr").innerHTML=`<div class="qr-placeholder">Add your real UPI ID in <b>script.js</b><br>to generate the payment QR.</div>`;
  hide("checkoutWrap"); show("paymentWrap");
}
function ticketMessage(){
  const lines=currentOrder.items.map(i=>{const p=product(i.id);return `• ${p.name} × ${i.qty} — ${money(p.price*i.qty)}`}).join("\n");
  return `🎟️ **ValoriaSMP Store Purchase**
Order ID: ${currentOrder.id}
Minecraft Username: ${currentOrder.mc}
Discord Username: ${currentOrder.discord || "Not provided"}

**Items**
${lines}

**Total Paid:** ${money(currentOrder.total)}

I have attached:
1. Cart / order screenshot
2. Payment screenshot

Please verify my payment and deliver the purchase.`;
}

function hideCart(){ $("cartDrawer").classList.remove("open"); $("cartBackdrop").classList.remove("open"); if(!document.querySelector(".modal-wrap.open"))document.body.classList.remove("locked"); }
function showCart(){ $("cartDrawer").classList.add("open"); $("cartBackdrop").classList.add("open"); document.body.classList.add("locked"); }

document.addEventListener("DOMContentLoaded",()=>{
  $("upiId").textContent=CONFIG.upiId;
  renderProducts();renderRanks();renderCart();

  $("filters").addEventListener("click",e=>{if(e.target.tagName!=="BUTTON")return;document.querySelectorAll("#filters button").forEach(b=>b.classList.remove("active"));e.target.classList.add("active");filter=e.target.dataset.filter;renderProducts();});
  $("cartBtn").onclick=showCart;$("closeCart").onclick=hideCart;$("cartBackdrop").onclick=hideCart;
  $("clearCart").onclick=()=>{cart=[];couponApplied="";localStorage.removeItem("vls_coupon");save();renderCart();toast("Cart cleared");};
  $("applyCoupon").onclick=()=>{const v=$("coupon").value.trim().toUpperCase();if(v===CONFIG.coupon.code && (!CONFIG.coupon.expires||new Date()<new Date(CONFIG.coupon.expires))){couponApplied=v;localStorage.setItem("vls_coupon",v);renderCart();toast("✓ Coupon applied");}else{couponApplied="";localStorage.removeItem("vls_coupon");renderCart();toast("Invalid or expired coupon");}};
  $("checkoutBtn").onclick=()=>{hideCart();openCheckout();};

  $("pmMinus").onclick=()=>{modalQty=Math.max(1,modalQty-1);updateModal()};$("pmPlus").onclick=()=>{modalQty++;updateModal()};
  $("pmAdd").onclick=()=>{add(modalProduct.id,modalQty);hide("productWrap")};
  $("pmBuy").onclick=()=>{add(modalProduct.id,modalQty);hide("productWrap");hideCart();openCheckout()};

  $("payBtn").onclick=()=>{
    if(!$("mcName").value.trim()){toast("Enter your Minecraft username");$("mcName").focus();return;}
    makeOrder();
  };
  $("copyUpi").onclick=()=>copy(CONFIG.upiId,"UPI ID copied!");
  $("copyIp").onclick=()=>copy(CONFIG.serverIp,"Server IP copied!");

  $("paidBtn").onclick=()=>{
    if(!currentOrder)return;
    $("ticketText").value=ticketMessage();hide("paymentWrap");show("ticketWrap");
  };
  $("copyTicket").onclick=()=>copy($("ticketText").value,"Ticket message copied!");
  $("doneBtn").onclick=()=>{hide("ticketWrap");cart=[];save();renderCart();};

  document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>hide(b.dataset.close));
  document.querySelectorAll(".modal-wrap").forEach(w=>w.addEventListener("click",e=>{if(e.target===w)hide(w.id)}));

  document.querySelectorAll(".nav a").forEach(a=>a.onclick=()=>document.querySelector(".nav").classList.remove("menu-open"));
});

async function copy(text,msg){
  try{await navigator.clipboard.writeText(text);toast(msg);}
  catch{const t=document.createElement("textarea");t.value=text;document.body.appendChild(t);t.select();document.execCommand("copy");t.remove();toast(msg);}
}
