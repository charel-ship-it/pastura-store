const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: "shopping@pasturafarmstore.com",
    pass: "m0Qc9duDKY1B" // ⚠️ استخدم App Password الصحيح فقط
  }
});

exports.sendOrderEmail = async (order) => {
  const item = order.items[0];

  const mailOptions = {
    from: '"Pastura Orders" <shopping@pasturafarmstore.com>',
    to: "admin@pasturafarmstore.com",
    subject: `🛒 New Order Received: ${item.name}`,
    html: `
      <h2>📦 Order Details</h2>
      <ul>
        <li><strong>Product:</strong> ${item.name}</li>
        <li><strong>Price:</strong> $${item.price}</li>
        <li><strong>Quantity:</strong> ${item.quantity}</li>
        <li><strong>Country of Origin:</strong> ${item.origin}</li>
        <li><strong>Product Link:</strong> <a href="${item.productUrl}" target="_blank">${item.productUrl}</a></li>
        <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p><img src="${item.imageUrl}" alt="${item.name}" width="200" /></p>

      <hr/>
      <h3>👤 Customer Info</h3>
      <ul>
        <li><strong>Full Name:</strong> ${order.customerName || "N/A"}</li>
        <li><strong>Email:</strong> ${order.customerEmail || "N/A"}</li>
        <li><strong>Phone:</strong> ${order.customerPhone || "N/A"}</li>
        <li><strong>Shipping Address:</strong> ${order.shippingAddress || "N/A"}</li>
      </ul>

      <hr/>
      <h3>🔗 Quick Shopify Link</h3>
      <p>
        <a href="https://admin.shopify.com/store/pastura-store/orders" target="_blank">
          👉 Open Shopify Admin to Create Order
        </a>
      </p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.response);
  } catch (err) {
    console.error("❌ Failed to send email:", err);
  }
};
