const express = require('express');
const router = express.Router();

const { inscription, connexion } = require('../controllers/authController');
const { verifierToken, verifierAdmin } = require('../middleware/auth');
const User = require('../models/User');

// =============================
// 🔓 ROUTES PUBLIQUES
// =============================

// Inscription
router.post('/inscription', inscription);

// Connexion
router.post('/connexion', connexion);

// Test API
router.get('/test', (req, res) => res.json({ 
  success: true, 
  message: 'Auth API fonctionne' 
}));

// =============================
// 🔒 ROUTES PROTÉGÉES
// =============================

// Profil utilisateur (nécessite token)
router.get('/profil', verifierToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        phone: user.phone,
        abonnement: user.abonnement,
        createdAt: user.createdAt
      }
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
// 👑 ROUTES ADMIN (protection admin requise)
// =============================

// Liste tous les utilisateurs (admin seulement)
router.get('/utilisateurs', verifierToken, verifierAdmin, async (req, res) => {
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
      message: "Erreur serveur lors de la récupération des utilisateurs"
    });
  }
});

// Supprimer un utilisateur (admin seulement)
router.delete('/utilisateurs/:id', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Tentative de suppression de l'utilisateur: ${id}`);
    console.log(`👤 Admin connecté: ${req.userId}`);
    
    // Vérifier si l'ID est valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide"
      });
    }
    
    // Empêcher la suppression de son propre compte
    if (id === req.userId) {
      console.log("⛔ Tentative d'auto-suppression bloquée");
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte"
      });
    }
    
    // Vérifier si l'utilisateur existe
    const user = await User.findById(id);
    if (!user) {
      console.log(`❌ Utilisateur ${id} non trouvé`);
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }
    
    // Supprimer l'utilisateur
    await User.findByIdAndDelete(id);
    
    console.log(`✅ Utilisateur supprimé: ${user.email} (${user.nom} ${user.prenom})`);
    
    res.json({
      success: true,
      message: `Utilisateur ${user.email} supprimé avec succès`,
      deletedUser: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur suppression utilisateur:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Erreur serveur lors de la suppression"
    });
  }
});

// Statistiques (admin seulement)
router.get('/stats', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalUsersOnly = await User.countDocuments({ role: 'user' });
    const abonnementsActifs = await User.countDocuments({ 
      'abonnement.actif': true,
      'abonnement.expiration': { $gt: new Date() }
    });
    
    // Récupérer les 5 derniers utilisateurs
    const derniersUtilisateurs = await User.find()
      .select('nom prenom email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        admins: totalAdmins,
        users: totalUsersOnly,
        abonnementsActifs
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

// Mettre à jour le rôle d'un utilisateur (admin seulement)
router.put('/utilisateurs/:id/role', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Vérifier si le rôle est valide
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide. Les rôles acceptés sont: user, admin"
      });
    }
    
    // Empêcher de modifier son propre rôle
    if (id === req.userId) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas modifier votre propre rôle"
      });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { role: role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }
    
    console.log(`✅ Rôle de ${user.email} mis à jour: ${role}`);
    
    res.json({
      success: true,
      message: `Rôle de l'utilisateur mis à jour avec succès`,
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur mise à jour rôle:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;