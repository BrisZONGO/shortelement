const express = require('express');
const router = express.Router();
const { verifierToken, verifierAdmin } = require('../middleware/auth');
const {
  createPartie,
  getPartiesByModule,
  getPartieById,
  updatePartie,
  deletePartie,
  reorderParties
} = require('../controllers/partieController');

// Routes publiques (lecture seule)
router.get('/module/:moduleId', getPartiesByModule);
router.get('/:id', getPartieById);

// Routes admin (gestion complète)
router.post('/', verifierToken, verifierAdmin, createPartie);
router.put('/:id', verifierToken, verifierAdmin, updatePartie);
router.delete('/:id', verifierToken, verifierAdmin, deletePartie);
router.put('/reorder/:moduleId', verifierToken, verifierAdmin, reorderParties);

module.exports = router;