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
  // Utiliser req.user qui a été chargé par le middleware
  res.json({
    success: true,
    user: {
      id: req.userId,
      email: req.userEmail,
      role: req.userRole,
      nom: req.user?.nom,
      prenom: req.user?.prenom
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
    console.error("❌ Erreur liste utilisateurs:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur"
    });
  }
});

// 🗑️ SUPPRIMER UN UTILISATEUR (ADMIN)
router.delete('/utilisateurs/:id', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Tentative de suppression de l'utilisateur: ${id}`);
    console.log(`👤 Admin connecté: ${req.userEmail} (${req.userId})`);
    
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
      message: `Utilisateur ${user.email} supprimé avec succès`
    });
    
  } catch (error) {
    console.error("❌ Erreur suppression utilisateur:", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Erreur serveur lors de la suppression" 
    });
  }
});

// 📊 STATISTIQUES (ADMIN) - Optionnel
router.get('/stats', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalUsersOnly = await User.countDocuments({ role: 'user' });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        admins: totalAdmins,
        users: totalUsersOnly
      }
    });
  } catch (error) {
    console.error("❌ Erreur stats:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;