/* =====================================================
   VALORIASMP OFFICIAL STORE — SCRIPT
   Edit products, prices and config below.
===================================================== */

/* ---------- STORE CONFIG ---------- */
/* EDIT: server info, discord link, and payment details here */
const STORE_CONFIG = {
  serverName: "ValoriaSMP",
  serverIp: "play.valoriasmp.fun",
  discordUrl: "https://discord.gg/PcC4bC69WG",
  websiteUrl: "https://www.valoriasmp.fun/",
  currency: "₹",

  // Manual payment (current setup): buyer pays via UPI/QR, then sends a
  // screenshot to staff on Discord for manual verification + delivery.
  // EDIT: your real UPI ID
  upiId: "89793398@ibl",
  // EDIT: put your real QR code image at assets/payment-qr.png
  qrImagePath: "assets/qr.png",

  // Automated gateway (optional, for later): if you connect a real payment
  // provider (Razorpay / Stripe / etc.), set this to the checkout URL and
  // the buyer will be redirected there instead of shown the manual QR step.
  paymentUrl: ""
};

/* ---------- COUPONS ---------- */
/* EDIT: add or change coupon codes here.
   discountPercent: whole number percent off the subtotal.
   expiresAt: ISO date/time — after this, the coupon stops working
   automatically. Set expiresAt to null for a coupon with no expiry. */
const COUPONS = {
  VLS3: { discountPercent: 10, expiresAt: "2026-09-20T23:59:59+05:30" }
};

/* ---------- PRODUCTS ---------- */
/* EDIT: add, remove, or change products here.
   category must be one of: ranks, bundles, perks, keys */
const PRODUCTS = [
  {
    id: "vip",
    name: "VIP",
    price: 60,
    category: "ranks",
    icon: "👑",
    description: "Your first step into Valoria's premium experience.",
    features: ["Premium rank", "Exclusive perks", "Special server features"]
  },
  {
    id: "vip-plus",
    name: "VIP+",
    price: 90,
    category: "ranks",
    icon: "🌟",
    description: "More perks, more flexibility, more Valoria.",
    features: ["Everything in VIP", "Extra homes", "Priority queue"]
  },
  {
    id: "mvp",
    name: "MVP",
    price: 120,
    category: "ranks",
    icon: "🔥",
    description: "Stand out with a rank built for regulars.",
    features: ["Everything in VIP+", "Particle effects", "Custom join message"]
  },
  {
    id: "mvp-plus",
    name: "MVP+",
    price: 170,
    category: "ranks",
    icon: "💠",
    description: "A serious upgrade for serious players.",
    features: ["Everything in MVP", "Extra kits", "Colored chat"]
  },
  {
    id: "valoria-plus",
    name: "Valoria+",
    price: 215,
    category: "ranks",
    icon: "💎",
    description: "The full Valoria experience, no compromises.",
    features: ["Everything in MVP+", "All future perks", "Highest priority support"]
  },
  {
    id: "daku-plus",
    name: "Daku+",
    price: 215,
    category: "ranks",
    icon: "🗡️",
    description: "For players who like to play a little differently.",
    features: ["Everything in MVP+", "Unique cosmetics", "Signature title"]
  },
  {
    id: "starter-bundle",
    name: "Starter Bundle",
    price: 114,
    category: "bundles",
    icon: "🎒",
    description: "Everything a new player needs to get going fast.",
    features: ["Basic rank perks", "Starter kit", "Bonus crate keys"]
  },
  {
    id: "pvp-bundle",
    name: "PvP Bundle",
    price: 164,
    category: "bundles",
    icon: "⚔️",
    description: "Gear up and get an edge in combat.",
    features: ["PvP kit", "Combat perks", "Bonus crate keys"]
  }
];

/* Renders a product's icon as its emoji. */
function productIconMarkup(p) {
  return p.icon;
}

/* Ranks shown in the comparison section, in display order */
const RANK_SHOWCASE_IDS = ["vip", "vip-plus", "mvp", "mvp-plus", "valoria-plus", "daku-plus"];
const FEATURED_RANK_ID = "valoria-plus";

/* ---------- STATE ---------- */
let cart = loadCart();
let activeFilter = "all";
let currentModalProduct = null;
let modalQty = 1;
let appliedCoupon = loadCoupon();

/* =====================================================
   INIT
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  renderRankShowcase();
  updateCartUI();
  bindNavbar();
  bindFilters();
  bindCart();
  bindProductModal();
  bindCheckout();
  bindFaq();
  bindIpCopy();
  bindBundleScrollLink();
});

/* =====================================================
   RENDER: PRODUCT GRID
===================================================== */
function renderProducts() {
  const grid = document.getElementById("productGrid");
  const list = activeFilter === "all"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeFilter);

  grid.innerHTML = list.map(p => `
    <article class="product-card" data-id="${p.id}">
      <div class="product-card-top">
        <span class="product-icon">${productIconMarkup(p)}</span>
        <span class="badge">${capitalize(p.category)}</span>
      </div>
      <h3 class="product-name">${p.name}</h3>
      <p class="product-desc">${p.description}</p>
      <ul class="product-features">
        ${p.features.map(f => `<li>${f}</li>`).join("")}
      </ul>
      <div class="product-price-row">
        <span class="product-price">${formatPrice(p.price)}</span>
      </div>
      <div class="product-card-actions">
        <button class="btn btn-outline" data-action="view" data-id="${p.id}">View details</button>
        <button class="btn btn-primary" data-action="add" data-id="${p.id}">Add to cart</button>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll("[data-action='add']").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.id, 1);
      showToast(`${getProduct(btn.dataset.id).name} added to cart`);
    });
  });

  grid.querySelectorAll("[data-action='view']").forEach(btn => {
    btn.addEventListener("click", () => openProductModal(btn.dataset.id));
  });
}

/* =====================================================
   RENDER: RANK SHOWCASE
===================================================== */
function renderRankShowcase() {
  const grid = document.getElementById("rankGrid");
  const ranks = RANK_SHOWCASE_IDS.map(getProduct).filter(Boolean);

  grid.innerHTML = ranks.map(r => {
    const featured = r.id === FEATURED_RANK_ID;
    return `
      <div class="rank-card ${featured ? "is-featured" : ""}">
        ${featured ? `<span class="rank-tag">Best value</span>` : ""}
        <h3 class="rank-name"><span class="rank-name-icon">${productIconMarkup(r)}</span> ${r.name}</h3>
        <div class="rank-price">${formatPrice(r.price)} <span>/ one-time</span></div>
        <ul class="rank-features">
          ${r.features.map(f => `<li>${f}</li>`).join("")}
        </ul>
        <button class="btn ${featured ? "btn-primary" : "btn-outline"} btn-block" data-action="add" data-id="${r.id}">Get ${r.name}</button>
      </div>
    `;
  }).join("");

  grid.querySelectorAll("[data-action='add']").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.id, 1);
      showToast(`${getProduct(btn.dataset.id).name} added to cart`);
    });
  });
}

/* =====================================================
   FILTERING
===================================================== */
function bindFilters() {
  const bar = document.getElementById("filterBar");
  bar.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter;
      bar.querySelectorAll(".filter-chip").forEach(c => {
        c.classList.toggle("is-active", c === chip);
        c.setAttribute("aria-selected", c === chip ? "true" : "false");
      });
      renderProducts();
    });
  });
}

function bindBundleScrollLink() {
  document.querySelectorAll("[data-scroll-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.scrollFilter;
      activeFilter = filter;
      document.querySelectorAll(".filter-chip").forEach(c => {
        c.classList.toggle("is-active", c.dataset.filter === filter);
        c.setAttribute("aria-selected", c.dataset.filter === filter ? "true" : "false");
      });
      renderProducts();
      document.getElementById("store").scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* =====================================================
   CART LOGIC
===================================================== */
function loadCart() {
  try {
    const raw = localStorage.getItem("valoria_cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("valoria_cart", JSON.stringify(cart));
}

function addToCart(id, qty) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, qty });
  }
  saveCart();
  updateCartUI();
}

function updateQty(id, qty) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = qty;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
}

function cartSubtotal() {
  return cart.reduce((sum, item) => {
    const p = getProduct(item.id);
    return p ? sum + p.price * item.qty : sum;
  }, 0);
}

function loadCoupon() {
  try {
    const raw = localStorage.getItem("valoria_coupon");
    if (!raw) return null;
    const code = JSON.parse(raw);
    const coupon = validateCoupon(code);
    return coupon ? code : null;
  } catch {
    return null;
  }
}

function saveCoupon() {
  if (appliedCoupon) {
    localStorage.setItem("valoria_coupon", JSON.stringify(appliedCoupon));
  } else {
    localStorage.removeItem("valoria_coupon");
  }
}

/* Checks a coupon code against COUPONS and its expiry date.
   Returns the coupon object if valid, or null if not found / expired. */
function validateCoupon(code) {
  const coupon = COUPONS[code.trim().toUpperCase()];
  if (!coupon) return null;
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) return null;
  return coupon;
}

function cartDiscount() {
  if (!appliedCoupon) return 0;
  const coupon = validateCoupon(appliedCoupon);
  if (!coupon) {
    // Coupon expired since it was applied — drop it silently.
    appliedCoupon = null;
    saveCoupon();
    return 0;
  }
  return Math.round(cartSubtotal() * (coupon.discountPercent / 100));
}

function cartTotal() {
  return Math.max(0, cartSubtotal() - cartDiscount());
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function applyCouponCode(code) {
  const coupon = validateCoupon(code);
  if (!coupon) {
    showToast("That coupon code is invalid or has expired");
    return false;
  }
  appliedCoupon = code.trim().toUpperCase();
  saveCoupon();
  showToast(`✓ Coupon applied — ${coupon.discountPercent}% off`);
  updateCartUI();
  return true;
}

function removeCoupon() {
  appliedCoupon = null;
  saveCoupon();
  updateCartUI();
}

function updateCartUI() {
  document.getElementById("cartBadge").textContent = cartCount();
  const body = document.getElementById("cartBody");

  if (cart.length === 0) {
    body.innerHTML = `<p class="cart-empty">Your cart is empty. Browse the store to add something.</p>`;
  } else {
    body.innerHTML = cart.map(item => {
      const p = getProduct(item.id);
      if (!p) return "";
      return `
        <div class="cart-item" data-id="${p.id}">
          <span class="cart-item-icon">${productIconMarkup(p)}</span>
          <div class="cart-item-info">
            <div class="cart-item-name">${p.name}</div>
            <div class="cart-item-price">${formatPrice(p.price)} each</div>
            <div class="cart-item-controls">
              <div class="qty-control">
                <button class="qty-btn" data-action="dec" aria-label="Decrease quantity">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" data-action="inc" aria-label="Increase quantity">+</button>
              </div>
              <span class="cart-item-linetotal">${formatPrice(p.price * item.qty)}</span>
            </div>
            <button class="cart-item-remove" data-action="remove">Remove</button>
          </div>
        </div>
      `;
    }).join("");

    body.querySelectorAll(".cart-item").forEach(el => {
      const id = el.dataset.id;
      const item = cart.find(i => i.id === id);
      el.querySelector("[data-action='inc']").addEventListener("click", () => updateQty(id, item.qty + 1));
      el.querySelector("[data-action='dec']").addEventListener("click", () => updateQty(id, item.qty - 1));
      el.querySelector("[data-action='remove']").addEventListener("click", () => {
        removeFromCart(id);
        showToast("Item removed from cart");
      });
    });
  }

  // Coupon + totals
  const discount = cartDiscount();
  document.getElementById("cartSubtotalRow").style.display = discount > 0 ? "flex" : "none";
  document.getElementById("cartDiscountRow").style.display = discount > 0 ? "flex" : "none";
  if (discount > 0) {
    document.getElementById("cartSubtotal").textContent = formatPrice(cartSubtotal());
    document.getElementById("cartCouponCode").textContent = appliedCoupon;
    document.getElementById("cartDiscountAmount").textContent = `-${formatPrice(discount)}`;
  }
  document.getElementById("cartTotal").textContent = formatPrice(cartTotal());
  document.getElementById("cartCouponInput").value = appliedCoupon || "";
}

function bindCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");

  document.getElementById("cartBtn").addEventListener("click", () => openCart());
  document.getElementById("cartCloseBtn").addEventListener("click", () => closeCart());
  overlay.addEventListener("click", () => closeCart());

  document.getElementById("cartClearBtn").addEventListener("click", () => {
    clearCart();
    removeCoupon();
    showToast("Cart cleared");
  });

  document.getElementById("cartCouponApplyBtn").addEventListener("click", () => {
    const input = document.getElementById("cartCouponInput");
    if (!input.value.trim()) {
      removeCoupon();
      return;
    }
    applyCouponCode(input.value);
  });

  document.getElementById("cartCheckoutBtn").addEventListener("click", () => {
    if (cart.length === 0) {
      showToast("Your cart is empty");
      return;
    }
    closeCart();
    openCheckout();
  });

  function openCart() {
    drawer.classList.add("is-open");
    overlay.classList.add("is-visible");
    drawer.setAttribute("aria-hidden", "false");
  }
  function closeCart() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-visible");
    drawer.setAttribute("aria-hidden", "true");
  }
}

/* =====================================================
   PRODUCT MODAL
===================================================== */
function openProductModal(id) {
  const p = getProduct(id);
  if (!p) return;
  currentModalProduct = p;
  modalQty = 1;

  document.getElementById("pmIcon").textContent = productIconMarkup(p);
  document.getElementById("pmBadge").textContent = capitalize(p.category);
  document.getElementById("pmName").textContent = p.name;
  document.getElementById("pmDesc").textContent = p.description;
  document.getElementById("pmFeatures").innerHTML = p.features.map(f => `<li>${f}</li>`).join("");
  document.getElementById("pmQty").textContent = modalQty;
  document.getElementById("pmPrice").textContent = formatPrice(p.price * modalQty);

  showModal("productModal", "modalOverlay");
}

function bindProductModal() {
  document.getElementById("productModalClose").addEventListener("click", () => hideModal("productModal", "modalOverlay"));
  document.getElementById("modalOverlay").addEventListener("click", () => hideModal("productModal", "modalOverlay"));

  document.getElementById("pmQtyMinus").addEventListener("click", () => {
    modalQty = Math.max(1, modalQty - 1);
    refreshModalQty();
  });
  document.getElementById("pmQtyPlus").addEventListener("click", () => {
    modalQty += 1;
    refreshModalQty();
  });

  document.getElementById("pmAddToCart").addEventListener("click", () => {
    if (!currentModalProduct) return;
    addToCart(currentModalProduct.id, modalQty);
    showToast(`${currentModalProduct.name} added to cart`);
    hideModal("productModal", "modalOverlay");
  });

  document.getElementById("pmBuyNow").addEventListener("click", () => {
    if (!currentModalProduct) return;
    addToCart(currentModalProduct.id, modalQty);
    hideModal("productModal", "modalOverlay");
    openCheckout();
  });
}

function refreshModalQty() {
  document.getElementById("pmQty").textContent = modalQty;
  document.getElementById("pmPrice").textContent = formatPrice(currentModalProduct.price * modalQty);
}

/* =====================================================
   CHECKOUT MODAL (single screen — form + QR/UPI + confirm)
===================================================== */
let currentOrderId = null;

function openCheckout() {
  if (cart.length === 0) {
    showToast("Your cart is empty");
    return;
  }
  currentOrderId = generateOrderId();
  document.getElementById("checkoutOrderId").textContent = currentOrderId;
  document.getElementById("checkoutQrImage").src = STORE_CONFIG.qrImagePath;
  document.getElementById("checkoutUpiId").textContent = STORE_CONFIG.upiId;

  // Reset to the "not yet confirmed" state each time it's opened.
  document.getElementById("checkoutConfirm").style.display = "none";
  document.getElementById("proceedPaymentBtn").style.display = "block";

  renderCheckoutSummary();
  showModal("checkoutModal", "checkoutOverlay");
}

function renderCheckoutSummary() {
  const itemsEl = document.getElementById("checkoutItems");
  itemsEl.innerHTML = cart.map(item => {
    const p = getProduct(item.id);
    if (!p) return "";
    return `<div class="order-summary-item"><span>${p.name} × ${item.qty}</span><span>${formatPrice(p.price * item.qty)}</span></div>`;
  }).join("");

  const discount = cartDiscount();
  document.getElementById("checkoutSubtotalRow").style.display = discount > 0 ? "flex" : "none";
  document.getElementById("checkoutDiscountRow").style.display = discount > 0 ? "flex" : "none";
  if (discount > 0) {
    document.getElementById("checkoutSubtotal").textContent = formatPrice(cartSubtotal());
    document.getElementById("checkoutCouponCode").textContent = appliedCoupon;
    document.getElementById("checkoutDiscountAmount").textContent = `-${formatPrice(discount)}`;
  }
  document.getElementById("checkoutTotal").textContent = formatPrice(cartTotal());
  document.getElementById("checkoutCouponInput").value = appliedCoupon || "";
}

function generateOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VAL-${stamp}-${rand}`;
}

function bindCheckout() {
  document.getElementById("checkoutModalClose").addEventListener("click", () => hideModal("checkoutModal", "checkoutOverlay"));
  document.getElementById("checkoutOverlay").addEventListener("click", () => hideModal("checkoutModal", "checkoutOverlay"));

  const form = document.getElementById("checkoutForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const mcInput = document.getElementById("mcUsername");
    const dcInput = document.getElementById("discordUsername");
    const mcError = document.getElementById("mcUsernameError");
    const dcError = document.getElementById("discordUsernameError");

    let valid = true;
    mcInput.classList.remove("is-invalid");
    dcInput.classList.remove("is-invalid");
    mcError.textContent = "";
    dcError.textContent = "";

    const mcVal = mcInput.value.trim();
    const dcVal = dcInput.value.trim();

    if (mcVal.length < 3) {
      mcInput.classList.add("is-invalid");
      mcError.textContent = "Enter your Minecraft username.";
      valid = false;
    }

    if (dcVal.length < 2) {
      dcInput.classList.add("is-invalid");
      dcError.textContent = "Enter your Discord username.";
      valid = false;
    }

    if (!valid) {
      showToast("Please fill in both fields to continue");
      return;
    }

    // If a real payment gateway URL is configured, redirect there instead
    // of showing the manual QR/confirm section.
    if (STORE_CONFIG.paymentUrl) {
      // EDIT: once a payment provider is connected, redirect or trigger it here.
      window.location.href = STORE_CONFIG.paymentUrl;
      return;
    }

    // Reveal the "screenshot + open a Discord ticket" confirmation.
    document.getElementById("proceedPaymentBtn").style.display = "none";
    document.getElementById("checkoutConfirm").style.display = "block";
    document.getElementById("checkoutConfirm").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  document.getElementById("checkoutCouponApplyBtn").addEventListener("click", () => {
    const input = document.getElementById("checkoutCouponInput");
    if (!input.value.trim()) {
      removeCoupon();
      renderCheckoutSummary();
      return;
    }
    if (applyCouponCode(input.value)) {
      renderCheckoutSummary();
    }
  });

  document.getElementById("checkoutCopyUpiBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(STORE_CONFIG.upiId);
      showToast("✓ UPI ID copied!");
    } catch {
      showToast("Couldn't copy — copy it manually");
    }
  });

  document.getElementById("checkoutDiscordBtn").addEventListener("click", () => {
    clearCart();
    hideModal("checkoutModal", "checkoutOverlay");
    showToast("Order noted — send your screenshot to staff on Discord");
  });
}

/* =====================================================
   MODAL HELPERS
===================================================== */
function showModal(modalId, overlayId) {
  document.getElementById(modalId).classList.add("is-open");
  document.getElementById(modalId).setAttribute("aria-hidden", "false");
  document.getElementById(overlayId).classList.add("is-visible");
}
function hideModal(modalId, overlayId) {
  document.getElementById(modalId).classList.remove("is-open");
  document.getElementById(modalId).setAttribute("aria-hidden", "true");
  document.getElementById(overlayId).classList.remove("is-visible");
}

/* =====================================================
   FAQ ACCORDION
===================================================== */
function bindFaq() {
  document.querySelectorAll(".faq-item").forEach(item => {
    const question = item.querySelector(".faq-question");
    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item").forEach(i => {
        i.classList.remove("is-open");
        i.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        question.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* =====================================================
   NAVBAR (mobile menu + scroll shadow)
===================================================== */
function bindNavbar() {
  const hamburger = document.getElementById("hamburger");
  const mobileNav = document.getElementById("mobileNav");

  hamburger.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    hamburger.classList.toggle("is-open", isOpen);
    hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  mobileNav.querySelectorAll(".mobile-nav-link").forEach(link => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("is-open");
      hamburger.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
}

/* =====================================================
   IP COPY
===================================================== */
function bindIpCopy() {
  const copyBtns = [document.getElementById("copyIpBtn"), document.getElementById("ctaCopyIpBtn")];
  copyBtns.forEach(btn => {
    if (!btn) return;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(STORE_CONFIG.serverIp);
      } catch {
        // Fallback for older browsers
        const el = document.createElement("textarea");
        el.value = STORE_CONFIG.serverIp;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      showToast("✓ Server IP copied!");
    });
  });
}

/* =====================================================
   TOASTS
===================================================== */
function showToast(message) {
  const stack = document.getElementById("toastStack");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 300);
  }, 2400);
}

/* =====================================================
   UTILITIES
===================================================== */
function getProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}

function formatPrice(amount) {
  return `${STORE_CONFIG.currency}${amount}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
