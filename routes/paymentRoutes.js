const express = require('express');
const router = express.Router();
const { verifierToken } = require('../middleware/auth');
const {
  initPaiement,
  confirmerPaiement,
  initPayment,
  notifyPayment,
  verifierStatutPaiement
} = require('../controllers/paymentController');

// =============================
// 💳 ROUTES DE PAIEMENT
// =============================

// Routes de simulation (pour tests)
router.post('/init', initPaiement);
router.post('/confirm', confirmerPaiement);

// Route d'initiation CinetPay (réelle)
router.post('/init-cinetpay', initPayment);

// Webhook de notification CinetPay (route publique)
router.post('/notify', notifyPayment);

// Route protégée pour vérifier le statut de l'abonnement
router.get('/statut', verifierToken, verifierStatutPaiement);

module.exports = router;