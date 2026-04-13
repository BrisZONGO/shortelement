const express = require('express');
const { 
  inscription, 
  connexion
  // Ces fonctions seront ajoutées plus tard dans authController.js
  // getProfile,
  // updateProfile,
  // deconnexion,
  // getAllUsers,
  // changeUserRole,
  // deleteUser
} = require('../controllers/authController');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

const router = express.Router();

// ========== ROUTES PUBLIQUES ==========
router.post('/inscription', inscription);
router.post('/connexion', connexion);

// ========== ROUTES TEMPORAIRES POUR TEST ==========
// Route de test simple
router.get('/test', (req, res) => {
  res.json({ message: 'Route auth fonctionne correctement' });
});

// Route protégée de test
router.get('/protected-test', verifierToken, (req, res) => {
  res.json({ 
    success: true,
    message: 'Authentification réussie',
    userId: req.userId,
    userRole: req.userRole
  });
});

// ========== COMMENTÉES EN ATTENTE D'IMPLEMENTATION ==========
// Routes protégées (à décommenter quand les fonctions seront ajoutées)
// router.get('/profil', verifierToken, getProfile);
// router.put('/profil', verifierToken, updateProfile);
// router.post('/deconnexion', deconnexion);

// Routes admin (à décommenter quand les fonctions seront ajoutées)
// router.get('/utilisateurs', verifierToken, verifierAdmin, getAllUsers);
// router.put('/utilisateurs/:userId/role', verifierToken, verifierAdmin, changeUserRole);
// router.delete('/utilisateurs/:userId', verifierToken, verifierAdmin, deleteUser);

module.exports = router;