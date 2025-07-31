document.addEventListener("DOMContentLoaded", () => {
  // ✅ زر الرجوع إلى صفحة المنتجات
  const backBtn = document.getElementById("back-to-products-btn");
  if (backBtn) {
    const originPage = new URLSearchParams(window.location.search).get("originPage") || "products-china.html";
    backBtn.setAttribute("href", originPage);
  }

  // تابع تحميل المنتج وباقي الكود هنا...


  
  
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("productId");
  const product = products.find(p => p.shopifyId === productId);
  

  if (!product) {
    document.getElementById("product-title").textContent = "Product Not Found";
    return;
  }

  document.getElementById("product-title").textContent = product.viewTitle || product.title;
  document.getElementById("product-price").textContent = "$" + product.price;

  // الصور
  const fullContainer = document.getElementById("full-image-container");
  const gallery = document.getElementById("product-gallery");

  if (product.fullSizeImage) {
    const fullImage = document.createElement("img");
    fullImage.src = product.fullSizeImage;
    fullImage.alt = product.title;
    fullImage.classList.add("full-size", "zoomable-image"); // ✅
    fullContainer.appendChild(fullImage);
  }

  if (product.gallery && product.gallery.length) {
    product.gallery.forEach(imgUrl => {
      if (imgUrl === product.fullSizeImage) return;
      const image = document.createElement("img");
      image.src = imgUrl;
      image.alt = product.title;
      image.classList.add("zoomable-image"); // ✅
      gallery.appendChild(image);
    });
  } else {
    const fallbackImage = document.createElement("img");
    fallbackImage.src = product.image;
    fallbackImage.alt = product.title;
    fallbackImage.classList.add("zoomable-image"); // ✅
    gallery.appendChild(fallbackImage);
  }

  // تعبئة تبويبي الوصف والمواصفات
  const descEl = document.getElementById("description");
  const specsEl = document.getElementById("specs");

  if (descEl) {
    descEl.innerHTML = product.viewDescription || product.description || "No description available.";
  }

  if (specsEl) {
    if (Array.isArray(product.specifications)) {
      const table = document.createElement("table");
      product.specifications.forEach(spec => {
        const row = document.createElement("tr");
        const label = document.createElement("td");
        label.textContent = spec.label;
        const value = document.createElement("td");
        value.textContent = spec.value;
        row.appendChild(label);
        row.appendChild(value);
        table.appendChild(row);
      });
      specsEl.appendChild(table);
    } else if (typeof product.specifications === "string" && product.specifications.trim().startsWith("<")) {
      specsEl.innerHTML = product.specifications;
    } else if (typeof product.specifications === "string") {
      specsEl.textContent = product.specifications;
    } else {
      specsEl.textContent = "No specifications provided.";
    }
  }

  // Variants
  const variantContainer = document.getElementById("variant-container");
  if (product.variants && product.variants.length) {
    const select = document.createElement("select");
    product.variants.forEach(v => {
      const option = document.createElement("option");
      option.value = v;
      option.textContent = v;
      select.appendChild(option);
    });
    variantContainer.appendChild(select);
  }

  // التبويبات (Tabs)
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabPanels.forEach(panel => panel.classList.remove('active'));
  document.getElementById("description").classList.add("active");

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      const targetPanel = document.getElementById(tabId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Add to Cart
  document.getElementById("add-to-cart-btn").onclick = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingProduct = cart.find(item => item.title === product.title);

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.push({
        title: product.title,
        price: product.price,
        image: product.image,
        currency: "USD",
        quantity: 1
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("✅ Added to cart!");
  };

  // Buy Now
  document.getElementById("buy-now-btn").onclick = () => {
    const payload = {
      items: [{
        name: product.title,
        imageUrl: product.image,
        productUrl: window.location.href,
        origin: product.countryOfOrigin || "unknown",
        shopifyId: product.shopifyId || "",
        quantity: 1,
        price: product.price || 0
      }],
      subtotal: parseFloat(product.price || 0),
      tax: 0,
      shipping: 5,
      total: parseFloat(product.price || 0) + 5
    };

    fetch("https://us-central1-farmline-supply.cloudfunctions.net/pasturaApi/cart-created", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pastura-token": "secure_pastura_token"
      },
      body: JSON.stringify(payload)
    }).then(res => {
      if (res.ok) {
        alert("✅ Order sent to Pastura!");
        localStorage.removeItem("cart");
      } else {
        alert("❌ Failed to send order.");
      }
    }).catch(() => {
      alert("⚠️ Network error. Try again.");
    });
  };

  // تحميل مكتبة التكبير
  const zoomScript = document.createElement("script");
  zoomScript.src = "https://cdn.jsdelivr.net/npm/medium-zoom@1.0.6/dist/medium-zoom.min.js";
  zoomScript.onload = () => {
    mediumZoom('.zoomable-image', {
      margin: 24,
      background: '#000'
    });
  };
  document.head.appendChild(zoomScript);
});