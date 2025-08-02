// ✅ ملف JavaScript لعرض المنتجات الأميركية في Pastura

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("products-container");
  const pagination = document.getElementById("pagination-controls");
  const categoryNav = document.getElementById("category-nav");
  const urlParams = new URLSearchParams(window.location.search);
  const selectedCategory = decodeURIComponent(urlParams.get("category") || "").trim().toLowerCase();

  let currentPage = 1;
  const productsPerPage = window.innerWidth <= 768 ? 3 : 6;

  const shopifyClient = ShopifyBuy.buildClient({
    domain: 'pastura-store.myshopify.com',
    storefrontAccessToken: '0982934c3fb6f81291e9012b14b06a30'
  });

  const usaProducts = products.filter((p) => {
    const origin = (p.countryOfOrigin || "").toLowerCase();
    return origin.includes("usa");
  });

  const categories = [...new Set(usaProducts.map((p) => p.category))].sort();
  if (categoryNav) {
    categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.textContent = cat;
      btn.className = "category-button";
      if (cat.toLowerCase() === selectedCategory) btn.classList.add("active");
      btn.onclick = () => {
        window.location.href = `products-usa.html?category=${encodeURIComponent(cat)}#products-container`;
      };
      categoryNav.appendChild(btn);
    });
  }

  const filteredProducts = selectedCategory
    ? usaProducts.filter((p) => p.category && p.category.toLowerCase() === selectedCategory)
    : usaProducts;

  function render(productsToRender) {
    container.innerHTML = "";

    productsToRender.forEach((product) => {
      const div = document.createElement("div");
      div.className = "product-wrapper";
      div.innerHTML = `
        <div class="product-info">
          <h2 class="product-title">${product.title}</h2>
          <p class="product-description">${product.description}</p>
        </div>
        <div class="product-image-wrapper">
          <img src="${product.image}" alt="${product.title}" class="custom-image" />
        </div>
        <div class="product-extra">
          <span class="custom-price">$${product.price || "N/A"}</span>
         <a href="view-product.html?productId=${product.shopifyId}&originPage=products-usa.html" class="view-product-button">View Product</a>

          <button class="buy-now-button"
            data-product="${encodeURIComponent(JSON.stringify(product))}">
            Buy Now
          </button>
        </div>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll(".buy-now-button").forEach(button => {
      button.addEventListener("click", () => handleBuyNow(button));
    });
  }

  function renderPaginationControls(total) {
    pagination.innerHTML = "";
    const totalPages = Math.ceil(total / productsPerPage);
    if (totalPages <= 1) return;

    if (currentPage > 1) {
      const prev = document.createElement("button");
      prev.textContent = "Previous";
      prev.onclick = () => {
        currentPage--;
        renderProducts();
      };
      pagination.appendChild(prev);
    }

    const showAll = document.createElement("button");
    showAll.textContent = "Show All";
    showAll.onclick = () => {
      currentPage = 1;
      renderAllProducts();
    };
    pagination.appendChild(showAll);

    if (currentPage < totalPages) {
      const next = document.createElement("button");
      next.textContent = "Next";
      next.onclick = () => {
        currentPage++;
        renderProducts();
      };
      pagination.appendChild(next);
    }
  }

  function renderAllProducts() {
    render(filteredProducts);
    pagination.innerHTML = "";
  }

  function renderProducts() {
    const start = (currentPage - 1) * productsPerPage;
    const paginatedProducts = filteredProducts.slice(start, start + productsPerPage);
    render(paginatedProducts);
    renderPaginationControls(filteredProducts.length);
  }

  renderProducts();
});

function handleBuyNow(button) {
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "/auth.html";
      return;
    }

    const encodedProduct = button.getAttribute("data-product");
    const success = await sendToPasturaSystemFromEncoded(encodedProduct);

    if (success) {
      window.location.href = "/products/checkout.html";
    }
  });
}

async function sendToPasturaSystemFromEncoded(encodedProduct) {
  const product = JSON.parse(decodeURIComponent(encodedProduct));

  const payload = {
    orderId: crypto.randomUUID(),
    items: [{
      name: product.title,
      imageUrl: product.image,
      productUrl: product.productPage || "#",
      origin: product.countryOfOrigin || "unknown",
      shopifyId: product.shopifyId || "",
      quantity: product.quantity || 1,
      price: product.price || 0
    }],
    subtotal: parseFloat(product.price || 0),
    tax: 0,
    shipping: 5,
    total: parseFloat(product.price || 0) + 5
  };

  try {
    const res = await fetch("https://us-central1-farmline-supply.cloudfunctions.net/pasturaApi/cart-created", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pastura-token": "secure_pastura_token"
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("✅ Order sent to Pastura!");
      localStorage.removeItem("cart");
      localStorage.setItem("lastCheckoutProduct", JSON.stringify(payload));
      return true;
    } else {
      const errorText = await res.text();
      console.error("🔴 Server responded 400:", errorText);
      alert("❌ Failed to send order. Error: " + errorText);
      return false;
    }
  } catch (err) {
    console.error("⚠️ Network error:", err);
    alert("⚠️ Network error. Try again.");
    return false;
  }
}
