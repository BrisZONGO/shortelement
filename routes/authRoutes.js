const express = require('express');
const { inscription, connexion, getProfile } = require('../controllers/authController');
const { verifierToken } = require('../middleware/auth');


const router = express.Router();

// 🔓 Routes publiques
router.post('/inscription', inscription);
router.post('/connexion', connexion);
router.get('/profil', verifierToken, getProfile);  // ← Route protégée
// 🧪 Route test
router.get('/test', (req, res) => res.json({ message: 'Auth OK' }));

// 🔐 Route profil (protégée)
router.get('/profil', verifierToken, (req, res) => {
  res.json({
    success: true,
    message: "Profil utilisateur",
    user: {
      id: req.userId,
      email: req.userEmail
    }
  });
});

module.exports = router;