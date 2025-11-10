const axios = require("axios");
const querystring = require("querystring");

module.exports = async (req, res) => {
  try {
    let raw = "";

    await new Promise((resolve) => {
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", resolve);
    });

    let payload = {};

    // ✅ Try JSON
    try {
      if (raw) payload = JSON.parse(raw);
    } catch (e) {}

    // ✅ Try form-urlencoded
    if (Object.keys(payload).length === 0 && raw) {
      try {
        payload = querystring.parse(raw);
      } catch (e) {}
    }

    // ✅ Log what we actually received
    console.log("🔥 SMEPay Webhook RAW:", raw);
    console.log("✅ SMEPay Webhook Parsed:", payload);

    if (!payload || Object.keys(payload).length === 0) {
      return res.status(200).send("No data received");
    }

    // ✅ Detect status field
    const status =
      payload.status ||
      payload.payment_status ||
      payload.data?.status;

    if (!status || !String(status).toUpperCase().includes("SUCCESS")) {
      return res.status(200).send("Ignoring non-paid events");
    }

    // ✅ Detect order ID
    const orderId =
      payload.order_id ||
      payload.metadata?.order_id ||
      payload.data?.metadata?.order_id;

    // ✅ Detect transaction id
    const txnId =
      payload.payment_id ||
      payload.transaction_id ||
      payload.data?.payment_id;

    if (!orderId) {
      console.log("⚠️ No order ID found");
      return res.status(200).send("Missing order ID");
    }

    console.log("✅ Marking order paid:", orderId);

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
    console.error("❌ Webhook Error:", err);
    res.status(500).send("Webhook failed");
  }
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};
