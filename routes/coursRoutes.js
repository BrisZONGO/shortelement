const express = require('express');
const {
  getAllCours,
  getCoursById,
  createCours,
  updateCours,
  deleteCours,
  searchCours,
  getCoursPremium,
  getCoursGratuits
} = require('../controllers/coursController');
const { verifierToken, verifierAdmin } = require('../middleware/auth');
const checkAbonnement = require('../middleware/checkAbonnement');

const router = express.Router();

// =============================
// 📚 ROUTES PUBLIQUES (sans authentification)
// =============================
router.get('/', getAllCours);
router.get('/recherche', searchCours);
router.get('/gratuits', getCoursGratuits);
router.get('/:id', getCoursById);

// =============================
// 💎 ROUTES PREMIUM (avec abonnement)
// =============================
router.get('/premium/liste', verifierToken, checkAbonnement, getCoursPremium);
router.get('/premium/:id', verifierToken, checkAbonnement, getCoursPremium);

// =============================
// 👑 ROUTES ADMIN (protection admin requise)
// =============================
router.post('/', verifierToken, verifierAdmin, createCours);
router.put('/:id', verifierToken, verifierAdmin, updateCours);
router.delete('/:id', verifierToken, verifierAdmin, deleteCours);

module.exports = router;