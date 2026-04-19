const User = require("../models/User");
const checkAbonnement = require("../middleware/checkAbonnement");

app.get("/api/cours/premium",
  verifierToken,
  checkAbonnement,
  (req, res) => {
    res.json({ message: "Cours premium" });
  }
);
module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.abonnement?.actif) {
      return res.status(403).json({
        success: false,
        message: "Abonnement requis"
      });
    }

    const now = new Date();

    if (user.abonnement.expiration < now) {
      user.abonnement.actif = false;
      await user.save();

      return res.status(403).json({
        success: false,
        message: "Abonnement expiré"
      });
    }

    next();

  } catch (err) {
    res.status(500).json({ success: false });
  }
};