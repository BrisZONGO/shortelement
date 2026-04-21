
const User = require("../models/User");

/**
 * Middleware pour vérifier si l'utilisateur a un abonnement actif
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction suivante
 */
const checkAbonnement = async (req, res, next) => {
  try {
    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(req.userId);

    // Vérifier si l'utilisateur existe
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Vérifier si l'abonnement existe et est actif
    if (!user.abonnement || !user.abonnement.actif) {
      return res.status(403).json({
        success: false,
        message: "Abonnement requis. Veuillez souscrire à un abonnement pour accéder à ce contenu."
      });
    }

    const now = new Date();

    // Vérifier si l'abonnement n'a pas expiré
    if (user.abonnement.expiration && new Date(user.abonnement.expiration) < now) {
      // Désactiver automatiquement l'abonnement expiré
      user.abonnement.actif = false;
      await user.save();

      return res.status(403).json({
        success: false,
        message: "Votre abonnement a expiré. Veuillez le renouveler pour continuer.",
        expiration: user.abonnement.expiration
      });
    }

    // Calculer les jours restants (optionnel - pour info)
    if (user.abonnement.expiration) {
      const joursRestants = Math.ceil((new Date(user.abonnement.expiration) - now) / (1000 * 60 * 60 * 24));
      
      // Ajouter les infos d'abonnement à la requête pour utilisation ultérieure
      req.abonnement = {
        actif: true,
        expiration: user.abonnement.expiration,
        joursRestants: joursRestants,
        forfait: user.abonnement.forfait
      };
    }

    // Tout est bon, passer au prochain middleware/route
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
