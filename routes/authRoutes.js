const express = require('express');
const { inscription, connexion } = require('../controllers/authController');
const { verifierToken } = require('../middleware/auth');

const router = express.Router();

router.post('/inscription', inscription);
router.post('/connexion', connexion);
router.get('/test', (req, res) => res.json({ message: 'Auth OK' }));

module.exports = router;
