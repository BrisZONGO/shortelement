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

const { protect, isAdmin } = require('../middleware/auth');
const checkAbonnement = require('../middleware/checkAbonnement');
const Cours = require('../models/Cours');

const router = express.Router();


// =============================
// 🔥 ROUTES SPÉCIFIQUES (IMPORTANT - TOUJOURS EN HAUT)
// =============================

// 📚 RECHERCHE
router.get('/recherche', searchCours);

// 🆓 COURS GRATUITS
router.get('/gratuits', getCoursGratuits);

// 💎 COURS PREMIUM
router.get('/premium', protect, checkAbonnement, getCoursPremium);

// 📊 ANNÉES ACADÉMIQUES
router.get('/annees', async (req, res) => {
  try {
    const annees = await Cours.distinct('anneeAcademique', { actif: true });

    res.json({
      success: true,
      annees: annees.sort().reverse()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 📊 COURS PAR ANNÉE
router.get('/par-annee/:annee', async (req, res) => {
  try {
    const cours = await Cours.find({
      anneeAcademique: req.params.annee,
      actif: true
    });

    res.json({
      success: true,
      count: cours.length,
      cours
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// =============================
// 📚 ROUTES PRINCIPALES
// =============================

// 🔥 IMPORTANT: cette route doit être APRES toutes les routes fixes
router.get('/', getAllCours);

// ⚠️ TOUJOURS DERNIER (sinon conflit avec /annees etc.)
router.get('/:id', getCoursById);


// =============================
// 👑 ADMIN ROUTES
// =============================
router.post('/', protect, isAdmin, createCours);

router.put('/:id', protect, isAdmin, updateCours);

router.delete('/:id', protect, isAdmin, deleteCours);


module.exports = router;