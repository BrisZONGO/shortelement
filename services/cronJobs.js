const cron = require("node-cron");
const User = require("../models/User");
const { sendWhatsApp } = require("./whatsappService");

// =============================
// 📅 VÉRIFICATION ABONNEMENTS EXPIRÉS
// =============================
const verifierAbonnementsExpires = async () => {
  try {
    const now = new Date();
    
    const expiredUsers = await User.find({
      'abonnement.actif': true,
      'abonnement.expiration': { $lt: now }
    });
    
    if (expiredUsers.length === 0) {
      console.log("📅 Aucun abonnement expiré à désactiver");
      return;
    }
    
    const result = await User.updateMany(
      { 
        'abonnement.actif': true,
        'abonnement.expiration': { $lt: now }
      },
      { 
        $set: { 'abonnement.actif': false }
      }
    );
    
    console.log(`📅 ${result.modifiedCount} abonnement(s) expiré(s) désactivé(s)`);
    
    for (const user of expiredUsers) {
      if (user.phone) {
        await sendWhatsApp(
          user.phone,
          `❌ Votre abonnement a expiré

Bonjour ${user.nom || user.email},

Votre abonnement a expiré. Veuillez renouveler pour continuer à accéder à nos cours.

🔗 https://concours-directs-et-professionnels.netlify.app`
        ).catch(err => console.error(`Erreur envoi WhatsApp:`, err.message));
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification abonnements:', error);
  }
};

// =============================
// 🔔 RAPPEL ABONNEMENT
// =============================
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
      console.log(`🔔 ${users.length} utilisateur(s) avec abonnement expirant bientôt`);
      
      for (const user of users) {
        if (user.phone) {
          const joursRestants = Math.ceil((new Date(user.abonnement.expiration) - now) / (1000 * 60 * 60 * 24));
          
          await sendWhatsApp(
            user.phone,
            `⚠️ Rappel abonnement

Bonjour ${user.nom || user.email},

Votre abonnement expire dans ${joursRestants} jour(s).

Renouvelez dès maintenant pour continuer à profiter de tous nos cours.

🔗 https://concours-directs-et-professionnels.netlify.app`
          ).catch(err => console.error(`Erreur envoi rappel:`, err.message));
        }
      }
      
      console.log(`✅ ${users.length} rappels WhatsApp envoyés`);
    }
  } catch (error) {
    console.error('❌ Erreur rappel abonnement:', error);
  }
};

// =============================
// 🧹 NETTOYAGE
// =============================
const nettoyerLogs = async () => {
  try {
    console.log('🧹 Nettoyage périodique des données');
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
  }
};

// =============================
// 🚀 DÉMARRAGE DES TÂCHES CRON
// =============================
const startCronJobs = () => {
  console.log("🔄 Initialisation des tâches planifiées...");
  
  // Vérification des abonnements expirés (tous les jours à minuit)
  cron.schedule("0 0 * * *", async () => {
    console.log("\n🔄 [CRON] Vérification des abonnements expirés");
    await verifierAbonnementsExpires();
  });

  // Rappel des abonnements (tous les jours à 8h)
  cron.schedule("0 8 * * *", async () => {
    console.log("\n🔔 [CRON] Envoi des rappels d'abonnement");
    await envoyerRappelAbonnement();
  });

  // Nettoyage (tous les dimanches à 2h)
  cron.schedule("0 2 * * 0", async () => {
    console.log("\n🧹 [CRON] Nettoyage des données");
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
