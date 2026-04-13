const express = require('express');
const { 
  inscription, 
  connexion,
  getProfile,
  updateProfile,
  deconnexion,
  getAllUsers,
  changeUserRole,
  deleteUser
} = require('../controllers/authController');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

const router = express.Router();

// ========== ROUTES PUBLIQUES ==========
router.post('/inscription', inscription);
router.post('/connexion', connexion);
router.post('/deconnexion', deconnexion);

// ========== ROUTES PROTÉGÉES (nécessitent authentification) ==========
router.get('/profil', verifierToken, getProfile);
router.put('/profil', verifierToken, updateProfile);

// ========== ROUTES ADMIN (nécessitent authentification + rôle admin) ==========
router.get('/utilisateurs', verifierToken, verifierAdmin, getAllUsers);
router.put('/utilisateurs/:userId/role', verifierToken, verifierAdmin, changeUserRole);
router.delete('/utilisateurs/:userId', verifierToken, verifierAdmin, deleteUser);

module.exports = router;