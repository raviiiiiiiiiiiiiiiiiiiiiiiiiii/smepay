import axios from "axios";

// ✅ Required for raw webhook bodies on Vercel
export const config = {
  api: {
    bodyParser: {
      type: "json"
    }
  }
};

export default async function handler(req, res) {
  try {
    const payload = req.body;

    console.log("🔥 Incoming SMEPay Webhook:", payload);

    // ✅ Try multiple names for status field
    const status =
      payload?.status ||
      payload?.payment_status ||
      payload?.data?.status;

    // ✅ Try multiple names for order id
    const orderId =
      payload?.metadata?.order_id ||
      payload?.order_id ||
      payload?.data?.metadata?.order_id;

    // ✅ Try multiple names for payment id
    const txnId =
      payload?.payment_id ||
      payload?.transaction_id ||
      payload?.data?.payment_id;

    if (!status || !String(status).toUpperCase().includes("SUCCESS")) {
      return res.status(200).send("Ignoring non-success webhook");
    }

    if (!orderId) {
      console.log("⚠️ No order ID found. Check payload format.");
      return res.status(200).send("Missing order ID");
    }

    console.log("✅ Marking order paid:", orderId);

    // ✅ Patch Shopline order status
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

    console.log("✅ Shopline Update Response:", shoplineResponse.data);

    return res.status(200).send("Order marked as paid");

  } catch (error) {
    console.error("Webhook Error:", error?.response?.data || error);
    return res.status(500).send("Webhook processing failed");
  }
}
