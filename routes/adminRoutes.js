const express = require("express");
const router = express.Router();

const { getAllUsers } = require("../controllers/adminController");
const { verifierToken, verifierAdmin } = require("../middleware/auth");

const User = require('../models/User');
const Cours = require('../models/Cours');

// =============================
// 🧪 ROUTE TEST ADMIN
// =============================
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Admin routes OK ✅" });
});

// =============================
// 📊 STATS ADMIN
// =============================
router.get("/stats", verifierToken, verifierAdmin, async (req, res) => {
  try {
    console.log("📊 Chargement stats admin...");

    const totalUsers = await User.countDocuments();
    const admins = await User.countDocuments({ role: 'admin' });
    const users = await User.countDocuments({ role: 'user' });

    const abonnementsActifs = await User.countDocuments({
      'abonnement.actif': true,
      'abonnement.expiration': { $gt: new Date() }
    });

    const totalCours = await Cours.countDocuments();

    // 💰 Revenus estimés
    const revenus = abonnementsActifs * 5000;

    // 📅 Ventes du mois
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
    console.error("❌ Erreur stats admin:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================
// 👥 LISTE UTILISATEURS
// =============================
router.get("/users", verifierToken, verifierAdmin, getAllUsers);

// =============================
// 📊 USERS PAR MOIS
// =============================
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
    console.error("❌ Erreur stats users:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================
// 📈 STATS ABONNEMENTS
// =============================
router.get('/abonnements/stats', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const now = new Date();

    const actifs = await User.countDocuments({
      'abonnement.actif': true,
      'abonnement.expiration': { $gt: now }
    });

    const expires = await User.countDocuments({
      'abonnement.actif': false,
      'abonnement.expiration': { $lt: now }
    });

    const sansAbonnement = await User.countDocuments({
      $or: [
        { abonnement: { $exists: false } },
        { 'abonnement.expiration': { $exists: false } }
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
    console.error("❌ Erreur stats abonnements:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================
// 🗑️ SUPPRIMER UTILISATEUR
// =============================
router.delete('/users/:id', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Suppression user: ${id}`);

    // ❌ Empêcher auto-suppression
    if (id === req.userId) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer votre propre compte"
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
      message: `Utilisateur ${user.email} supprimé`
    });

  } catch (error) {
    console.error("❌ Erreur suppression:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================
// 👑 CHANGER ROLE
// =============================
router.put('/users/:id/role', verifierToken, verifierAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    console.log(`🔁 Changement rôle: ${id} → ${role}`);

    // ❌ Validation rôle
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide (user | admin)"
      });
    }

    // ❌ Empêcher auto-modification
    if (id === req.userId) {
      return res.status(400).json({
        success: false,
        message: "Impossible de modifier votre propre rôle"
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
      message: `Rôle mis à jour: ${user.email} → ${role}`,
      user
    });

  } catch (error) {
    console.error("❌ Erreur changement rôle:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;