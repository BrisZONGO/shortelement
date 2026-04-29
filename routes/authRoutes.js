const express = require('express');
const router = express.Router();

const { inscription, connexion } = require('../controllers/authController');
const { protect, isAdmin } = require('../middleware/auth');
const User = require('../models/User');

// =============================
// 🔓 ROUTES PUBLIQUES
// =============================

// Inscription
router.post('/inscription', inscription);

// Connexion
router.post('/connexion', connexion);

// Test API
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API fonctionne'
  });
});

// =============================
// 🔒 ROUTES PROTÉGÉES
// =============================

// 👤 PROFIL UTILISATEUR
router.get('/profil', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("❌ Erreur profil:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

// =============================
// 👑 ROUTES ADMIN
// =============================

// 📋 LISTE UTILISATEURS
router.get('/utilisateurs', protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error("❌ Erreur liste utilisateurs:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

// 🗑️ SUPPRIMER UTILISATEUR
router.delete('/utilisateurs/:id', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "ID invalide"
      });
    }

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer votre propre compte"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
      deletedUser: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("❌ Erreur suppression:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 📊 STATISTIQUES ADMIN
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const admins = await User.countDocuments({ role: 'admin' });
    const users = await User.countDocuments({ role: 'user' });

    const derniersUtilisateurs = await User.find()
      .select('nom email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        admins,
        users
      },
      derniersUtilisateurs
    });
  } catch (error) {
    console.error("❌ Erreur stats:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 👑 UPDATE ROLE USER
router.put('/utilisateurs/:id/role', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide"
      });
    }

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Action interdite sur votre propre compte"
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    res.json({
      success: true,
      message: "Rôle mis à jour",
      user
    });
  } catch (error) {
    console.error("❌ Erreur role update:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 🔁 ACTIVER / DÉSACTIVER UTILISATEUR
router.put('/utilisateurs/:id/actif', protect, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { actif } = req.body;

    if (typeof actif !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "La valeur actif doit être true ou false"
      });
    }

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Action interdite sur votre propre compte"
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { actif },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    res.json({
      success: true,
      message: actif ? "Utilisateur réactivé" : "Utilisateur désactivé",
      user
    });
  } catch (error) {
    console.error("❌ Erreur activation user:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
