const axios = require("axios");

module.exports = async (req, res) => {
  try {
    const payload = req.body;

    console.log("Incoming SMEPay Webhook:", payload);

    const status =
      payload?.status ||
      payload?.payment_status ||
      payload?.data?.status;

    if (!status || !String(status).toUpperCase().includes("SUCCESS")) {
      return res.status(200).send("Ignoring non-paid events");
    }

    const orderId =
      payload?.metadata?.order_id ||
      payload?.order_id ||
      payload?.data?.metadata?.order_id;

    const txnId =
      payload?.payment_id ||
      payload?.transaction_id ||
      payload?.data?.payment_id;

    if (!orderId) {
      console.log("Webhook has no order ID");
      return res.status(200).send("No order ID found");
    }

    console.log("Marking Shopline order paid:", orderId);

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
    res.status(500).send("Webhook processing failed");
  }
};
