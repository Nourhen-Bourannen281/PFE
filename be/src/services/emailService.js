// services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendResetPasswordEmail = async (email, resetCode, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
  
  const mailOptions = {
    from: `"ETAP Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe ETAP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a3c5e;">Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Votre code de vérification est :</p>
        <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; border-radius: 10px;">
          ${resetCode}
        </div>
        <p>Ce code expire dans <strong>15 minutes</strong>.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <hr style="margin: 20px 0;" />
        <p style="color: #64748b; font-size: 12px;">© 2026 ETAP - Entreprise Tunisienne d'Activités Pétrolières</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
};

module.exports = { sendResetPasswordEmail };