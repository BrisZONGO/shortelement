const User = require("../models/User");
const Cours = require("../models/Cours");

/**
 * 📊 GET /api/admin/stats
 * Statistiques admin complètes
 */
const getStats = async (req, res) => {
  try {
    // =============================
    // 👥 USERS
    // =============================
    const totalUsers = await User.countDocuments();

    const premiumUsers = await User.countDocuments({
      "abonnement.actif": true
    });

    const adminUsers = await User.countDocuments({
      role: "admin"
    });

    // =============================
    // 📚 COURS
    // =============================
    const totalCourses = await Cours.countDocuments();

    // =============================
    // 💰 REVENUS
    // =============================
    const prixAbonnement = 5000; // FCFA
    const revenus = premiumUsers * prixAbonnement;

    // =============================
    // 🆕 RÉCENTS
    // =============================
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password");

    const recentCourses = await Cours.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // =============================
    // ✅ RÉPONSE (FUSION PROPRE)
    // =============================
    res.json({
      success: true,

      // 👉 IMPORTANT : pour ton frontend
      totalUsers,
      premiumUsers,
      revenus,

      // 👉 stats détaillées
      stats: {
        totalUsers,
        premiumUsers,
        adminUsers,
        totalCourses,
        revenus,
        prixAbonnement
      },

      // 👉 données récentes
      recent: {
        users: recentUsers,
        courses: recentCourses
      }
    });

  } catch (err) {
    console.error("❌ Erreur getStats:", err);

    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: err.message
    });
  }
};

/**
 * 👥 GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });

  } catch (err) {
    console.error("❌ Erreur getAllUsers:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * 🔁 PUT /api/admin/users/:userId/role
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide"
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    res.json({
      success: true,
      message: `Rôle modifié en ${role}`,
      user
    });

  } catch (err) {
    console.error("❌ Erreur updateUserRole:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = {
  getStats,
  getAllUsers,
  updateUserRole
};