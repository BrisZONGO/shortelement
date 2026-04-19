const express = require('express');
const {
  getAllCours,
  getCoursById,
  createCours,
  updateCours,
  deleteCours,
  searchCours
} = require('../controllers/coursController');
const { verifierToken, verifierAdmin } = require('../middleware/auth');
const verifierAbonnement = require("../middleware/abonnement");  // ← UNE SEULE FOIS

const router = express.Router();

// Routes publiques
router.get('/', getAllCours);
router.get('/recherche', searchCours);
router.get('/:id', getCoursById);

// Routes protégées (authentification requise)
router.post('/', verifierToken, verifierAdmin, createCours);

// Routes admin
router.put('/:id', verifierToken, verifierAdmin, updateCours);
router.delete('/:id', verifierToken, verifierAdmin, deleteCours);

module.exports = router;