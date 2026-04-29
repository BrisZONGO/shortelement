const User = require("../models/User");
const Cours = require("../models/Cours");

// =============================
// 📊 STATS ADMIN
// =============================
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({
      "abonnement.actif": true
    });
    const adminUsers = await User.countDocuments({ role: "admin" });
    const regularUsers = await User.countDocuments({ role: "user" });

    const abonnementsActifs = await User.countDocuments({
      "abonnement.actif": true,
      "abonnement.expiration": { $gt: new Date() }
    });

    const totalCourses = await Cours.countDocuments();
    const premiumCourses = await Cours.countDocuments({ estPremium: true });
    const freeCourses = await Cours.countDocuments({ estPremium: false });

    const prixAbonnement = 5000;
    const revenus = premiumUsers * prixAbonnement;

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const ventesMois =
      (await User.countDocuments({
        "abonnement.dateDebut": { $gte: debutMois }
      })) * prixAbonnement;

    res.json({
      success: true,
      stats: {
        totalUsers,
        premiumUsers,
        adminUsers,
        regularUsers,
        abonnementsActifs,
        totalCourses,
        premiumCourses,
        freeCourses,
        revenus,
        ventesMois
      }
    });
  } catch (err) {
    console.error("❌ Erreur getStats:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================
// 👥 USERS
// =============================
const getUsers = async (req, res) => {
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
    console.error("❌ Erreur getUsers:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================
// 🗑️ DELETE USER
// =============================
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
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
  } catch (err) {
    console.error("❌ Erreur deleteUser:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  deleteUser
};
