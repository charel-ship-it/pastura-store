require("dotenv").config(); // أعلى الملف

const functions = require("firebase-functions");
const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const { sendOrderEmail } = require("./email");

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// ✅ إعداد Express app
const app = express();

// ✅ تفعيل CORS للـ Frontend فقط
app.use(cors({
  origin: [
    "https://www.pasturafarmstore.com",
    "https://farmline-supply.netlify.app",
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-pastura-token"]
}));

// ✅ الرد على Preflight Requests (CORS OPTIONS)
app.options("/cart-created", cors());

// ✅ تحليل JSON
app.use(express.json());

// ✅ إعداد المتغيرات من .env
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
const emailUser = process.env.EMAIL_SENDER;
const emailPass = process.env.EMAIL_PASSWORD;
const merchantCode = process.env.TWOCHECKOUT_MERCHANT_CODE;
const privateKey = process.env.TWOCHECKOUT_PRIVATE_KEY;
const secretWord = process.env.TWOCHECKOUT_SECRET_WORD;
const environment = process.env.TWOCHECKOUT_ENV;

// ✅ صفحة فحص جاهزية
app.get("/", (req, res) => {
  res.send("✅ Pastura Webhook is running.");
});

// ✅ استقبال طلبات زر Buy Now من Pastura
const recentOrders = new Set();

app.post("/cart-created", async (req, res) => {
  const token = req.headers["x-pastura-token"];
  if (token !== INTERNAL_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const orderData = req.body;
  const orderId = orderData.orderId;

  if (!orderId) {
    return res.status(400).json({ error: "Missing order ID" });
  }

  if (recentOrders.has(orderId)) {
    return res.status(409).json({ error: "Duplicate order" });
  }

  recentOrders.add(orderId);
  setTimeout(() => recentOrders.delete(orderId), 5 * 60 * 1000);

  try {
    await sendOrderEmail(orderData);
    res.status(200).json({ success: true, message: "Order and email processed" });
  } catch (err) {
    console.error("❌ Failed to send email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ✅ التصدير النهائي للوظيفة
exports.pasturaApi = functions.https.onRequest(app);

// ✅ خيارات الأداء
setGlobalOptions({ maxInstances: 10 });
