const express = require('express');
const {
  initPaiement,
  confirmerPaiement,
  initPayment,
  notifyPayment
} = require('../controllers/paymentController');

const router = express.Router();

// Routes de simulation (pour tests)
router.post('/init', initPaiement);
router.post('/confirm', confirmerPaiement);

// Routes CinetPay réelles
router.post('/cinetpay/init', initPayment);
router.post('/cinetpay/notify', notifyPayment);

module.exports = router;