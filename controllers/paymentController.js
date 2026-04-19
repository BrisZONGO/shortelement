const axios = require("axios");
const User = require("../models/User");
const { sendWhatsApp } = require("../services/whatsappService");

// =============================
// 🔧 SIMULATION DE PAIEMENT (pour tests)
// =============================
const initPaiement = async (req, res) => {
  try {
    const { montant, email } = req.body;

    // Validation
    if (!montant || !email) {
      return res.status(400).json({
        success: false,
        message: "Montant et email requis"
      });
    }

    // Simulation de paiement
    res.json({
      success: true,
      message: "Paiement initialisé",
      data: {
        montant,
        email,
        reference: "PAY_" + Date.now(),
        status: "pending"
      }
    });
  } catch (error) {
    console.error("Erreur paiement:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erreur serveur"
    });
  }
};

const confirmerPaiement = async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Référence requise"
      });
    }

    res.json({
      success: true,
      message: "Paiement confirmé",
      reference
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================
// 💳 INTÉGRATION CINETPAY (réelle)
// =============================

// Initier le paiement avec CinetPay
const initPayment = async (req, res) => {
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

// Notification serveur (webhook) - CinetPay
const notifyPayment = async (req, res) => {
  try {
    console.log("📩 Notification paiement reçue:", req.body);

    const { status, customer_email } = req.body;

    // ✅ Paiement validé
    if (status === "ACCEPTED") {
      const user = await User.findOne({ email: customer_email });

      if (user) {
        // 🎯 Activer abonnement 30 jours
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + 30);

        user.abonnement = {
          actif: true,
          expiration,
          dateDebut: new Date(),
          forfait: "mensuel"
        };

        await user.save();

        console.log("✅ Abonnement activé pour:", user.email);

        // 📲 ENVOI WHATSAPP (si numéro de téléphone disponible)
        if (user.phone) {
          await sendWhatsApp(
            user.phone,
            `🎉 Bonjour ${user.nom || user.email},

Votre paiement est validé ✅
Votre abonnement est actif pour 30 jours.

Bonne préparation aux concours 🇧🇫📚`
          );
        }
      } else {
        console.log("❌ Utilisateur non trouvé:", customer_email);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Notification traitée"
    });

  } catch (error) {
    console.error("❌ Erreur notifyPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
};

// =============================
// 📤 EXPORTATION DES FONCTIONS
// =============================
module.exports = {
  initPaiement,      // Simulation (pour tests)
  confirmerPaiement, // Simulation (pour tests)
  initPayment,       // CinetPay réel
  notifyPayment      // Webhook CinetPay
};