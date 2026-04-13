const express = require('express');
const { getCours, getCoursById, createCours } = require('../controllers/coursController');
const { verifierToken, verifierAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', getCours);
router.get('/:id', getCoursById);
router.post('/', verifierToken, verifierAdmin, createCours);

module.exports = router;