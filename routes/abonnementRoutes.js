const express = require('express');
const router = express.Router();
const { verifierToken } = require('../middleware/auth');
const {
  createAbonnement,
  getAbonnementActif,
  getMesAbonnements,
  getTypesAbonnement
} = require('../controllers/abonnementController');

router.get('/types', getTypesAbonnement);
router.post('/creer', verifierToken, createAbonnement);
router.get('/actif', verifierToken, getAbonnementActif);
router.get('/mes-abonnements', verifierToken, getMesAbonnements);

module.exports = router;