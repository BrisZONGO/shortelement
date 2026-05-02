const express = require('express');
const router = express.Router();

const {
  inscription,
  connexion,
  profil
} = require('../controllers/authController');

const User = require('../models/User');
const { protect, isAdmin } = require('../middleware/auth');

// =============================
// AUTH PUBLIQUE
// =============================
router.post('/inscription', inscription);
router.post('/connexion', connexion);

// =============================
// PROFIL UTILISATEUR CONNECTÉ
// =============================
router.get('/profil', protect, profil);

// =============================
// ADMIN - GESTION UTILISATEURS
// =============================
router.get('/utilisateurs', protect, isAdmin, async (req, res) => {
  try {
    const utilisateurs = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: utilisateurs.length,
      utilisateurs
    });
  } catch (error) {
    console.error('❌ liste utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.delete('/utilisateurs/:id', protect, isAdmin, async (req, res) => {
  try {
    const utilisateur = await User.findById(req.params.id);

    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Utilisateur supprimé'
    });
  } catch (error) {
    console.error('❌ suppression utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.put('/utilisateurs/:id/role', protect, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    const utilisateur = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    res.json({
      success: true,
      message: 'Rôle mis à jour',
      utilisateur
    });
  } catch (error) {
    console.error('❌ update role:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
