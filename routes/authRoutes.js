const express = require('express');
const { inscription, connexion } = require('../controllers/authController');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

const router = express.Router();

// ========== ROUTES PUBLIQUES (ces fonctions existent) ==========
router.post('/inscription', inscription);
router.post('/connexion', connexion);

// ========== ROUTE DE TEST ==========
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API authentification fonctionnelle',
    routesDisponibles: {
      inscription: 'POST /api/auth/inscription',
      connexion: 'POST /api/auth/connexion'
    }
  });
});

// ========== ROUTE PROTÉGÉE DE TEST ==========
router.get('/protected-test', verifierToken, (req, res) => {
  res.json({ 
    success: true,
    message: 'Authentification réussie',
    userId: req.userId,
    userRole: req.userRole
  });
});

module.exports = router;