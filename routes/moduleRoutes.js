const express = require('express');
const router = express.Router();
const { verifierToken, verifierAdmin } = require('../middleware/auth');
const {
  createModule,
  getModulesByCours,
  getModuleWithParties,
  updateModule,
  deleteModule
} = require('../controllers/moduleController');

// Routes publiques
router.get('/cours/:coursId', getModulesByCours);
router.get('/:id', getModuleWithParties);

// Routes admin
router.post('/', verifierToken, verifierAdmin, createModule);
router.put('/:id', verifierToken, verifierAdmin, updateModule);
router.delete('/:id', verifierToken, verifierAdmin, deleteModule);

module.exports = router;