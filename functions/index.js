require("dotenv").config();

// ✅ Pastura Firebase Function Entry
const functions = require("firebase-functions");
const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const { sendOrderEmail } = require("./email"); // تأكد من وجود هذا الملف

// ✅ إعداد Express app
const app = express();

// ✅ تفعيل CORS للـ Frontend فقط
app.use(cors({
  origin: [
    "https://www.pasturafarmstore.com",
    "https://farmline-supply.netlify.app"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-pastura-token"]
}));

// ✅ الرد على Preflight Requests (CORS OPTIONS)
app.options("/cart-created", cors());

// ✅ تحليل JSON
app.use(express.json());

// ✅ إعداد المتغيرات
const SHOPIFY_SECRET = "9d58596fd0efd44d2b561d4fd90a30c789aff008557785aa7000de7854aaa2ed";
const INTERNAL_TOKEN = "secure_pastura_token"; // يجب أن يطابق ما في الموقع

// ✅ صفحة فحص جاهزية
app.get("/", (req, res) => {
  res.send("✅ Pastura Webhook is running.");
});

// ✅ Webhook من Shopify (للاستخدام لاحقًا)
app.post("/shopify-webhook", (req, res) => {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"];
  const hash = crypto
    .createHmac("sha256", SHOPIFY_SECRET)
    .update(req.rawBody || JSON.stringify(req.body), "utf8")
    .digest("base64");

  if (hash !== hmacHeader) {
    console.error("❌ Invalid HMAC verification");
    return res.status(401).send("Unauthorized");
  }

  const event = req.body;
  console.log("✅ Received Shopify Webhook:", event);
  res.status(200).send("Webhook processed successfully");
});

// ✅ استقبال طلبات زر Buy Now من Pastura
// ✅ أعلى الملف خارج app.post (مرة واحدة فقط)
const recentOrders = new Set();

// ✅ الكود الكامل الجديد
app.post("/cart-created", async (req, res) => {
  const token = req.headers["x-pastura-token"];

  if (token !== INTERNAL_TOKEN) {
    console.log("🚫 Unauthorized request: Invalid token");
    return res.status(403).json({ error: "Unauthorized" });
  }

  const orderData = req.body;
  const orderId = orderData.orderId;

  if (!orderId) {
    return res.status(400).json({ error: "Missing order ID" });
  }

  // ✅ تحقق من التكرار
  if (recentOrders.has(orderId)) {
    console.log(`⚠️ Duplicate order attempt blocked: ${orderId}`);
    return res.status(409).json({ error: "Duplicate order" });
  }

  // ✅ أضف الـ orderId إلى الذاكرة المؤقتة
  recentOrders.add(orderId);

  // ✅ امسحه بعد 5 دقائق لتوفير الذاكرة
  setTimeout(() => recentOrders.delete(orderId), 5 * 60 * 1000);

  console.log("✅ Order received at /cart-created:", orderData);

  try {
    await sendOrderEmail(orderData);
    console.log("✅ Email sent successfully");
    res.status(200).json({ success: true, message: "Order and email processed" });
  } catch (err) {
    console.error("❌ Failed to send email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});
app.post("/process-2checkout", async (req, res) => {
  const { customerInfo, orderItems, totalAmount, currency } = req.body;

  if (!customerInfo || !orderItems || !totalAmount || !currency) {
    return res.status(400).send("Missing required fields");
  }

  try {
    const payload = {
      currency,
      amount: totalAmount,
      billing: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address,
      },
      items: orderItems.map(item => ({
        name: item.title,
        price: item.price,
        quantity: item.quantity || 1,
      }))
    };

    // ⚠️ عدّل الرابط الفعلي حسب مستندات 2Checkout
    const response = await require("axios").post(
      "https://api.2checkout.com/orders",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.TWOCHECKOUT_SECRET_KEY}`,
        }
      }
    );

    res.status(200).json({
      success: true,
      checkoutUrl: response.data.checkoutUrl || null,
      transactionId: response.data.transactionId || null,
    });

  } catch (error) {
    console.error("❌ 2Checkout error:", error.message);
    res.status(500).json({ success: false, message: "Payment failed", error: error.message });
  }
});


// ✅ التصدير النهائي للوظيفة
exports.pasturaApi = functions.https.onRequest(app);
app.use(cors({
  origin: [
    "https://farmline-supply.netlify.app",
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","x-pastura-token"]
}));
