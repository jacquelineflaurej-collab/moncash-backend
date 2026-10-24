const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const moncash = require('nodejs-moncash-sdk');

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

const db = admin.firestore();

// 2. MonCash SDK Setup
const MONCASH_MODE = process.env.MONCASH_MODE || 'sandbox';
const MONCASH_CLIENT_ID = process.env.MONCASH_CLIENT_ID || 'BBWKj1BLKMYqRNQ6sYvFo64FtaRLRR5BdHBSMha4TM';
const MONCASH_CLIENT_SECRET = process.env.MONCASH_CLIENT_SECRET || 'B0422dn3gQLgDbuwQTjzrFgFTarLRR5BdHBSMha4TM';

moncash.configure({
  mode: MONCASH_MODE,
  client_id: MONCASH_CLIENT_ID,
  client_secret: MONCASH_CLIENT_SECRET
});

console.log(`💳 MonCash SDK konfigure sou: ${MONCASH_MODE}`);

// 3. Endpoint pou Kreye Peman (POST /create-payment)
app.post('/create-payment', (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        error: "Manke 'amount' oswa 'orderId'"
      });
    }

    console.log(`📥 Demann peman resevwa - OrderID: ${orderId}, Montan: ${amount} HTG`);

    const create_payment_json = {
      amount: parseFloat(amount),
      orderId: String(orderId)
    };

    const payment_creator = moncash.payment;
    payment_creator.create(create_payment_json, function (error, payment) {
      if (error) {
        console.error("❌ Erè MonCash SDK:", error);
        return res.status(500).json({
          success: false,
          error: "Echèk nan kreye peman sou MonCash",
          details: error
        });
      }

      const redirectUrl = payment_creator.redirect_uri(payment);
      console.log(`✅ Redirect URL jwenn: ${redirectUrl}`);

      return res.status(200).json({
        success: true,
        redirectUrl: redirectUrl
      });
    });

  } catch (err) {
    console.error("❌ Erè sèvè:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Default Route pou tcheke si sèvè a ap mache
app.get('/', (req, res) => {
  res.send("🚀 Sèvè StarX MonCash ap mache kòrèkteman!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Sèvè a ap kouri sou pòt ${PORT}`);
});