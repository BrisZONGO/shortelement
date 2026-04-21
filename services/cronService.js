const cron = require("node-cron");
const User = require("../models/User");
const { sendWhatsApp } = require("./whatsappService");

// =============================
// 📅 VÉRIFICATION ABONNEMENTS EXPIRÉS
// =============================
/**
 * Vérifie et désactive les abonnements expirés
 * Désactive l'abonnement si la date d'expiration est dépassée
 */
const verifierAbonnementsExpires = async () => {
  try {
    const now = new Date();
    
    // Trouver les utilisateurs avec abonnement expiré mais toujours actif
    const expiredUsers = await User.find({
      'abonnement.actif': true,
      'abonnement.expiration': { $lt: now }
    });
    
    if (expiredUsers.length === 0) {
      console.log("📅 Aucun abonnement expiré à désactiver");
      return;
    }
    
    // Désactiver les abonnements expirés
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
    
    // Envoyer notification WhatsApp aux utilisateurs dont l'abonnement a expiré
    for (const user of expiredUsers) {
      if (user.phone) {
        await sendWhatsApp(
          user.phone,
          `❌ Votre abonnement a expiré

Bonjour ${user.nom || user.email},

Votre abonnement a expiré le ${new Date(user.abonnement.expiration).toLocaleDateString()}.

Pour continuer à accéder à nos cours, veuillez renouveler votre abonnement.

🔗 https://concours-directs-et-professionnels.netlify.app

Merci de votre confiance ! 🙏`
        ).catch(err => console.error(`Erreur envoi WhatsApp expiration à ${user.phone}:`, err.message));
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification abonnements:', error);
  }
};

// =============================
// 🔔 RAPPEL ABONNEMENT (J-3, J-1)
// =============================
/**
 * Envoie un rappel WhatsApp aux utilisateurs dont l'abonnement expire bientôt
 * Rappel à J-3 et J-1
 */
const envoyerRappelAbonnement = async () => {
  try {
    const now = new Date();
    const dans3Jours = new Date();
    dans3Jours.setDate(now.getDate() + 3);
    
    const dans1Jour = new Date();
    dans1Jour.setDate(now.getDate() + 1);
    
    // Utilisateurs dont l'abonnement expire dans 3 jours
    const usersJ3 = await User.find({
      'abonnement.actif': true,
      'abonnement.expiration': { 
        $gte: dans3Jours,
        $lt: new Date(dans3Jours.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    // Utilisateurs dont l'abonnement expire dans 1 jour
    const usersJ1 = await User.find({
      'abonnement.actif': true,
      'abonnement.expiration': { 
        $gte: dans1Jour,
        $lt: new Date(dans1Jour.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    const usersARappeler = [...usersJ3, ...usersJ1];
    
    // Éviter les doublons
    const uniqueUsers = usersARappeler.filter((user, index, self) => 
      index === self.findIndex(u => u._id.toString() === user._id.toString())
    );
    
    if (uniqueUsers.length > 0) {
      console.log(`🔔 ${uniqueUsers.length} utilisateur(s) avec abonnement expirant bientôt`);
      
      for (const user of uniqueUsers) {
        if (user.phone) {
          const joursRestants = Math.ceil((new Date(user.abonnement.expiration) - now) / (1000 * 60 * 60 * 24));
          const messageJoursRestants = joursRestants === 1 ? "demain" : `dans ${joursRestants} jours`;
          
          await sendWhatsApp(
            user.phone,
            `⚠️ Rappel abonnement

Bonjour ${user.nom || user.email},

Votre abonnement expire ${messageJoursRestants} (le ${new Date(user.abonnement.expiration).toLocaleDateString()}).

💰 Renouvelez dès maintenant pour continuer à profiter de tous nos cours.

🔗 https://concours-directs-et-professionnels.netlify.app

À bientôt ! 📚`
          ).catch(err => console.error(`Erreur envoi rappel à ${user.phone}:`, err.message));
        }
      }
      
      console.log(`✅ ${uniqueUsers.length} rappels WhatsApp envoyés`);
    } else {
      console.log("🔔 Aucun rappel d'abonnement à envoyer");
    }
  } catch (error) {
    console.error('❌ Erreur rappel abonnement:', error);
  }
};

// =============================
// 📊 STATISTIQUES QUOTIDIENNES
// =============================
/**
 * Envoie un rapport quotidien à l'admin
 */
const envoyerRapportQuotidien = async () => {
  try {
    const now = new Date();
    const debutJournee = new Date(now);
    debutJournee.setHours(0, 0, 0, 0);
    
    // Statistiques du jour
    const nouveauxUtilisateurs = await User.countDocuments({
      createdAt: { $gte: debutJournee }
    });
    
    const totalUtilisateurs = await User.countDocuments();
    const abonnementsActifs = await User.countDocuments({
      'abonnement.actif': true
    });
    
    const abonnementsExpirantAujourdhui = await User.countDocuments({
      'abonnement.actif': true,
      'abonnement.expiration': { 
        $gte: now,
        $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    console.log(`📊 RAPPORT QUOTIDIEN - ${new Date().toLocaleDateString()}`);
    console.log(`👥 Nouveaux utilisateurs: ${nouveauxUtilisateurs}`);
    console.log(`👥 Total utilisateurs: ${totalUtilisateurs}`);
    console.log(`✅ Abonnements actifs: ${abonnementsActifs}`);
    console.log(`⚠️ Abonnements expirant aujourd'hui: ${abonnementsExpirantAujourdhui}`);
    
    // Envoyer à l'admin si numéro configuré
    const adminPhone = process.env.ADMIN_WHATSAPP;
    if (adminPhone && adminPhone !== "226XXXXXXXX") {
      await sendWhatsApp(
        adminPhone,
        `📊 *Rapport quotidien* - ${new Date().toLocaleDateString()}

👥 Nouveaux inscrits: ${nouveauxUtilisateurs}
👥 Total utilisateurs: ${totalUtilisateurs}
✅ Abonnements actifs: ${abonnementsActifs}
⚠️ Expirations aujourd'hui: ${abonnementsExpirantAujourdhui}

📈 Bonne journée !`
      ).catch(err => console.error("Erreur envoi rapport admin:", err.message));
    }
    
  } catch (error) {
    console.error('❌ Erreur rapport quotidien:', error);
  }
};

// =============================
// 🧹 NETTOYAGE DES DONNÉES TEMPORAIRES
// =============================
/**
 * Nettoyer les logs ou données temporaires
 * Supprime les comptes inactifs depuis plus de 90 jours
 */
const nettoyerLogs = async () => {
  try {
    const now = new Date();
    const dateLimite = new Date();
    dateLimite.setDate(now.getDate() - 90); // 90 jours d'inactivité
    
    // Optionnel: Supprimer les comptes non confirmés très anciens
    const result = await User.deleteMany({
      abonnement: { $exists: false },
      createdAt: { $lt: dateLimite }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 ${result.deletedCount} compte(s) inactif(s) supprimé(s)`);
    } else {
      console.log('🧹 Aucune donnée à nettoyer');
    }
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error);
  }
};

// =============================
// 🚀 DÉMARRAGE DES TÂCHES CRON
// =============================
/**
 * Démarre toutes les tâches cron
 * À appeler une seule fois au démarrage du serveur
 */
const startCronJobs = () => {
  console.log("🔄 Initialisation des tâches planifiées...");
  
  // 1. Vérification des abonnements expirés (tous les jours à minuit)
  cron.schedule("0 0 * * *", async () => {
    console.log("\n🔄 [CRON - minuit] Vérification des abonnements expirés");
    await verifierAbonnementsExpires();
  });

  // 2. Rappel des abonnements (tous les jours à 8h et 18h)
  cron.schedule("0 8 * * *", async () => {
    console.log("\n🔔 [CRON - 8h] Envoi des rappels d'abonnement (matin)");
    await envoyerRappelAbonnement();
  });
  
  cron.schedule("0 18 * * *", async () => {
    console.log("\n🔔 [CRON - 18h] Envoi des rappels d'abonnement (soir)");
    await envoyerRappelAbonnement();
  });

  // 3. Rapport quotidien à l'admin (tous les jours à 20h)
  cron.schedule("0 20 * * *", async () => {
    console.log("\n📊 [CRON - 20h] Envoi du rapport quotidien");
    await envoyerRapportQuotidien();
  });

  // 4. Nettoyage des données (tous les dimanches à 3h)
  cron.schedule("0 3 * * 0", async () => {
    console.log("\n🧹 [CRON - dimanche 3h] Nettoyage des données");
    await nettoyerLogs();
  });

  console.log("✅ Toutes les tâches cron ont été initialisées");
  console.log("📅 Programme des tâches:");
  console.log("   - 00:00 → Désactivation abonnements expirés");
  console.log("   - 08:00 & 18:00 → Rappels WhatsApp");
  console.log("   - 20:00 → Rapport quotidien à l'admin");
  console.log("   - Dimanche 03:00 → Nettoyage des données");
};

module.exports = { 
  startCronJobs,
  verifierAbonnementsExpires,
  envoyerRappelAbonnement,
  envoyerRapportQuotidien,
  nettoyerLogs
};