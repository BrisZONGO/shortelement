const cron = require("node-cron");
const User = require("../models/User");
const { sendWhatsApp } = require("./whatsappService");

/**
 * Vérifie et désactive les abonnements expirés
 */
const verifierAbonnementsExpires = async () => {
  try {
    const now = new Date();
    const result = await User.updateMany(
      { 
        'abonnement.actif': true,
        'abonnement.expiration': { $lt: now }
      },
      { 
        $set: { 'abonnement.actif': false }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`📅 ${result.modifiedCount} abonnement(s) expiré(s) désactivé(s)`);
    }
  } catch (error) {
    console.error('❌ Erreur vérification abonnements:', error);
  }
};

/**
 * Envoie un rappel WhatsApp aux utilisateurs dont l'abonnement expire bientôt
 */
const envoyerRappelAbonnement = async () => {
  try {
    const now = new Date();
    const dans3Jours = new Date();
    dans3Jours.setDate(now.getDate() + 3);
    
    const users = await User.find({
      'abonnement.actif': true,
      'abonnement.expiration': { 
        $gte: now,
        $lte: dans3Jours
      }
    });
    
    if (users.length > 0) {
      console.log(`📧 ${users.length} utilisateur(s) avec abonnement expirant bientôt`);
      
      for (const user of users) {
        if (user.phone) {
          await sendWhatsApp(
            user.phone,
            `⚠️ Bonjour ${user.nom || user.email},

Votre abonnement expire dans 3 jours.

Renouvelez pour continuer à accéder aux cours 📚

🔗 https://concours-directs-et-professionnels.netlify.app`
          );
        }
      }
      
      console.log(`✅ ${users.length} rappels WhatsApp envoyés`);
    }
  } catch (error) {
    console.error('❌ Erreur rappel abonnement:', error);
  }
};

/**
 * Nettoyer les logs ou données temporaires
 */
const nettoyerLogs = async () => {
  try {
    // Exemple: supprimer les tokens expirés ou logs anciens
    console.log('🧹 Nettoyage périodique des données');
    // À implémenter selon vos besoins
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
  }
};

/**
 * Démarre toutes les tâches cron
 */
const startCronJobs = () => {
  // Vérification des abonnements expirés (tous les jours à minuit)
  cron.schedule("0 0 * * *", async () => {
    console.log("🔄 [CRON] Vérification des abonnements expirés");
    await verifierAbonnementsExpires();
  });

  // Rappel des abonnements (tous les jours à 8h)
  cron.schedule("0 8 * * *", async () => {
    console.log("🔔 [CRON] Envoi des rappels d'abonnement");
    await envoyerRappelAbonnement();
  });

  // Nettoyage des logs (tous les dimanches à 2h)
  cron.schedule("0 2 * * 0", async () => {
    console.log("🧹 [CRON] Nettoyage des données");
    await nettoyerLogs();
  });

  console.log("✅ Cron jobs initialisés");
};

module.exports = { 
  startCronJobs,
  verifierAbonnementsExpires,
  envoyerRappelAbonnement,
  nettoyerLogs
};