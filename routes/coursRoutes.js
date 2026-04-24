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
const Cours = require('../models/Cours');

const router = express.Router();

// Routes publiques
router.get('/', getAllCours);
router.get('/recherche', searchCours);
router.get('/gratuits', getCoursGratuits);
router.get('/:id', getCoursById);

// Routes année académique
router.get('/annees', async (req, res) => {
  try {
    const annees = await Cours.distinct('anneeAcademique', { actif: true });
    res.json({ success: true, annees: annees.sort().reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/par-annee/:annee', async (req, res) => {
  try {
    const cours = await Cours.find({ anneeAcademique: req.params.annee, actif: true });
    res.json({ success: true, count: cours.length, cours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Routes premium
router.get('/premium/liste', verifierToken, checkAbonnement, getCoursPremium);
router.get('/premium/:id', verifierToken, checkAbonnement, getCoursPremium);

// Routes admin
router.post('/', verifierToken, verifierAdmin, createCours);
router.put('/:id', verifierToken, verifierAdmin, updateCours);
router.delete('/:id', verifierToken, verifierAdmin, deleteCours);

module.exports = router;
