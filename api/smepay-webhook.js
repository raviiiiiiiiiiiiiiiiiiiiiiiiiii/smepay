const axios = require("axios");

module.exports = async (req, res) => {
  try {
    // ✅ Vercel requires explicit body parsing for webhooks
    if (!req.body || Object.keys(req.body).length === 0) {
      let raw = "";
      await new Promise((resolve) => {
        req.on("data", (chunk) => (raw += chunk));
        req.on("end", resolve);
      });

      try {
        req.body = JSON.parse(raw);
      } catch {
        console.log("⚠️ Failed to parse raw webhook body:", raw);
        return res.status(200).send("Bad JSON");
      }
    }

    const payload = req.body;
    console.log("🔥 SMEPay Webhook:", payload);

    // ✅ Read status
    const status =
      payload.status ||
      payload.payment_status ||
      payload.data?.status;

    if (!status || !String(status).toUpperCase().includes("SUCCESS")) {
      return res.status(200).send("Ignoring non-paid events");
    }

    // ✅ Extract order ID
    const orderId =
      payload.metadata?.order_id ||
      payload.order_id ||
      payload.data?.metadata?.order_id;

    // ✅ Extract transaction ID
    const txnId =
      payload.payment_id ||
      payload.transaction_id ||
      payload.data?.payment_id;

    if (!orderId) {
      console.log("⚠️ No order ID from SMEPay webhook");
      return res.status(200).send("Missing order ID");
    }

    console.log("✅ Marking Shopline order paid:", orderId);

    await axios.patch(
      `https://api.shoplineapp.com/orders/${orderId}/payment`,
      {
        status: "paid",
        pay_channel_deal_id: txnId || "UNKNOWN",
        payment_method: "SMEPay Checkout"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SHOPLINE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook Error:", err.response?.data || err);
    return res.status(500).send("Webhook processing error");
  }
};

// ✅ This tells Vercel: "DO NOT do your own body parsing"
module.exports.config = {
  api: {
    bodyParser: false
  }
};
