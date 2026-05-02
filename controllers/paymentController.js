const axios = require('axios');
const User = require('../models/User');
const { sendPaymentConfirmationEmail } = require('../services/mailService');

const initPaiement = async (req, res) => {
  try {
    const { montant, email } = req.body;

    if (!montant || !email) {
      return res.status(400).json({
        success: false,
        message: 'Montant et email requis'
      });
    }

    res.json({
      success: true,
      message: 'Paiement initialisé',
      data: {
        montant,
        email,
        reference: 'PAY_' + Date.now(),
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('❌ Erreur paiement:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const confirmerPaiement = async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Référence requise'
      });
    }

    res.json({
      success: true,
      message: 'Paiement confirmé',
      reference
    });
  } catch (error) {
    console.error('❌ Erreur confirmation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const initPayment = async (req, res) => {
  try {
    const { montant, email, telephone, nom, prenom, coursId, coursNom } = req.body;

    if (!montant || !email) {
      return res.status(400).json({
        success: false,
        message: 'Montant et email requis'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    const transactionId = Date.now().toString();

    const payload = {
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: parseInt(montant, 10),
      currency: 'XOF',
      description: coursNom || 'Abonnement',
      customer_email: normalizedEmail,
      customer_name: `${prenom || user?.prenom || ''} ${nom || user?.nom || ''}`.trim(),
      customer_phone: (telephone || user?.telephone || '').trim(),
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement/succes`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement/annule`,
      notify_url: `${process.env.API_URL || 'http://localhost:5000'}/api/payment/notify`,
      metadata: JSON.stringify({
        coursId: coursId || '',
        coursNom: coursNom || ''
      })
    };

    const { data } = await axios.post(
      'https://api-checkout.cinetpay.com/v2/payment',
      payload
    );

    if (data.code === 201 && data.data?.payment_url) {
      return res.json({
        success: true,
        payment_url: data.data.payment_url,
        transaction_id: transactionId
      });
    }

    return res.status(400).json({
      success: false,
      message: data.message || 'Erreur CinetPay',
      raw: data
    });
  } catch (error) {
    console.error('❌ initPayment:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message
    });
  }
};

const notifyPayment = async (req, res) => {
  try {
    const { status, customer_email, transaction_id, amount, metadata } = req.body;

    if (status !== 'ACCEPTED') {
      return res.json({
        success: true,
        message: 'Paiement non validé'
      });
    }

    const normalizedEmail = customer_email?.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 30);

    user.abonnement = {
      actif: true,
      expiration,
      dateDebut: new Date(),
      forfait: 'mensuel'
    };

    await user.save();

    let parsedMetadata = {};
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      parsedMetadata = {};
    }

    try {
      await sendPaymentConfirmationEmail({
        email: user.email,
        nom: `${user.prenom || ''} ${user.nom || ''}`.trim(),
        montant: amount,
        coursNom: parsedMetadata.coursNom || 'Abonnement',
        transactionId: transaction_id,
        expiration
      });
    } catch (mailError) {
      console.error('❌ Envoi mail paiement:', mailError.message);
    }

    res.json({
      success: true,
      message: 'Paiement traité'
    });
  } catch (error) {
    console.error('❌ notifyPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur webhook paiement'
    });
  }
};

const verifierStatutPaiement = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('abonnement email telephone');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    if (user.abonnement) {
      const actif =
        user.abonnement.actif &&
        new Date(user.abonnement.expiration) > new Date();

      return res.json({
        success: true,
        status: actif ? 'active' : 'expired',
        abonnement: user.abonnement,
        email: user.email,
        telephone: user.telephone || ''
      });
    }

    res.json({
      success: true,
      status: 'inactive',
      email: user.email,
      telephone: user.telephone || ''
    });
  } catch (error) {
    console.error('❌ statut:', error);
    res.status(500).json({ success: false });
  }
};

const getUserPayments = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email telephone abonnement');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    res.json({
      success: true,
      payments: [
        {
          email: user.email,
          telephone: user.telephone || '',
          statut: user.abonnement?.actif ? 'actif' : 'inactif',
          expiration: user.abonnement?.expiration || null
        }
      ]
    });
  } catch (error) {
    console.error('❌ getUserPayments:', error);
    res.status(500).json({ success: false });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const users = await User.find().select('email telephone abonnement');

    const payments = users.map((u) => ({
      email: u.email,
      telephone: u.telephone || '',
      actif: u.abonnement?.actif || false,
      expiration: u.abonnement?.expiration || null
    }));

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error('❌ getAllPayments:', error);
    res.status(500).json({ success: false });
  }
};

module.exports = {
  initPaiement,
  confirmerPaiement,
  initPayment,
  notifyPayment,
  verifierStatutPaiement,
  getUserPayments,
  getAllPayments
};
