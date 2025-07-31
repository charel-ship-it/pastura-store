// Cart array
let cart = [];

// Constants
const carttaxRate = 0.11;
const cartshippingFee = 5.00;

// Load saved cart on page load
window.onload = () => {
  const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
  cart = savedCart;
  updateCartDisplay();
};

// Add item to cart
function addToCart(productName, price, qtyInputId) {
  const qty = parseInt(document.getElementById(qtyInputId).value);
  if (!qty || qty <= 0) return alert("Invalid quantity.");

  const existing = cart.find(item => item.name === productName);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ name: productName, price: price, qty: qty });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`${productName} added (${qty}) to cart.`);
  updateCartDisplay();
}

// Calculate totals
function calculateTotals() {
  let subtotal = 0;
  cart.forEach(item => {
    subtotal += item.qty * item.price;
  });

  const tax = subtotal * carttaxRate;
  const total = subtotal + tax + cartshippingFee;

  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    shipping: cartshippingFee.toFixed(2),
    total: total.toFixed(2)
  };
}

// Update cart display
function updateCartDisplay() {
  const cartList = document.getElementById("cart-list");
  const cartTotal = document.getElementById("cart-total");

  if (!cartList || !cartTotal) return;

  cartList.innerHTML = "";
  cart.forEach(item => {
    const itemTotal = item.qty * item.price;
    const li = document.createElement("li");
    li.textContent = `• ${item.qty} × ${item.name} - $${itemTotal.toFixed(2)}`;
    cartList.appendChild(li);
  });

  const totals = calculateTotals();
  cartTotal.innerHTML = `
    <strong>Subtotal:</strong> $${totals.subtotal}<br>
    <strong>Tax (11%):</strong> $${totals.tax}<br>
    <strong>Shipping:</strong> $${totals.shipping}<br>
    <strong>Total:</strong> $${totals.total}
  `;
}

// Clear cart
function clearCart() {
  if (confirm("Are you sure you want to clear the cart?")) {
    cart = [];
    localStorage.removeItem("cart");
    updateCartDisplay();
  }
}

// Checkout via WhatsApp
function checkoutWhatsApp() {
  if (cart.length === 0) return alert("Your cart is empty.");

  let message = "Hi! I'd like to place an order:\n";
  cart.forEach(item => {
    const lineTotal = item.qty * item.price;
    message += `• ${item.qty} × ${item.name} = $${lineTotal.toFixed(2)}\n`;
  });

  const totals = calculateTotals();
  message += `\nSubtotal: $${totals.subtotal}`;
  message += `\nTax: $${totals.tax}`;
  message += `\nShipping: $${totals.shipping}`;
  message += `\nTotal: $${totals.total}`;

  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/9613509378?text=${encodedMessage}`;
  window.open(url, '_blank');
}
function checkoutWebhook() {
  if (cart.length === 0) return alert("Your cart is empty.");

  const payload = {
    cart: cart,
    totals: calculateTotals(),
    timestamp: new Date().toISOString()
  };

  fetch("https://us-central1-farmline-supply.cloudfunctions.net/shopifyWebhook/cart-created", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (res.ok) {
      alert("🛒 Cart submitted successfully to Pastura.");
    } else {
      alert("❌ Failed to send cart to server.");
    }
  })
  .catch(err => {
    console.error("Webhook error:", err);
    alert("⚠️ Error sending cart data.");
  });
}

