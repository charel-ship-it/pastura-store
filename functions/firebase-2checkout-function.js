const functions = require("firebase-functions");
const axios = require("axios");
const nodemailer = require("nodemailer");
require("dotenv").config();

exports.cartCreated = functions.https.onRequest(async (req, res) => {
  // ✅ تحقق من نوع الطلب
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // ✅ تحقق من التوكن الأمني
  const token = req.headers["x-pastura-token"];
  if (!token || token !== process.env.INTERNAL_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const {
    orderId,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    items
  } = req.body;

  try {
    // ✅ إنشاء الطلب في 2Checkout
    const env = process.env.TWOCHECKOUT_ENV || "sandbox";

    const totalAmount = items.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * (item.quantity || 1));
    }, 0) + 5; // Flat shipping

    const tcoPayload = {
      currency: "USD",
      language: "en",
      return_url: "https://www.pasturafarmstore.com/products/success.html",
      billing_address: {
        name: customerName,
        address: shippingAddress,
        email: customerEmail,
        phone: customerPhone,
        country: "US", // or adjust per context
      },
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity || 1,
        price: parseFloat(item.price),
        tangible: true
      }))
    };

    const tcoRes = await axios.post(
      env === "live"
        ? "https://api.2checkout.com/orders"
        : "https://sandbox.2checkout.com/api/orders",
      tcoPayload,
      {
        auth: {
          username: process.env.TWOCHECKOUT_MERCHANT_CODE,
          password: process.env.TWOCHECKOUT_PRIVATE_KEY
        },
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const paymentUrl = tcoRes.data.payment_url;

    // ✅ إرسال بريد تأكيد (اختياري)
    if (process.env.EMAIL_SENDER && process.env.EMAIL_PASSWORD) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_SENDER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      await transporter.sendMail({
        from: `"Pastura Orders" <${process.env.EMAIL_SENDER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_SENDER,
        subject: `🛒 New Order Received: ${orderId}`,
        html: `
          <h3>New Order from ${customerName}</h3>
          <p><strong>Email:</strong> ${customerEmail}</p>
          <p><strong>Phone:</strong> ${customerPhone}</p>
          <p><strong>Address:</strong> ${shippingAddress}</p>
          <p><strong>Total:</strong> $${totalAmount.toFixed(2)}</p>
          <p><strong>Order Link:</strong> <a href="${paymentUrl}">${paymentUrl}</a></p>
        `
      });
    }

    // ✅ الاستجابة للعميل
    return res.status(200).json({
      status: "success",
      paymentUrl
    });

  } catch (error) {
    console.error("❌ Error creating order in 2Checkout:", error.response?.data || error.message);
    return res.status(500).json({
      status: "error",
      error: error.response?.data?.message || "Failed to create payment link."
    });
  }
});
