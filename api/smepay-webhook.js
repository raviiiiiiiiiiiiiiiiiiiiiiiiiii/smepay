import axios from "axios";

export default async function handler(req, res) {
  try {
    const payload = req.body;

    console.log("🔥 Incoming SMEPay Webhook:", payload);

    // ✅ Best guess fields (safe fallback)
    const status =
      payload?.status ||
      payload?.payment_status ||
      payload?.data?.status;

    const orderId =
      payload?.metadata?.order_id ||
      payload?.order_id ||
      payload?.data?.metadata?.order_id;

    const txnId =
      payload?.payment_id ||
      payload?.transaction_id ||
      payload?.data?.payment_id;

    // ✅ Only act if payment was successful
    if (!status || !String(status).toUpperCase().includes("SUCCESS")) {
      return res.status(200).send("Ignoring non-success event");
    }

    if (!orderId) {
      console.log("⚠️ Missing order id. Check webhook structure.");
      return res.status(200).send("Missing order id.");
    }

    // 🔥 STEP: Mark order paid in Shopline
    const shoplineResponse = await axios.patch(
      `https://api.shoplineapp.com/orders/${orderId}/payment`,
      {
        status: "paid",
        pay_channel_deal_id: txnId || "UNKNOWN_TXN",
        payment_method: "SMEPay"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SHOPLINE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Shopline Update:", shoplineResponse.data);

    return res.status(200).send("Order updated");

  } catch (err) {
    console.error("Webhook Error:", err?.response?.data || err.message);
    return res.status(500).send("Webhook processing error");
  }
}
