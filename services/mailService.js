const nodemailer = require('nodemailer');

const getTransporter = () => {
  if (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error('Configuration mail incomplète');
  }

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: Number(process.env.MAIL_PORT) === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    text,
    html
  });
};

const sendPaymentConfirmationEmail = async ({
  email,
  nom,
  montant,
  coursNom,
  transactionId,
  expiration
}) => {
  const safeNom = nom || 'cher utilisateur';
  const safeCoursNom = coursNom || 'Abonnement';
  const safeMontant = montant || 0;
  const safeTransactionId = transactionId || 'N/A';
  const safeExpiration = expiration
    ? new Date(expiration).toLocaleString()
    : 'Non définie';

  const subject = 'Confirmation de paiement';

  const text = [
    `Bonjour ${safeNom},`,
    '',
    'Votre paiement a été validé avec succès.',
    `Cours / forfait: ${safeCoursNom}`,
    `Montant: ${safeMontant} FCFA`,
    `Transaction: ${safeTransactionId}`,
    `Accès valable jusqu’au: ${safeExpiration}`,
    '',
    'Merci pour votre confiance.'
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="color: #0d6efd;">Confirmation de paiement</h2>
      <p>Bonjour ${safeNom},</p>
      <p>Votre paiement a été validé avec succès.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Cours / forfait</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${safeCoursNom}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Montant</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${safeMontant} FCFA</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Transaction</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${safeTransactionId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Accès valable jusqu’au</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${safeExpiration}</td>
        </tr>
      </table>

      <p style="margin-top: 20px;">Merci pour votre confiance.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
};

module.exports = {
  sendEmail,
  sendPaymentConfirmationEmail
};
