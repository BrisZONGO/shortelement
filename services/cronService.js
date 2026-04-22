const cron = require("node-cron");
const User = require("../models/User");
const { sendWhatsApp } = require("./whatsappService");

// =============================
// 📅 VÉRIFICATION ABONNEMENTS EXPIRÉS
// =============================
/**
 * Vérifie et désactive les abonnements expirés
 */
const verifierAbonnementsExpires = async () => {
  try {
    const now = new Date();

    // 🔍 Récupérer utilisateurs concernés
    const expiredUsers = await User.find({
      "abonnement.actif": true,
      "abonnement.expiration": { $lt: now }
    });

    if (expiredUsers.length === 0) {
      console.log("📅 Aucun abonnement expiré à désactiver");
      return;
    }

    // 🔥 MISE À JOUR INDIVIDUELLE (avec ton code exact)
    for (const user of expiredUsers) {

      // ✅ TON CODE AJOUTÉ (OBLIGATOIRE)
      if (user.abonnement.expiration < new Date()) {
        user.abonnement.actif = false;
      }

      await user.save();

      // 📲 Notification WhatsApp
      if (user.phone) {
        await sendWhatsApp(
          user.phone,
          `❌ Votre abonnement a expiré

Bonjour ${user.nom || user.email},

Votre abonnement a expiré le ${new Date(user.abonnement.expiration).toLocaleDateString()}.

Pour continuer à accéder à nos cours, veuillez renouveler votre abonnement.

🔗 https://concours-directs-et-professionnels.netlify.app

Merci de votre confiance ! 🙏`
        ).catch(err =>
          console.error(`Erreur WhatsApp ${user.phone}:`, err.message)
        );
      }
    }

    console.log(`📅 ${expiredUsers.length} abonnement(s) désactivé(s)`);

  } catch (error) {
    console.error("❌ Erreur vérification abonnements:", error);
  }
};

// =============================
// 🔔 RAPPEL ABONNEMENT (J-3, J-1)
// =============================
const envoyerRappelAbonnement = async () => {
  try {
    const now = new Date();

    const dans3Jours = new Date();
    dans3Jours.setDate(now.getDate() + 3);

    const dans1Jour = new Date();
    dans1Jour.setDate(now.getDate() + 1);

    const usersJ3 = await User.find({
      "abonnement.actif": true,
      "abonnement.expiration": {
        $gte: dans3Jours,
        $lt: new Date(dans3Jours.getTime() + 86400000)
      }
    });

    const usersJ1 = await User.find({
      "abonnement.actif": true,
      "abonnement.expiration": {
        $gte: dans1Jour,
        $lt: new Date(dans1Jour.getTime() + 86400000)
      }
    });

    // 🔄 Suppression doublons
    const uniqueUsers = [...usersJ3, ...usersJ1].filter(
      (user, index, self) =>
        index === self.findIndex(u => u._id.toString() === user._id.toString())
    );

    if (uniqueUsers.length === 0) {
      console.log("🔔 Aucun rappel à envoyer");
      return;
    }

    for (const user of uniqueUsers) {
      if (user.phone) {
        const joursRestants = Math.ceil(
          (new Date(user.abonnement.expiration) - now) / (1000 * 60 * 60 * 24)
        );

        const messageJours =
          joursRestants === 1 ? "demain" : `dans ${joursRestants} jours`;

        await sendWhatsApp(
          user.phone,
          `⚠️ Rappel abonnement

Bonjour ${user.nom || user.email},

Votre abonnement expire ${messageJours} 
(le ${new Date(user.abonnement.expiration).toLocaleDateString()}).

💰 Renouvelez dès maintenant.

🔗 https://concours-directs-et-professionnels.netlify.app`
        ).catch(err =>
          console.error(`Erreur rappel ${user.phone}:`, err.message)
        );
      }
    }

    console.log(`✅ ${uniqueUsers.length} rappels envoyés`);

  } catch (error) {
    console.error("❌ Erreur rappel:", error);
  }
};

// =============================
// 📊 RAPPORT QUOTIDIEN
// =============================
const envoyerRapportQuotidien = async () => {
  try {
    const now = new Date();
    const debutJour = new Date(now);
    debutJour.setHours(0, 0, 0, 0);

    const nouveaux = await User.countDocuments({
      createdAt: { $gte: debutJour }
    });

    const total = await User.countDocuments();
    const actifs = await User.countDocuments({
      "abonnement.actif": true
    });

    const expirant = await User.countDocuments({
      "abonnement.actif": true,
      "abonnement.expiration": {
        $gte: now,
        $lt: new Date(now.getTime() + 86400000)
      }
    });

    console.log("📊 RAPPORT");
    console.log("Nouveaux:", nouveaux);
    console.log("Total:", total);
    console.log("Actifs:", actifs);
    console.log("Expire aujourd'hui:", expirant);

    if (process.env.ADMIN_WHATSAPP) {
      await sendWhatsApp(
        process.env.ADMIN_WHATSAPP,
        `📊 Rapport

👥 Nouveaux: ${nouveaux}
👥 Total: ${total}
✅ Actifs: ${actifs}
⚠️ Expirations: ${expirant}`
      );
    }

  } catch (error) {
    console.error("❌ Erreur rapport:", error);
  }
};

// =============================
// 🧹 NETTOYAGE
// =============================
const nettoyerLogs = async () => {
  try {
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - 90);

    const result = await User.deleteMany({
      abonnement: { $exists: false },
      createdAt: { $lt: dateLimite }
    });

    console.log(`🧹 ${result.deletedCount} comptes supprimés`);

  } catch (error) {
    console.error("❌ Erreur nettoyage:", error);
  }
};

// =============================
// 🚀 CRON START
// =============================
const startCronJobs = () => {
  console.log("🔄 CRON START");

  cron.schedule("0 0 * * *", verifierAbonnementsExpires);
  cron.schedule("0 8 * * *", envoyerRappelAbonnement);
  cron.schedule("0 18 * * *", envoyerRappelAbonnement);
  cron.schedule("0 20 * * *", envoyerRapportQuotidien);
  cron.schedule("0 3 * * 0", nettoyerLogs);

  console.log("✅ CRON ACTIF");
};

module.exports = {
  startCronJobs,
  verifierAbonnementsExpires,
  envoyerRappelAbonnement,
  envoyerRapportQuotidien,
  nettoyerLogs
};