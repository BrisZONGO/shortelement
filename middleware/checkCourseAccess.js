const Cours = require("../models/Cours");
const Module = require("../models/Module");
const Partie = require("../models/Partie");
const User = require("../models/User");

const hasActiveSubscription = (user) => {
  if (!user?.abonnement?.actif) return false;

  if (user.abonnement.expiration) {
    return new Date(user.abonnement.expiration) > new Date();
  }

  return true;
};

const resolveCourseFromRequest = async (req) => {
  if (req.params.coursId) {
    return Cours.findById(req.params.coursId);
  }

  if (req.params.moduleId) {
    const module = await Module.findById(req.params.moduleId);
    if (!module) return null;
    return Cours.findById(module.coursId);
  }

  if (!req.params.id) {
    return null;
  }

  if (req.baseUrl.includes("/modules")) {
    const module = await Module.findById(req.params.id);
    if (!module) return null;
    return Cours.findById(module.coursId);
  }

  if (req.baseUrl.includes("/parties")) {
    const partie = await Partie.findById(req.params.id);
    if (!partie) return null;

    const module = await Module.findById(partie.moduleId);
    if (!module) return null;

    return Cours.findById(module.coursId);
  }

  return null;
};

const checkCourseAccess = async (req, res, next) => {
  try {
    const cours = await resolveCourseFromRequest(req);

    if (!cours) {
      return res.status(404).json({
        success: false,
        message: "Cours ou contenu introuvable"
      });
    }

    if (!cours.estPremium) {
      return next();
    }

    if (req.user?.role === "admin") {
      return next();
    }

    if (!req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "Abonnement requis pour accéder à ce contenu premium"
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    if (!hasActiveSubscription(user)) {
      return res.status(403).json({
        success: false,
        message: "Ce contenu est réservé aux abonnés"
      });
    }

    next();
  } catch (error) {
    console.error("❌ Erreur checkCourseAccess:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la vérification d'accès"
    });
  }
};

module.exports = checkCourseAccess;
