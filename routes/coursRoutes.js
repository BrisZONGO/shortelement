const express = require('express');
const router = express.Router();
const { verifierToken, verifierAdmin } = require('../middleware/auth');
const checkAbonnement = require('../middleware/checkAbonnement');
const Cours = require('../models/Cours');
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

// =============================
// 📚 ROUTES PUBLIQUES (sans authentification)
// =============================
router.get('/', getAllCours);
router.get('/recherche', searchCours);
router.get('/gratuits', getCoursGratuits);
router.get('/:id', getCoursById);

// =============================
// 📅 ROUTES ANNÉE ACADÉMIQUE (P3)
// =============================

// Récupérer toutes les années académiques disponibles
router.get('/annees', async (req, res) => {
  try {
    const annees = await Cours.getAnneesAcademiques();
    res.json({
      success: true,
      annees
    });
  } catch (error) {
    console.error('❌ Erreur getAnnees:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Récupérer les cours par année académique
router.get('/par-annee/:annee', async (req, res) => {
  try {
    const { annee } = req.params;
    const cours = await Cours.findByAnneeAcademique(annee);
    res.json({
      success: true,
      count: cours.length,
      cours
    });
  } catch (error) {
    console.error('❌ Erreur getCoursParAnnee:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
