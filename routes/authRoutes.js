const express = require('express');
const router = express.Router();

const { inscription, connexion } = require('../controllers/authController');
const { verifierToken, verifierAdmin } = require('../middleware/auth');
const User = require('../models/User');

// 🔓 PUBLIC
router.post('/inscription', inscription);
router.post('/connexion', connexion);

// 🧪 TEST
router.get('/test', (req, res) => res.json({ message: 'Auth OK' }));

// 🔒 PROFIL
router.get('/profil', verifierToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.userId,
      email: req.userEmail
    }
  });
});

// 👑 LISTE UTILISATEURS (ADMIN)
router.get('/utilisateurs', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.json({
      success: true,
      users
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

module.exports = router;