
const User = require("../models/User");

const checkAbonnement = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    if (!user.abonnement || !user.abonnement.actif) {
      return res.status(403).json({
        success: false,
        message: "Abonnement requis. Veuillez souscrire à un abonnement pour accéder à ce contenu."
      });
    }

    const now = new Date();

    if (user.abonnement.expiration && new Date(user.abonnement.expiration) < now) {
      user.abonnement.actif = false;
      await user.save();

      return res.status(403).json({
        success: false,
        message: "Votre abonnement a expiré. Veuillez le renouveler pour continuer.",
        expiration: user.abonnement.expiration
      });
    }

    req.abonnement = {
      actif: true,
      expiration: user.abonnement.expiration || null,
      forfait: user.abonnement.forfait || null
    };

    next();
  } catch (err) {
    console.error("❌ Erreur dans checkAbonnement:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la vérification de l'abonnement"
    });
  }
};

module.exports = checkAbonnement;
