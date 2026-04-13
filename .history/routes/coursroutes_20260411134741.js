const express = require('express');
const {
  getAllCours,
  getCoursById,
  createCours,
  updateCours,
  deleteCours,
  searchCours           // ← AJOUTÉ : import manquant
} = require('../controllers/coursController');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

const router = express.Router();

// Routes publiques (accessibles à tous)
router.get('/', getAllCours);
router.get('/recherche', searchCours);  // ← Déplacé AVANT /:id pour éviter les conflits
router.get('/:id', getCoursById);

// Routes protégées (authentification requise)
router.post('/', verifierToken, createCours);

// Routes admin (authentification + rôle admin requis)
router.put('/:id', verifierToken, verifierAdmin, updateCours);
router.delete('/:id', verifierToken, verifierAdmin, deleteCours);

module.exports = router;