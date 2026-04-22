// routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const { getStats, getAllUsers } = require("../controllers/adminController");
const { verifierToken, verifierAdmin } = require("../middleware/auth");
const User = require('../models/User');
const Cours = require('../models/Cours');

// 📊 STATS ADMIN (version améliorée avec calculs directs)
router.get("/stats", verifierToken, verifierAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const admins = await User.countDocuments({ role: 'admin' });
    const users = await User.countDocuments({ role: 'user' });
    const abonnementsActifs = await User.countDocuments({ 
      'abonnement.actif': true,
      'abonnement.expiration': { $gt: new Date() }
    });
    const totalCours = await Cours.countDocuments();
    
    // Calcul des revenus (5000 FCFA par abonnement actif)
    const revenus = abonnementsActifs * 5000;
    
    // Ventes du mois
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    
    const ventesMois = await User.countDocuments({ 
      'abonnement.dateDebut': { $gte: debutMois }
    }) * 5000;
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        admins,
        users,
        abonnementsActifs,
        totalCours,
        revenus,
        ventesMois
      }
    });
  } catch (error) {
    console.error("❌ Erreur stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 👥 LISTE TOUS LES UTILISATEURS (via controller)
router.get("/users", verifierToken, verifierAdmin, getAllUsers);

// 📊 STATISTIQUES UTILISATEURS PAR MOIS
router.get('/users/stats', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const usersByMonth = await User.aggregate([
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({ success: true, usersByMonth });
  } catch (error) {
    console.error("❌ Erreur stats utilisateurs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 📈 STATISTIQUES ABONNEMENTS
router.get('/abonnements/stats', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const actifs = await User.countDocuments({ 
      'abonnement.actif': true,
      'abonnement.expiration': { $gt: new Date() }
    });
    
    const expires = await User.countDocuments({ 
      'abonnement.actif': false,
      'abonnement.expiration': { $lt: new Date() }
    });
    
    const sansAbonnement = await User.countDocuments({ 
      $or: [
        { 'abonnement': { $exists: false } },
        { 'abonnement.actif': false, 'abonnement.expiration': { $exists: false } }
      ]
    });
    
    res.json({
      success: true,
      stats: {
        actifs,
        expires,
        sansAbonnement,
        total: actifs + expires + sansAbonnement
      }
    });
  } catch (error) {
    console.error("❌ Erreur stats abonnements:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🗑️ SUPPRIMER UN UTILISATEUR (ADMIN)
router.delete('/users/:id', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === req.userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Vous ne pouvez pas supprimer votre propre compte" 
      });
    }
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Utilisateur non trouvé" 
      });
    }
    
    res.json({ 
      success: true, 
      message: `Utilisateur ${user.email} supprimé avec succès` 
    });
  } catch (error) {
    console.error("❌ Erreur suppression:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// 👑 CHANGER LE RÔLE D'UN UTILISATEUR
router.put('/users/:id/role', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: "Rôle invalide. Les rôles acceptés: user, admin" 
      });
    }
    
    if (id === req.userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Vous ne pouvez pas modifier votre propre rôle" 
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
      message: `Rôle de ${user.email} modifié en ${role}`,
      user
    });
  } catch (error) {
    console.error("❌ Erreur changement rôle:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;