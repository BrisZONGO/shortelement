const express = require('express');
const router = express.Router();

// ✅ middleware corrigé (nouveau standard)
const { protect, isAdmin } = require('../middleware/auth');

// ✅ import sécurisé (évite undefined)
const paymentController = require('../controllers/paymentController');

// =============================
// 🔍 CHECK FUNCTIONS (ANTI-CRASH)
// =============================
const safe = (fn, name) => {
  if (!fn) {
    console.error(`❌ Fonction manquante dans paymentController: ${name}`);
    return (req, res) =>
      res.status(500).json({
        success: false,
        message: `Fonction ${name} non implémentée`
      });
  }
  return fn;
};

// =============================
// 💳 ROUTES DE PAIEMENT
// =============================

// 🧪 SIMULATION (tests)
router.post('/init', safe(paymentController.initPaiement, 'initPaiement'));
router.post('/confirm', safe(paymentController.confirmerPaiement, 'confirmerPaiement'));

// 💰 INIT PAIEMENT CinetPay
router.post('/init-cinetpay', protect, safe(paymentController.initPayment, 'initPayment'));

// 🔔 WEBHOOK (PUBLIC - NE PAS PROTÉGER)
router.post('/notify', safe(paymentController.notifyPayment, 'notifyPayment'));

// 📊 STATUT ABONNEMENT
router.get('/statut', protect, safe(paymentController.verifierStatutPaiement, 'verifierStatutPaiement'));

// =============================
// 📄 UTILISATEUR
// =============================

// Mes paiements
router.get('/mes-paiements', protect, safe(paymentController.getUserPayments, 'getUserPayments'));

// =============================
// 👑 ADMIN
// =============================
router.get('/all', protect, isAdmin, safe(paymentController.getAllPayments, 'getAllPayments'));

module.exports = router;