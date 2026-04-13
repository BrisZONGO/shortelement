// routes/coursRoutes.js
const express = require('express');
const {
  getAllCours,
  getCoursById,
  createCours,
  updateCours,
  deleteCours
} = require('../controllers/coursController');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

const router = express.Router();

// Routes publiques
router.get('/', getAllCours);
router.get('/:id', getCoursById);

// Routes protégées (nécessitent authentification)
router.post('/', verifierToken, createCours);
router.put('/:id', verifierToken, updateCours);
router.delete('/:id', verifierToken, deleteCours);

module.exports = router;