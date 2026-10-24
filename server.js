const express = require('express');
const moncash = require('nodejs-moncash-sdk');
const app = express();

app.use(express.json());

// Konfigirasyon SDK MonCash la ak kle Sandbox ou yo
moncash.configure({
    'mode': 'sandbox', 
    'client_id': '5356845b520e1acc398dfc72bab95db4',
    'client_secret': '1xN6WZXOutl9B_wtdAU3H3zOodpmW7YY7swteEo1ElDnztmil_LbqxhKjmYuncx6'
});

// Wout pou kreye peman an ki pral rele pa App Android ou a
app.post('/payment/create', (req, res) => {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
        return res.status(400).json({ error: "Amount ak orderId obligatwa" });
    }

    // 🟢 KONTWÒL SEKIRITE: 5% pou ou, 95% pou vandè a
    const platformFee = amount * 0.05;     
    const sellerEarnings = amount * 0.95; 

    var create_payment_json = {
        "amount": amount,
        "orderId": orderId
    };

    var payment_creator = moncash.payment;
    
    // SDK MonCash la ap jere otantifikasyon an ak demann lan pou nou otomatikman
    payment_creator.create(create_payment_json, function (error, payment) {
        if (error) {
            console.error("Erè MonCash SDK:", error);
            return res.status(500).json({ error: "Echèk nan kreye peman ak SDK a", details: error });
        } else {
            // Rekipere redirect URI ofisyèl la nan SDK a
            const redirectUri = payment_creator.redirect_uri(payment);
            
            console.log("Peman kreye avèk siksè! Lyen:", redirectUri);
            
            return res.json({
                success: true,
                redirectUrl: redirectUri,
                platformFee: platformFee,
                sellerEarnings: sellerEarnings
            });
        }
    });
});

// Limen sèvè a sou pò 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sèvè MonCash la ap kouri sou http://localhost:${PORT}`);
});