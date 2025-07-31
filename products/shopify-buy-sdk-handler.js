console.log("✅ Shopify Buy SDK Handler Loaded");

// إعداد Shopify Client
const client = ShopifyBuy.buildClient({
  domain: 'wxwk0a-84.myshopify.com',
  storefrontAccessToken: 'd5431b21315dd897df7f5ca69ed2b61c',
});

// تحديد المتغيرات الأساسية
let checkout;
let cartItems = [];

// إنشاء checkout جديد عند بداية الصفحة
client.checkout.create().then((newCheckout) => {
  checkout = newCheckout;
  console.log("🛒 Checkout created:", checkout.id);
});

// دالة لإضافة منتج إلى السلة
function addToCart(variantId, quantity = 1) {
  const lineItemsToAdd = [{ variantId, quantity }];
  client.checkout.addLineItems(checkout.id, lineItemsToAdd).then((checkout) => {
    console.log("🛒 Updated Checkout:", checkout);
    window.location.href = checkout.webUrl; // فتح صفحة الدفع مباشرة
  });
}
