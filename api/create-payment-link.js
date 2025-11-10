const axios = require("axios");
const getAccessToken = require("./oauth");

module.exports = async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) return res.status(400).send("Missing order ID");

    const accessToken = await getAccessToken();

    const response = await axios.post(
      "https://api.smepay.in/api/payment/create-checkout",
      {
        amount: 100, 
        currency: "INR",
        description: `Order #${order_id}`,
        metadata: { order_id }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const redirectUrl =
      response.data?.payment_url ||
      response.data?.checkout_url ||
      response.data?.url;

    if (!redirectUrl) {
      console.log("Response from SMEPay:", response.data);
      return res.status(500).send("No payment URL from SMEPay");
    }

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("Create payment error:", err.response?.data || err);
    res.status(500).send("Failed to create SMEPay checkout");
  }
};
