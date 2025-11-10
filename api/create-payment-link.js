import axios from "axios";

export default async function handler(req, res) {
  try {
    const orderId = req.query.order_id;
    if (!orderId) return res.status(400).send("Missing order ID");

    // 🔥 STEP 1: Create SMEPay payment link
    const response = await axios.post(
      "https://api.smepay.in/payment/create",   // ✅ placeholder URL
      {
        amount: 100,                           // ✅ TEMP: replace later with real order price
        currency: "INR",
        description: `Order #${orderId}`,
        metadata: { order_id: orderId }        // ✅ critical for webhook
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SMEPAY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("SMEPAY RESPONSE:", response.data);

    const paymentUrl =
      response.data?.payment_url ||
      response.data?.url ||
      response.data?.redirect_url;

    if (!paymentUrl) {
      return res
        .status(500)
        .send("SMEPay did not return payment URL. Check logs.");
    }

    // 🔥 STEP 2: Redirect user
    return res.redirect(paymentUrl);

  } catch (err) {
    console.error("SMEPay error:", err?.response?.data || err.message);
    return res.status(500).send("Error creating payment link");
  }
}
