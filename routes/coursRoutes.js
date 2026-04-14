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

const router = express.Router();

router.get('/', getAllCours);
router.get('/recherche', searchCours);
router.get('/:id', getCoursById);
router.post('/', verifierToken, createCours);
router.put('/:id', verifierToken, verifierAdmin, updateCours);
router.delete('/:id', verifierToken, verifierAdmin, deleteCours);

module.exports = router;
