const twilio = require("twilio");

// Initialisation du client Twilio
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
);

/**
 * Envoie un message WhatsApp via Twilio
 * @param {string} phoneNumber - Numéro de téléphone (format international sans +)
 * @param {string} message - Message à envoyer
 * @returns {Promise<boolean>} - Succès ou échec de l'envoi
 */
const sendWhatsApp = async (phoneNumber, message) => {
  try {
    // Vérification des paramètres requis
    if (!phoneNumber) {
      console.error("❌ Numéro de téléphone manquant");
      return false;
    }

    if (!message) {
      console.error("❌ Message manquant");
      return false;
    }

    // Vérification des variables d'environnement
    if (!process.env.TWILIO_SID || !process.env.TWILIO_TOKEN) {
      console.error("❌ Configuration Twilio manquante dans .env");
      return false;
    }

    // Utiliser le numéro WhatsApp par défaut ou celui du .env
    const fromWhatsApp = process.env.TWILIO_WHATSAPP || "whatsapp:+14155238886";

    // Formatage du numéro pour WhatsApp
    let formattedNumber = phoneNumber;
    if (!formattedNumber.startsWith('whatsapp:')) {
      // Supprimer le '+' s'il existe et ajouter 'whatsapp:'
      const cleanNumber = phoneNumber.replace(/^\+/, '');
      formattedNumber = `whatsapp:${cleanNumber}`;
    }

    console.log(`📤 Envoi WhatsApp à ${formattedNumber}`);
    console.log(`📝 Message: ${message.substring(0, 50)}...`);

    // Envoi du message via Twilio
    const result = await client.messages.create({
      from: fromWhatsApp,
      to: formattedNumber,
      body: message
    });

    console.log(`✅ WhatsApp envoyé à ${phoneNumber} - SID: ${result.sid}`);
    return true;

  } catch (error) {
    console.error("❌ Erreur WhatsApp:", error.message);
    if (error.code) {
      console.error(`Code d'erreur Twilio: ${error.code}`);
      if (error.code === 21211) {
        console.error("⚠️ Numéro de téléphone invalide. Format attendu: 226XXXXXXXX");
      }
      if (error.code === 21610) {
        console.error("⚠️ Le numéro n'est pas enregistré sur WhatsApp Business");
      }
    }
    return false;
  }
};

/**
 * Envoie une confirmation de paiement WhatsApp
 * @param {string} phoneNumber - Numéro du client
 * @param {object} paymentData - Données du paiement
 * @returns {Promise<boolean>}
 */
const sendPaymentConfirmation = async (phoneNumber, paymentData) => {
  const { montant, coursNom, transactionId, date } = paymentData;
  
  const message = `🎉 *Confirmation de paiement* 🎉\n\n` +
    `Bonjour !\n\n` +
    `✅ Votre paiement a été effectué avec succès.\n\n` +
    `📚 *Cours:* ${coursNom}\n` +
    `💰 *Montant:* ${montant} FCFA\n` +
    `🆔 *Transaction:* ${transactionId}\n` +
    `📅 *Date:* ${date || new Date().toLocaleString()}\n\n` +
    `Merci pour votre confiance ! 🙏\n\n` +
    `_Cet email est un message automatique, merci de ne pas y répondre._`;
  
  return sendWhatsApp(phoneNumber, message);
};

/**
 * Envoie un message de bienvenue WhatsApp
 * @param {string} phoneNumber - Numéro du client
 * @param {string} nom - Nom de l'utilisateur
 * @returns {Promise<boolean>}
 */
const sendWelcomeWhatsApp = async (phoneNumber, nom) => {
  const message = `👋 *Bienvenue sur Concours Burkina !* 👋\n\n` +
    `Bonjour ${nom},\n\n` +
    `✅ Votre compte a été créé avec succès.\n\n` +
    `📚 Vous pouvez maintenant accéder à tous nos cours et formations.\n\n` +
    `🔗 Connectez-vous sur notre plateforme pour commencer.\n\n` +
    `Merci de nous faire confiance ! 🙏`;
  
  return sendWhatsApp(phoneNumber, message);
};

/**
 * Envoie un message de rappel WhatsApp
 * @param {string} phoneNumber - Numéro du client
 * @param {string} coursNom - Nom du cours
 * @param {string} dateRappel - Date du rappel
 * @returns {Promise<boolean>}
 */
const sendReminderWhatsApp = async (phoneNumber, coursNom, dateRappel) => {
  const message = `⏰ *Rappel de cours* ⏰\n\n` +
    `Bonjour !\n\n` +
    `Ceci est un rappel pour votre cours :\n\n` +
    `📚 *${coursNom}*\n` +
    `📅 *Date:* ${dateRappel}\n\n` +
    `Ne manquez pas cette session ! 🎓\n\n` +
    `À bientôt !`;
  
  return sendWhatsApp(phoneNumber, message);
};

/**
 * Envoie un message de notification admin WhatsApp
 * @param {string} phoneNumber - Numéro de l'admin
 * @param {object} data - Données de notification
 * @returns {Promise<boolean>}
 */
const sendAdminNotification = async (phoneNumber, data) => {
  const { type, details } = data;
  
  let message = `🔔 *Notification Admin* 🔔\n\n`;
  
  if (type === 'new_user') {
    message += `📝 *Nouvel utilisateur inscrit*\n\n` +
      `👤 Nom: ${details.nom} ${details.prenom}\n` +
      `📧 Email: ${details.email}\n` +
      `📱 Téléphone: ${details.telephone || 'Non renseigné'}\n` +
      `📅 Date: ${new Date().toLocaleString()}`;
  } 
  else if (type === 'new_payment') {
    message += `💰 *Nouveau paiement reçu*\n\n` +
      `👤 Client: ${details.nom} ${details.prenom}\n` +
      `📚 Cours: ${details.coursNom}\n` +
      `💰 Montant: ${details.montant} FCFA\n` +
      `🆔 Transaction: ${details.transactionId}\n` +
      `📅 Date: ${new Date().toLocaleString()}`;
  }
  else {
    message += `📢 ${details.message || 'Nouvelle notification'}`;
  }
  
  return sendWhatsApp(phoneNumber, message);
};

// Exportation de toutes les fonctions
module.exports = { 
  sendWhatsApp,
  sendPaymentConfirmation,
  sendWelcomeWhatsApp,
  sendReminderWhatsApp,
  sendAdminNotification
};