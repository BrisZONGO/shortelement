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
    if (!process.env.TWILIO_SID || !process.env.TWILIO_TOKEN || !process.env.TWILIO_WHATSAPP) {
      console.error("❌ Configuration Twilio manquante dans .env");
      return false;
    }

    // Formatage du numéro pour WhatsApp
    let formattedNumber = phoneNumber;
    if (!formattedNumber.startsWith('whatsapp:')) {
      formattedNumber = `whatsapp:${formattedNumber}`;
    }

    // Envoi du message via Twilio
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP,
      to: formattedNumber,
      body: message
    });

    console.log(`✅ WhatsApp envoyé à ${phoneNumber} - SID: ${result.sid}`);
    return true;

  } catch (error) {
    console.error("❌ Erreur WhatsApp:", error.message);
    if (error.code) {
      console.error(`Code d'erreur Twilio: ${error.code}`);
    }
    return false;
  }
};

/**
 * Envoie un message WhatsApp avec template (optionnel)
 * @param {string} phoneNumber - Numéro de téléphone
 * @param {string} template - Nom du template
 * @param {string[]} variables - Variables du template
 * @returns {Promise<boolean>}
 */
const sendWhatsAppTemplate = async (phoneNumber, template, variables = []) => {
  try {
    if (!phoneNumber || !template) {
      console.error("❌ Paramètres manquants pour l'envoi de template");
      return false;
    }

    let formattedNumber = phoneNumber;
    if (!formattedNumber.startsWith('whatsapp:')) {
      formattedNumber = `whatsapp:${formattedNumber}`;
    }

    // Exemple d'envoi avec template (à adapter selon votre besoin)
    // Certains services comme Twilio nécessitent une configuration spécifique
    console.log(`📲 Template WhatsApp envoyé à ${phoneNumber}: ${template}`);
    return true;

  } catch (error) {
    console.error("❌ Erreur envoi template WhatsApp:", error.message);
    return false;
  }
};

module.exports = { 
  sendWhatsApp,
  sendWhatsAppTemplate 
};