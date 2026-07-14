// ═══════════════════════════════════════════════════════════════
// securityAlertService.js - Alertes sécurité par email
// Envoi automatique d'alertes à aziz.hamadi.dev@gmail.com
// ═══════════════════════════════════════════════════════════════

const nodemailer = require('nodemailer');

// Configuration email - Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'aziz.hamadi.dev@gmail.com',
    pass: process.env.EMAIL_PASS || ''  // App password Gmail (16 caractères)
  }
});

// Email destinataire des alertes
const ADMIN_EMAIL = 'aziz.hamadi.dev@gmail.com';

/**
 * Envoie une alerte de connexion suspecte
 */
async function sendLoginAlert({ userEmail, ip, userAgent, success, location = 'Tunisie' }) {
  const subject = success
    ? `🔓 Nouvelle connexion détectée - ETAP`
    : `🚨 ALERTE: Tentative de connexion échouée - ETAP`;

  const statusBadge = success ? '✅ RÉUSSIE' : '❌ ÉCHOUÉE';
  const statusColor = success ? '#10b981' : '#dc2626';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f7fa;">
      <div style="background: linear-gradient(135deg, #0c2c5c 0%, #2d4f8a 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🔐 ETAP - Alerte Sécurité</h1>
        <p style="margin: 8px 0 0; opacity: 0.85;">Notification automatique</p>
      </div>

      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
        <div style="background: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 8px; color: ${statusColor}; font-size: 18px;">
            ${success ? '✅ Connexion Réussie' : '🚨 Tentative Suspecte'}
          </h2>
          <p style="margin: 0; color: #475569;">
            ${success
              ? 'Une nouvelle connexion a été détectée sur votre compte.'
              : 'Une tentative de connexion avec un mot de passe incorrect a été détectée!'}
          </p>
        </div>

        <h3 style="color: #0c2c5c; margin: 20px 0 12px; font-size: 16px;">📋 Détails de la Connexion</h3>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #f8fafc;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; width: 35%;">📧 Email</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">🌐 Adresse IP</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><code>${ip || 'N/A'}</code></td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">📍 Localisation</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${location}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">💻 Navigateur</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-size: 12px;">${userAgent || 'Inconnu'}</td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">⏰ Date / Heure</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${new Date().toLocaleString('fr-TN', { dateStyle: 'full', timeStyle: 'medium' })}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">🔐 Statut</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">
              <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">
                ${statusBadge}
              </span>
            </td>
          </tr>
        </table>

        ${!success ? `
        <div style="background: #fef2f2; border: 1.5px solid #fecaca; padding: 16px; border-radius: 8px; margin-top: 20px;">
          <h4 style="margin: 0 0 8px; color: #dc2626;">⚠️ Action Recommandée</h4>
          <ul style="margin: 8px 0; padding-left: 20px; color: #7f1d1d;">
            <li>Vérifiez si c'est vous qui avez tenté de vous connecter</li>
            <li>Si non, changez immédiatement votre mot de passe</li>
            <li>Activez l'authentification à deux facteurs</li>
            <li>Vérifiez les logs de votre compte</li>
          </ul>
        </div>
        ` : ''}

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">Cette alerte est envoyée automatiquement par le système ETAP</p>
          <p style="margin: 8px 0 0;">© ${new Date().getFullYear()} ETAP - Tous droits réservés</p>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"🔐 ETAP Sécurité" <${process.env.EMAIL_USER || ADMIN_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject,
      html
    });
    console.log(`✅ Alerte sécurité envoyée à ${ADMIN_EMAIL}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Erreur envoi alerte sécurité:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Alerte tentative de piratage (plusieurs tentatives échouées)
 */
async function sendHackAttemptAlert({ userEmail, ip, attempts, userAgent }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f7fa;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🚨 ALERTE CRITIQUE</h1>
        <p style="margin: 8px 0 0; opacity: 0.95; font-size: 16px;">Tentative de piratage détectée!</p>
      </div>

      <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 12px; color: #dc2626; font-size: 22px;">⚠️ PIRATAGE DÉTECTÉ</h2>
          <p style="margin: 0; color: #7f1d1d; font-size: 15px; line-height: 1.6;">
            Plusieurs tentatives de connexion ont échoué sur le compte:
            <strong style="color: #dc2626;">${userEmail}</strong>
          </p>
        </div>

        <div style="background: #fff7ed; border: 1.5px solid #fed7aa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <div style="font-size: 56px; color: #dc2626; margin-bottom: 8px;">🔴</div>
          <div style="font-size: 48px; font-weight: 800; color: #dc2626; line-height: 1;">${attempts}</div>
          <div style="color: #b91c1c; font-weight: 600; margin-top: 4px;">tentatives échouées</div>
        </div>

        <h3 style="color: #0c2c5c; margin: 20px 0 12px;">📋 Détails de l'Attaque</h3>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #f8fafc;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; width: 35%;">🎯 Compte ciblé</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0; color: #dc2626; font-weight: 600;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">🌐 IP Attaquant</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><code style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px;">${ip || 'N/A'}</code></td>
          </tr>
          <tr style="background: #f8fafc;">
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">💻 Navigateur</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-size: 12px;">${userAgent || 'Inconnu'}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">⏰ Détection</td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${new Date().toLocaleString('fr-TN', { dateStyle: 'full', timeStyle: 'medium' })}</td>
          </tr>
        </table>

        <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h4 style="margin: 0 0 12px; font-size: 18px;">🚨 ACTIONS IMMÉDIATES</h4>
          <ol style="margin: 0; padding-left: 24px; line-height: 1.8;">
            <li><strong>Bloquer l'IP</strong>: ${ip}</li>
            <li><strong>Forcer le changement</strong> de mot de passe du compte</li>
            <li><strong>Contacter l'utilisateur</strong> ${userEmail}</li>
            <li><strong>Vérifier les logs</strong> pour d'autres activités suspectes</li>
            <li><strong>Activer 2FA</strong> sur le compte</li>
          </ol>
        </div>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">🔐 Système de détection automatique ETAP</p>
          <p style="margin: 8px 0 0;">© ${new Date().getFullYear()} ETAP - Tous droits réservés</p>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"🚨 ETAP ALERTE CRITIQUE" <${process.env.EMAIL_USER || ADMIN_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `🚨 PIRATAGE: ${attempts} tentatives échouées sur ${userEmail}`,
      html,
      priority: 'high'
    });
    console.log(`🚨 Alerte piratage envoyée à ${ADMIN_EMAIL}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Erreur envoi alerte piratage:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendLoginAlert,
  sendHackAttemptAlert,
  ADMIN_EMAIL
};
