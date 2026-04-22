const User = require("../models/User");
const Cours = require("../models/Cours");

/**
 * 📊 GET /api/admin/stats
 * Statistiques admin complètes
 */
const getStats = async (req, res) => {
  try {
    // =============================
    // 👥 USERS STATISTICS
    // =============================
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({
      "abonnement.actif": true
    });
    const adminUsers = await User.countDocuments({
      role: "admin"
    });
    const regularUsers = await User.countDocuments({
      role: "user"
    });
    
    // Abonnements actifs avec expiration future
    const abonnementsActifs = await User.countDocuments({ 
      'abonnement.actif': true,
      'abonnement.expiration': { $gt: new Date() }
    });

    // =============================
    // 📚 COURS STATISTICS
    // =============================
    const totalCourses = await Cours.countDocuments();
    const premiumCourses = await Cours.countDocuments({ estPremium: true });
    const freeCourses = await Cours.countDocuments({ estPremium: false });

    // =============================
    // 💰 REVENUS CALCULATION
    // =============================
    const prixAbonnement = 5000; // FCFA par abonnement
    const revenus = premiumUsers * prixAbonnement;
    
    // Ventes du mois
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    
    const ventesMois = await User.countDocuments({ 
      'abonnement.dateDebut': { $gte: debutMois }
    }) * prixAbonnement;

    // =============================
    // 🆕 DONNÉES RÉCENTES
    // =============================
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password");

    const recentCourses = await Cours.find()
      .sort({ createdAt: -1 })
      .limit(5);

    // =============================
    // 📈 STATS PAR MOIS
    // =============================
    const usersByMonth = await User.aggregate([
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // =============================
    // ✅ RÉPONSE COMPLÈTE
    // =============================
    res.json({
      success: true,

      // 👉 Pour compatibilité frontend existant
      totalUsers,
      premiumUsers,
      revenus,

      // 👉 Stats détaillées
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
        ventesMois,
        prixAbonnement
      },

      // 👉 Données récentes
      recent: {
        users: recentUsers,
        courses: recentCourses
      },

      // 👉 Statistiques temporelles
      usersByMonth
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
 * Récupérer tous les utilisateurs
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
 * Mettre à jour le rôle d'un utilisateur
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide. Les rôles acceptés sont: user, admin"
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    console.log(`✅ Rôle de ${user.email} mis à jour: ${role}`);

    res.json({
      success: true,
      message: `Rôle modifié en ${role}`,
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });

  } catch (err) {
    console.error("❌ Erreur updateUserRole:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * 🗑️ DELETE /api/admin/users/:userId
 * Supprimer un utilisateur
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }
    
    // Empêcher la suppression de son propre compte
    if (userId === req.userId) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte"
      });
    }
    
    await User.findByIdAndDelete(userId);
    
    console.log(`✅ Utilisateur supprimé: ${user.email}`);
    
    res.json({
      success: true,
      message: `Utilisateur ${user.email} supprimé avec succès`,
      deletedUser: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom
      }
    });
    
  } catch (err) {
    console.error("❌ Erreur deleteUser:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * 📊 GET /api/admin/abonnements/stats
 * Statistiques des abonnements
 */
const getAbonnementsStats = async (req, res) => {
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
    
  } catch (err) {
    console.error("❌ Erreur getAbonnementsStats:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = {
  getStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAbonnementsStats
};