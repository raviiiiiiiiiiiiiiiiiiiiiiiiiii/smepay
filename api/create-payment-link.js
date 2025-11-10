import axios from "axios";

export default async function handler(req, res) {
  try {
    const orderId = req.query.order_id;
    if (!orderId) return res.status(400).send("Missing order ID");

    // ✅ TEMP: 100 Rs Amount (we will fix to real amount later)
    const amount = 100;

    // ✅ Create SMEPay payment link
    const response = await axios.post(
      "https://api.smepay.in/payment/create",
      {
        amount: amount,
        currency: "INR",
        description: `Order #${orderId}`,
        metadata: { order_id: orderId }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SMEPAY_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("SMEPAY RESPONSE:", response.data);

    // ✅ SMEPay returns different possible fields — try all
    const paymentUrl =
      response.data?.payment_url ||
      response.data?.url ||
      response.data?.redirect_url;

    if (!paymentUrl) {
      return res
        .status(500)
        .send("SMEPay did not return a payment URL. Check logs.");
    }

    // ✅ Redirect customer to SMEPay link
    return res.redirect(paymentUrl);

  } catch (error) {
    console.error("SMEPay Error:", error?.response?.data || error);
    return res.status(500).send("Error creating payment link");
  }
}
