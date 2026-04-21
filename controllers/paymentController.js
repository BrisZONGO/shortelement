const axios = require("axios");
const User = require("../models/User");
const { sendWhatsApp } = require("../services/whatsappService");

// =============================
// 🔧 SIMULATION DE PAIEMENT (pour tests)
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
    console.error("❌ Erreur confirmation:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================
// 💳 INTÉGRATION CINETPAY (réelle)
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
    const userPhone = telephone || user?.phone;
    const userNom = nom || user?.nom;
    const userPrenom = prenom || user?.prenom;

    const transactionId = Date.now().toString();

    const payload = {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: parseInt(montant),
      currency: "XOF",
      description: coursNom || "Abonnement plateforme concours",
      customer_email: email,
      customer_name: `${userPrenom || ''} ${userNom || ''}`.trim(),
      customer_phone: userPhone || "",
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement/succes`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement/annule`,
      notify_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payment/notify`,
      metadata: {
        coursId: coursId || "abonnement",
        coursNom: coursNom || "Abonnement mensuel",
        email: email,
        telephone: userPhone
      }
    };

    console.log("📦 Initiation paiement CinetPay:", { email, montant, transactionId });

    const { data } = await axios.post(
      "https://api-checkout.cinetpay.com/v2/payment",
      payload,
      { timeout: 30000 }
    );

    if (data && data.code === 201) {
      return res.json({
        success: true,
        payment_url: data.data?.payment_url,
        transaction_id: transactionId
      });
    } else {
      throw new Error(data?.message || "Erreur d'initiation CinetPay");
    }

  } catch (err) {
    console.error("❌ initPayment error:", err?.response?.data || err.message);
    return res.status(500).json({ 
      success: false, 
      message: err?.response?.data?.message || "Erreur lors de l'initiation du paiement" 
    });
  }
};

// =============================
// 📢 NOTIFICATION SERVEUR (webhook) - CinetPay
// =============================
const notifyPayment = async (req, res) => {
  try {
    console.log("📩 Notification paiement reçue:", JSON.stringify(req.body, null, 2));

    const { status, customer_email, transaction_id, amount, metadata } = req.body;

    // ✅ Paiement accepté
    if (status === "ACCEPTED") {
      console.log(`✅ Paiement accepté pour ${customer_email} - Transaction: ${transaction_id}`);
      
      const user = await User.findOne({ email: customer_email });

      if (user) {
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + 30);

        user.abonnement = {
          actif: true,
          expiration: expiration,
          dateDebut: new Date(),
          forfait: "mensuel",
          derniereTransaction: transaction_id
        };

        await user.save();
        console.log("✅ Abonnement activé pour:", user.email);

        // Envoi WhatsApp
        const phoneNumber = user.phone || metadata?.telephone || "+226XXXXXXXX";
        const whatsappMessage = `🎉 Paiement validé !

Bonjour ${user.nom || user.email},

✅ Votre paiement de ${amount || 5000} FCFA a été validé.
📚 Abonnement actif pour 30 jours.

Merci pour votre confiance !`;

        await sendWhatsApp(phoneNumber, whatsappMessage).catch(err => {
          console.error("❌ Erreur envoi WhatsApp:", err.message);
        });

      } else {
        console.log("❌ Utilisateur non trouvé:", customer_email);
      }
    }
    
    // ⚠️ Paiement refusé
    else if (status === "REFUSED") {
      console.log(`⚠️ Paiement refusé pour ${customer_email} - Transaction: ${transaction_id}`);
    }

    return res.status(200).json({
      success: true,
      message: "Notification traitée avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur notifyPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors du traitement de la notification"
    });
  }
};

// =============================
// 🔍 VÉRIFIER STATUT PAIEMENT
// =============================
const verifierStatutPaiement = async (req, res) => {
  try {
    const user = req.user;
    
    if (user && user.abonnement) {
      const estActif = user.abonnement.actif && new Date(user.abonnement.expiration) > new Date();
      
      return res.json({
        success: true,
        status: estActif ? "active" : "expired",
        abonnement: user.abonnement
      });
    }
    
    res.json({
      success: true,
      status: "inactive",
      message: "Aucun abonnement actif trouvé"
    });
    
  } catch (error) {
    console.error("❌ Erreur vérification statut:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================
// 📤 EXPORTATION
// =============================
module.exports = {
  initPaiement,
  confirmerPaiement,
  initPayment,
  notifyPayment,
  verifierStatutPaiement
};