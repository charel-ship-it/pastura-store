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

  // ✅ إنشاء مؤشر تحميل
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.textContent = "Loading products...";
  loader.style.textAlign = "center";
  loader.style.padding = "2rem";
  loader.style.fontWeight = "bold";
  loader.style.fontSize = "1.2rem";
  loader.style.color = "#694040";
  container.parentElement.insertBefore(loader, container);

  const shopifyClient = ShopifyBuy.buildClient({
    domain: 'wxwk0a-84.myshopify.com',
    storefrontAccessToken: '0982934c3fb6f81291e9012b14b06a30'
  });

  const chineseProducts = products.filter((p) => {
    const origin = (p.countryOfOrigin || "").toLowerCase();
    return origin.includes("china");
  });

  const categories = [...new Set(chineseProducts.map((p) => p.category))].sort();
  if (categoryNav) {
    categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.textContent = cat;
      btn.className = "category-button";
      if (cat.toLowerCase() === selectedCategory) btn.classList.add("active");
      btn.onclick = () => {
        location.replace(`products-preview-china.html?category=${encodeURIComponent(cat)}#products-container`);
      };
      categoryNav.appendChild(btn);
    });
  }

  const filteredProducts = selectedCategory
    ? chineseProducts.filter((p) => p.category && p.category.toLowerCase() === selectedCategory)
    : chineseProducts;

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
          <div id="${product.htmlId}" data-requires-shopify="true"></div>
        </div>
         <div class="product-extra">
   
   <a href="../auth-preview.html" class="view-product-button" target="_blank">View Product</a>

  </div>
      `;
      container.appendChild(div);
    });

    if (initialLoad) {
      loader.style.display = "none";
      initialLoad = false;
    }

    ShopifyBuy.UI.onReady(shopifyClient).then((ui) => {
      productsToRender.forEach((product) => {
        const node = document.getElementById(product.htmlId);
        if (node) {
          ui.createComponent("product", {
            id: product.shopifyId,
            node: node,
            moneyFormat: "%24%7B%7Bamount%7D%7D",
            options: {
              product: {
                buttonDestination: "modal",
                text: { button: "View Product" },
                contents: {
                  title: false,
                  button: false,
                  options: false,
                  price: true,
                  images: true
                }
              },
              modalProduct: {
                contents: {
                  img: true,
                  title: true,
                  price: true,
                  button: true,
                  description: true
                }
              },
              cart: { startOpen: false },
              toggle: { sticky: true }
            }
          });
        }
      });
    });
  }

  function renderPaginationControls(total) {
    console.log("Rendering pagination for", total, "products");
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
    console.log("Selected Category:", selectedCategory);
    console.log("Filtered Products:", filteredProducts.length);
    console.log("Current Page:", currentPage);
    console.log("Products Per Page:", productsPerPage);

    const start = (currentPage - 1) * productsPerPage;
    const paginatedProducts = filteredProducts.slice(start, start + productsPerPage);

    console.log("Paginated Products:", paginatedProducts.length);
    render(paginatedProducts);
    renderPaginationControls(filteredProducts.length);
  }

  renderProducts();
});

function loadShopifyBuyIfNeeded() {
  const trigger = document.querySelector('[data-requires-shopify="true"]');

  if (trigger) {
    const script = document.createElement("script");
    script.src = "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";
    script.async = true;

    document.head.appendChild(script);
  }
}

loadShopifyBuyIfNeeded();
