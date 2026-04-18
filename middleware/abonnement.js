module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Non autorisé" });
  }

  const abonnement = req.user.abonnement;

  if (!abonnement || !abonnement.actif) {
    return res.status(403).json({ message: "Abonnement requis" });
  }

  if (new Date() > new Date(abonnement.expiration)) {
    return res.status(403).json({ message: "Abonnement expiré" });
  }

  next();
};