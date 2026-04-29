const axios = require("axios");
const User = require("../models/User");
const { sendWhatsApp } = require("../services/whatsappService");

// =============================
// 🧪 SIMULATION DE PAIEMENT
// =============================
const initPaiement = async (req, res) => {
  try {
    const { montant, email } = req.body;

    if (!montant || !email) {
      return res.status(400).json({
        success: false,
        message: "Montant et email requis"
      });
    }

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
    console.error("❌ Erreur paiement:", error);
    res.status(500).json({ success: false, message: error.message });
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
    console.error("❌ Erreur confirmation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 💳 CINETPAY
// =============================
const initPayment = async (req, res) => {
  try {
    const { montant, email, telephone, nom, prenom, coursId, coursNom } = req.body;

    if (!montant || !email) {
      return res.status(400).json({
        success: false,
        message: "Montant et email requis"
      });
    }

    let user = await User.findOne({ email });

    const transactionId = Date.now().toString();

    const payload = {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: parseInt(montant),
      currency: "XOF",
      description: coursNom || "Abonnement",
      customer_email: email,
      customer_name: `${prenom || user?.prenom || ''} ${nom || user?.nom || ''}`,
      customer_phone: telephone || user?.phone || "",
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement/succes`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement/annule`,
      notify_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payment/notify`
    };

    const { data } = await axios.post(
      "https://api-checkout.cinetpay.com/v2/payment",
      payload
    );

    if (data.code === 201) {
      return res.json({
        success: true,
        payment_url: data.data.payment_url,
        transaction_id: transactionId
      });
    }

    throw new Error("Erreur CinetPay");

  } catch (error) {
    console.error("❌ initPayment:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// 🔔 WEBHOOK
// =============================
const notifyPayment = async (req, res) => {
  try {
    const { status, customer_email, transaction_id, amount } = req.body;

    if (status === "ACCEPTED") {
      const user = await User.findOne({ email: customer_email });

      if (user) {
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + 30);

        user.abonnement = {
          actif: true,
          expiration,
          dateDebut: new Date(),
          forfait: "mensuel"
        };

        await user.save();

        await sendWhatsApp(
          user.phone || "+226XXXXXXXX",
          `Paiement validé (${amount} FCFA). Abonnement actif 30 jours.`
        ).catch(() => {});
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error("❌ notifyPayment:", error);
    res.status(500).json({ success: false });
  }
};

// =============================
// 🔍 STATUT
// =============================
const verifierStatutPaiement = async (req, res) => {
  try {
    const user = req.user;

    if (user?.abonnement) {
      const actif =
        user.abonnement.actif &&
        new Date(user.abonnement.expiration) > new Date();

      return res.json({
        success: true,
        status: actif ? "active" : "expired",
        abonnement: user.abonnement
      });
    }

    res.json({ success: true, status: "inactive" });

  } catch (error) {
    console.error("❌ statut:", error);
    res.status(500).json({ success: false });
  }
};

// =============================
// 📄 NOUVELLES FONCTIONS (OBLIGATOIRES)
// =============================

// Paiements utilisateur
const getUserPayments = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      payments: [
        {
          email: user.email,
          statut: user.abonnement?.actif ? "actif" : "inactif",
          expiration: user.abonnement?.expiration || null
        }
      ]
    });

  } catch (error) {
    console.error("❌ getUserPayments:", error);
    res.status(500).json({ success: false });
  }
};

// Paiements admin
const getAllPayments = async (req, res) => {
  try {
    const users = await User.find().select("email abonnement");

    const payments = users.map(u => ({
      email: u.email,
      actif: u.abonnement?.actif || false,
      expiration: u.abonnement?.expiration || null
    }));

    res.json({
      success: true,
      count: payments.length,
      payments
    });

  } catch (error) {
    console.error("❌ getAllPayments:", error);
    res.status(500).json({ success: false });
  }
};

// =============================
// 📤 EXPORT
// =============================
module.exports = {
  initPaiement,
  confirmerPaiement,
  initPayment,
  notifyPayment,
  verifierStatutPaiement,
  getUserPayments,
  getAllPayments
};