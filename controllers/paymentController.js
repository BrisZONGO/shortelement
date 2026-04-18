const axios = require("axios");

// Initier le paiement
exports.initPayment = async (req, res) => {
  try {
    const { montant, email } = req.body;

    const payload = {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: Date.now().toString(),
      amount: montant,
      currency: "XOF",
      description: "Abonnement plateforme concours",
      customer_email: email,
      return_url: "https://concours-directs-et-professionnels.netlify.app/success",
      notify_url: "https://shortelement.onrender.com/api/payment/notify"
    };

    const { data } = await axios.post(
      "https://api-checkout.cinetpay.com/v2/payment",
      payload,
      { timeout: 8000 }
    );

    return res.json(data);
  } catch (err) {
    console.error("initPayment error:", err?.response?.data || err.message);
    return res.status(500).json({ success: false, message: "Erreur paiement" });
  }
};

// Notification serveur (webhook)
exports.notifyPayment = async (req, res) => {
  try {
    console.log("🔔 Notification CinetPay:", req.body);

    // ⚠️ À FAIRE : vérifier le statut et mettre à jour l’utilisateur en base
    // ex: if (req.body.status === "ACCEPTED") { activer abonnement }

    return res.send("OK");
  } catch (e) {
    console.error(e);
    return res.status(500).send("ERR");
  }
};