const User = require("../models/User");
const Cours = require("../models/Cours");

/**
 * Récupère les statistiques pour l'administrateur
 * GET /api/admin/stats
 */
const getStats = async (req, res) => {
  try {
    // Statistiques utilisateurs
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({
      "abonnement.actif": true
    });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    // Statistiques cours
    const totalCourses = await Cours.countDocuments();

    // 💰 Calcul des revenus (exemple: 5000 FCFA par abonnement premium)
    const prixAbonnement = 5000;
    const revenus = premiumUsers * prixAbonnement;

    // Récupération des détails pour l'affichage
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');

    const recentCourses = await Cours.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        premiumUsers,
        adminUsers,
        totalCourses,
        revenus,
        prixAbonnement
      },
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
 * Récupère la liste de tous les utilisateurs (admin uniquement)
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
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
 * Modifie le rôle d'un utilisateur (admin uniquement)
 * PUT /api/admin/users/:userId/role
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: "Rôle invalide" 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
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