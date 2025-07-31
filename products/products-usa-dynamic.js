document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("products-container");
  const pagination = document.getElementById("pagination-controls");
  const categoryNav = document.getElementById("category-nav");
  const urlParams = new URLSearchParams(window.location.search);
  const selectedCategory = decodeURIComponent(urlParams.get("category") || "").trim().toLowerCase();

  let currentPage = 1;
  const productsPerPage = window.innerWidth <= 768 ? 3 : 6;
  let initialLoad = true;

  const summary = document.createElement("div");
  summary.id = "product-summary";
  summary.style.textAlign = "center";
  summary.style.padding = "1rem";
  summary.style.color = "#333";
  container.parentElement.insertBefore(summary, container);

  const loader = document.createElement("div");
  loader.id = "loader";
  loader.textContent = "Loading products...";
  loader.style.textAlign = "center";
  loader.style.padding = "2rem";
  loader.style.fontWeight = "bold";
  loader.style.fontSize = "1.2rem";
  loader.style.color = "#694040";
  container.parentElement.insertBefore(loader, container);

  // Create fixed USA Cart icon with hover effect
  const usaCart = document.createElement("a");
  usaCart.href = "cart.html?usa=true";
  usaCart.textContent = "🛒 USA Cart";
  usaCart.style.position = "fixed";
  usaCart.style.top = "50%";
  usaCart.style.left = "0";
  usaCart.style.transform = "translateY(-50%)";
  usaCart.style.background = "#694040";
  usaCart.style.color = "white";
  usaCart.style.padding = "10px 15px";
  usaCart.style.borderTopRightRadius = "8px";
  usaCart.style.borderBottomRightRadius = "8px";
  usaCart.style.fontWeight = "bold";
  usaCart.style.zIndex = "999";
  usaCart.style.textDecoration = "none";
  usaCart.style.transition = "all 0.3s ease";

  usaCart.addEventListener("mouseenter", () => {
    usaCart.style.background = "#8a5c5c";
    usaCart.style.color = "#ffd700";
  });

  usaCart.addEventListener("mouseleave", () => {
    usaCart.style.background = "#694040";
    usaCart.style.color = "white";
  });

  document.body.appendChild(usaCart);

  // Flag cart as USA mode
  localStorage.setItem("usaMode", "true");

  const usaProducts = products.filter((p) => {
    const origin = (p.countryOfOrigin || "").toLowerCase();
    return origin.includes("usa") || origin.includes("united states");
  });

  const categories = [...new Set(usaProducts.map((p) => p.category))].sort();
  if (categoryNav) {
    categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.textContent = cat;
      btn.className = "category-button";
      if (cat.toLowerCase() === selectedCategory) btn.classList.add("active");
      btn.onclick = () => {
        location.replace(`products-usa.html?category=${encodeURIComponent(cat)}#products-container`);
      };
      categoryNav.appendChild(btn);
    });
  }

  const filteredProducts = selectedCategory
    ? usaProducts.filter((p) => p.category && p.category.toLowerCase() === selectedCategory)
    : usaProducts;

  function render(productsToRender) {
    container.innerHTML = "";

    if (productsToRender.length === 0) {
      container.innerHTML = "<p style='text-align:center; padding:2rem; color:#694040;'>No products found in this category.</p>";
      loader.style.display = "none";
      summary.textContent = "";
      return;
    }

    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsToRender.length;
    summary.textContent = `Showing ${start + 1}–${start + productsToRender.length} of ${filteredProducts.length} products`;

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

    if (initialLoad) {
      loader.style.display = "none";
      initialLoad = false;
    }
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

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.textContent = i;
      if (i === currentPage) {
        pageBtn.classList.add("active-page");
      }
      pageBtn.onclick = () => {
        currentPage = i;
        renderProducts();
      };
      pagination.appendChild(pageBtn);
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

  document.addEventListener("DOMContentLoaded", function () {
    // تأكد من وجود firebase قبل المتابعة
    if (typeof firebase === "undefined" || !firebase.auth) {
      console.error("❗ Firebase is not loaded or initialized properly.");
      return;
    }

    const buyNowButtons = document.querySelectorAll(".buy-now-button");

    buyNowButtons.forEach(button => {
      button.addEventListener("click", () => {
        try {
          const user = firebase.auth().currentUser;

          if (!user) {
            // المستخدم غير مسجّل الدخول
            window.location.href = "/auth.html";
            return;
          }
          

          // قراءة بيانات المنتج من الزر
          const encodedProduct = button.getAttribute("data-product");
          const product = JSON.parse(decodeURIComponent(encodedProduct));

          // استدعاء الدالة لمعالجة الطلب
          if (typeof sendToPasturaSystem === "function") {
            sendToPasturaSystem(product);
          } else {
            console.warn("⚠️ sendToPasturaSystem function not defined.");
          }

        } catch (err) {
          console.error("🚨 Error processing Buy Now button:", err);
        }
      });
    });
  });
 function handleBuyNow(button) {
  const user = firebase.auth().currentUser;
  const encodedProduct = button.getAttribute("data-product");

  if (!encodedProduct) {
    alert("❗ Missing product data.");
    return;
  }

  if (!user) {
    // إذا لم يكن مسجلاً الدخول، نحفظ الرابط المطلوب
    localStorage.setItem("redirectAfterLogin", `/products/checkout.html?product=${encodedProduct}`);
    window.location.href = "/auth.html";
    return;
  }

  // إذا كان مسجلاً الدخول، نأخذه إلى صفحة الشراء
  window.location.href = `/products/checkout.html?product=${encodedProduct}`;
}

// ربط زر الشراء عند الضغط
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("buy-now-button")) {
    handleBuyNow(event.target);
  }
});
