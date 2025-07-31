// products-usa-script.js

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("products-container");
  const pagination = document.getElementById("pagination-controls");
  const urlParams = new URLSearchParams(window.location.search);
  const selectedCategory = decodeURIComponent(urlParams.get("category") || "").trim().toLowerCase();

  let currentPage = 1;
  let productsPerPage = window.innerWidth <= 768 ? 3 : 6; // ✅ تم تغيير const إلى let

  // ✅ تعريف shopifyClient (إن وُجد)
  const shopifyClient = ShopifyBuy.buildClient({
    domain: 'pastura-store.myshopify.com',
    storefrontAccessToken: '0982934c3fb6f81291e9012b14b06a30' // استبدل هذا لاحقًا بالتوكن الحقيقي
  });

  // ✅ تصفية المنتجات الأميركية فقط
  const usaProducts = products.filter(p => {
    const origin = (p.countryOfOrigin || "").toLowerCase();
    return origin.includes("usa") || origin.includes("united states");
  });

  function renderProducts() {
    container.innerHTML = "";
    let filtered = [...usaProducts];

    if (selectedCategory) {
      filtered = filtered.filter(p => (p.category || "").toLowerCase().includes(selectedCategory));
    }

    const totalPages = Math.ceil(filtered.length / productsPerPage);
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const pageItems = filtered.slice(start, end);

    pageItems.forEach(product => {
      const productDiv = document.createElement("div");
      productDiv.className = "product-card";
      productDiv.innerHTML = `
        <div class="shopify-product" id="${product.htmlId}"></div>
        <div class="internal-product">
          <div class="product-image">
            <img src="${product.image}" alt="${product.title}" />
          </div>
          <div class="product-info">
            <h3>${product.title}</h3>
            <p class="product-price">$${product.price}</p>
           <a href="view-product.html?productId=${product.shopifyId}&originPage=products-usa.html">View Product</a>

          </div>
        </div>
      `;
      container.appendChild(productDiv);

      if (product.shopifyId && product.htmlId) {
        ShopifyBuy.UI.onReady(shopifyClient).then(ui => {
          ui.createComponent('product', {
            id: product.shopifyId,
            node: document.getElementById(product.htmlId),
            moneyFormat: '%24%7B%7Bamount%7D%7D',
            options: {
              product: {
                iframe: false,
                templates: {
                  button: '<button class="buy-btn">Buy Now</button>'
                }
              },
              cart: { startOpen: false },
              toggle: { sticky: false }
            }
          });
        });
      }
    });

    renderPagination(totalPages, filtered);
  }

  function renderPagination(totalPages, filtered) {
    pagination.innerHTML = "";
    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
      currentPage--;
      renderProducts();
    };
    pagination.appendChild(prevBtn);

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
      currentPage++;
      renderProducts();
    };
    pagination.appendChild(nextBtn);

    const showAllBtn = document.createElement("button");
    showAllBtn.textContent = "Show All";
    showAllBtn.onclick = () => {
      productsPerPage = filtered.length;
      currentPage = 1;
      renderProducts();
    };
    pagination.appendChild(showAllBtn);
  }

  renderProducts();
});
