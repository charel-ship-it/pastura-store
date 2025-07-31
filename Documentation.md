# Pastura - Web Ordering System Documentation

## Overview

Pastura is a lightweight static e-commerce storefront using vanilla HTML/CSS/JS. It supports:
- Local product data via `products-data.js`
- Product details via `view-product.html`
- Cart-based checkout with `cart.html`
- Order sending to Firebase with `cart-created` endpoint
- Confirmation via `success.html`
- Email sending via Firebase function `sendOrderEmail()`

---

## 🔗 Project Structure

| File | Purpose |
|------|---------|
| `products-data.js` | Contains product definitions (title, image, variants, etc.) |
| `view-product.html` | Product detail page with variants, multi-images, Buy Now button |
| `cart.html` | Displays products from localStorage, allows order submission |
| `success.html` | Confirms submitted order using query param `orderId` |
| `firebase/functions/index.js` | Handles `POST /cart-created` with token verification and email sending |

---

## 🔄 Order Flow

### 1. View Product (`view-product.html`)
- Extracts product via `?productId=SHOPIFY_ID`
- Displays:
  - title
  - description
  - multiple images
  - variants dropdown
  - quantity field
- Sends POST to Firebase:
