const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const axios = require('axios');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// 1. Firebase Admin Setup
try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require('./serviceAccountKey.json');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("🔥 Firebase Admin konekte avèk siksè!");
} catch (error) {
  console.error("⚠️ Info Firebase:", error.message);
}

// 2. MonCash API Config (Sandbox / Live)
const MONCASH_MODE = process.env.MONCASH_MODE || 'sandbox';
const BASE_URL = MONCASH_MODE === 'live' 
  ? 'https://moncashbutton.digicelgroup.com' 
  : 'https://sandbox.moncashbutton.digicelgroup.com';

const CLIENT_ID = process.env.MONCASH_CLIENT_ID;
const CLIENT_SECRET = process.env.MONCASH_CLIENT_SECRET;

// Fonksyon pou jwenn Access Token nan men MonCash
async function getMonCashToken() {
  try {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await axios.post(`${BASE_URL}/V1/oauth/token?grant_type=client_credentials`, {}, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error("❌ Erè Token MonCash:", error.response?.data || error.message);
    throw new Error("Echèk nan otantifikasyon MonCash");
  }
}

// 3. Endpoint pou Kreye Peman (POST /create-payment)
app.post('/create-payment', async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        error: "Manke 'amount' oswa 'orderId'"
      });
    }

    console.log(`📥 Demann peman resevwa - OrderID: ${orderId}, Montan: ${amount} HTG`);

    const token = await getMonCashToken();

    // Kreye peman an sou MonCash API
    const paymentResponse = await axios.post(`${BASE_URL}/V1/CreatePayment`, {
      amount: parseFloat(amount),
      orderId: String(orderId)
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const paymentData = paymentResponse.data;
    // Jwenn redirect URL la
    const redirectUrl = `${BASE_URL}/V1/Payment/Redirect?token=${paymentData.payment_token.token}`;

    console.log(`✅ Redirect URL jwenn: ${redirectUrl}`);

    return res.status(200).json({
      success: true,
      redirectUrl: redirectUrl
    });

  } catch (err) {
    console.error("❌ Erè sèvè:", err.response?.data || err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Default Route
app.get('/', (req, res) => {
  res.send("🚀 Sèvè StarX MonCash ap mache kòrèkteman!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Sèvè a ap kouri sou pòt ${PORT}`);
});
