const express = require('express');
const router = express.Router();

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
const Cours = require('../models/Cours');

// =============================
// 🧪 ROUTE TEST (ANTI-404)
// =============================
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: "Cours routes OK ✅"
  });
});

// =============================
// 🔍 RECHERCHE
// =============================
router.get('/recherche', searchCours);

// =============================
// 📚 GRATUITS
// =============================
router.get('/gratuits', getCoursGratuits);

// =============================
// 💎 PREMIUM
// =============================
router.get('/premium/liste', verifierToken, checkAbonnement, getCoursPremium);
router.get('/premium/:id', verifierToken, checkAbonnement, getCoursPremium);

// =============================
// 📆 ANNEES DISPONIBLES
// =============================
router.get('/annees', async (req, res) => {
  try {
    const annees = await Cours.distinct('anneeAcademique', { actif: true });

    res.json({
      success: true,
      annees: annees.sort().reverse()
    });

  } catch (error) {
    console.error("❌ Erreur annees:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================
// 📆 COURS PAR ANNEE
// =============================
router.get('/par-annee/:annee', async (req, res) => {
  try {
    const { annee } = req.params;

    console.log(`📆 Chargement cours année: ${annee}`);

    const cours = await Cours.find({
      anneeAcademique: annee,
      actif: true
    });

    res.json({
      success: true,
      count: cours.length,
      cours
    });

  } catch (error) {
    console.error("❌ Erreur cours par année:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================
// 📦 TOUS LES COURS
// =============================
router.get('/', getAllCours);

// =============================
// 📄 COURS PAR ID (TOUJOURS EN BAS)
// =============================
router.get('/:id', getCoursById);

// =============================
// ➕ CREATE COURS (ADMIN)
// =============================
router.post('/', verifierToken, verifierAdmin, createCours);

// =============================
// ✏️ UPDATE COURS (ADMIN)
// =============================
router.put('/:id', verifierToken, verifierAdmin, updateCours);

// =============================
// 🗑️ DELETE COURS (ADMIN)
// =============================
router.delete('/:id', verifierToken, verifierAdmin, deleteCours);

// =============================
// 🧠 QCM VALIDATION
// =============================
router.post('/qcm', verifierToken, async (req, res) => {
  try {
    const { coursId, semaineIndex, partieIndex, score } = req.body;

    console.log("🧠 QCM soumis:", req.body);

    if (!coursId) {
      return res.status(400).json({
        success: false,
        message: "coursId requis"
      });
    }

    // 🔁 Simulation logique QCM (à améliorer avec DB plus tard)
    let validated = false;
    let tentatives = 1;

    if (score >= 50) {
      validated = true;
    } else {
      tentatives = 2;
    }

    res.json({
      success: true,
      validated,
      tentatives,
      message: validated
        ? "✅ QCM validé"
        : "❌ Score insuffisant"
    });

  } catch (error) {
    console.error("❌ Erreur QCM:", error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;