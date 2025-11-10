const axios = require("axios");

module.exports = async function getAccessToken() {
  const url = "https://api.smepay.in/api/auth/access-token";

  const response = await axios.post(url, {
    clientId: process.env.SMEPAY_CLIENT_ID,
    clientSecret: process.env.SMEPAY_CLIENT_SECRET
  });

  return response.data.token;
};
