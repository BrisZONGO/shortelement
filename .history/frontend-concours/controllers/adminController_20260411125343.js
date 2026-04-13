const User = require('../models/User');
const Cours = require('../models/Cours');
const Commentaire = require('../models/Commentaire');

// Statistiques générales
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Cours.countDocuments();
    const totalComments = await Commentaire.countDocuments();
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('-password');
    const recentCourses = await Cours.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalComments
      },
      recentUsers,
      recentCourses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Activer/Désactiver un utilisateur (soft delete)
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    user.isActive = user.isActive === undefined ? false : !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'}`,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats, toggleUserStatus };