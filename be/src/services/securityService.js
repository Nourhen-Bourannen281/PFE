// services/securityService.js
// Centralise toutes les alertes de sécurité :
//   • Notification in-app pour chaque admin (DB)
//   • Email HTML vers les adresses de surveillance fixes
//   • Message Telegram à l'admin
//
// Adresses de surveillance (toujours notifiées) :
//   ALERT_EMAILS dans .env  — séparées par une virgule
//   Par défaut : ayetbrahimghofrane@gmail.com, nourhenbouranen02@gmail.com

const nodemailer              = require('nodemailer');
const { sendTelegramMessage } = require('./telegramService');
const Notification            = require('../models/Notification');
const User                    = require('../models/User');

// ── Adresses fixes de surveillance ───────────────────────────────────
// Lues depuis .env (ALERT_EMAILS) ou valeur par défaut ci-dessous
const FIXED_ALERT_EMAILS = (
  process.env.ALERT_EMAILS ||
  'ayetbrahimghofrane@gmail.com,nourhenbouranen02@gmail.com'
)
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

// ── Transporteur SMTP (Gmail) ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────

/** Retourne les admins actifs de la DB */
const getAdmins = async () => {
  try {
    return await User.find({ role: 'Admin', actif: { $ne: false } }).select('_id email nom');
  } catch {
    return [];
  }
};

/** Notification in-app pour chaque admin DB */
const notifyAdmins = async (title, message, type = 'warning') => {
  try {
    const admins = await getAdmins();
    if (!admins.length) return;
    await Notification.insertMany(
      admins.map(a => ({
        userId: a._id,
        title,
        message,
        type,
        read:   false,
        isRead: false,
      }))
    );
  } catch (err) {
    console.error('⚠️ notifyAdmins error:', err.message);
  }
};

/**
 * Envoie un email HTML vers :
 *  - les adresses fixes FIXED_ALERT_EMAILS
 *  - (en option) les admins de la DB
 */
const sendAlertEmails = async (subject, html, includeDbAdmins = false) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  // Construction de la liste des destinataires (dédoublonnée)
  const recipients = new Set(FIXED_ALERT_EMAILS);
  if (includeDbAdmins) {
    const admins = await getAdmins();
    admins.forEach(a => recipients.add(a.email));
  }

  for (const to of recipients) {
    try {
      await transporter.sendMail({
        from:    `"ETAP Sécurité 🛡️" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`📧 Alerte envoyée → ${to}`);
    } catch (err) {
      console.error(`⚠️ Erreur email vers ${to} :`, err.message);
    }
  }
};

const now = () =>
  new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' });


// ═══════════════════════════════════════════════════════════════════
//  1. BRUTE-FORCE / TENTATIVE DE PIRATAGE
// ═══════════════════════════════════════════════════════════════════
exports.alertBruteForce = async ({ email, ipAddress, attempts }) => {
  const t = now();

  console.log(`🚨 BRUTE-FORCE détecté : ${email} — ${attempts} tentatives — IP ${ipAddress}`);

  // ── In-app ──────────────────────────────────────────────────────
  await notifyAdmins(
    '🚨 Tentative de piratage détectée',
    `${attempts} tentatives échouées pour "${email}" depuis ${ipAddress} à ${t}`,
    'error'
  );

  // ── Email ────────────────────────────────────────────────────────
  await sendAlertEmails(
    '🚨 ETAP — Alerte sécurité : Tentative de piratage',
    `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
                border-radius:12px;overflow:hidden;
                box-shadow:0 4px 24px rgba(0,0,0,.18)">

      <!-- En-tête rouge -->
      <div style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);
                  padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:1.45rem;font-weight:800;">
          🚨 Alerte Sécurité — ETAP
        </h1>
        <p style="color:rgba(255,255,255,.82);margin:8px 0 0;font-size:.95rem;">
          Tentative de connexion par force brute détectée
        </p>
      </div>

      <!-- Corps -->
      <div style="background:#fff;padding:28px 32px;">
        <table style="width:100%;border-collapse:collapse;font-size:.95rem;">
          <tr>
            <td style="padding:11px 14px;color:#6b7280;font-weight:700;width:38%;">
              🎯 Email ciblé
            </td>
            <td style="padding:11px 14px;color:#dc2626;font-weight:700;">
              ${email}
            </td>
          </tr>
          <tr style="background:#fef2f2;">
            <td style="padding:11px 14px;color:#6b7280;font-weight:700;">
              🌐 Adresse IP
            </td>
            <td style="padding:11px 14px;font-family:monospace;">
              ${ipAddress}
            </td>
          </tr>
          <tr>
            <td style="padding:11px 14px;color:#6b7280;font-weight:700;">
              🔁 Tentatives
            </td>
            <td style="padding:11px 14px;color:#dc2626;font-weight:800;font-size:1.1rem;">
              ${attempts} tentatives consécutives
            </td>
          </tr>
          <tr style="background:#fef2f2;">
            <td style="padding:11px 14px;color:#6b7280;font-weight:700;">
              🕐 Heure
            </td>
            <td style="padding:11px 14px;">
              ${t}
            </td>
          </tr>
        </table>

        <div style="margin-top:22px;padding:16px 20px;
                    background:#fef2f2;border-left:4px solid #dc2626;
                    border-radius:0 8px 8px 0;">
          <strong>⚠️ Action recommandée :</strong><br/>
          Connectez-vous à votre tableau de bord ETAP et bloquez l'IP
          <code style="background:#fee2e2;padding:2px 6px;border-radius:4px;">
            ${ipAddress}
          </code>
          si l'activité est suspecte.
        </div>
      </div>

      <div style="background:#f1f5f9;padding:12px 32px;text-align:center;
                  color:#94a3b8;font-size:.78rem;">
        © 2026 ETAP — Système de surveillance automatique
      </div>
    </div>
    `,
    true   // inclure aussi les admins DB
  );

  // ── Telegram ─────────────────────────────────────────────────────
  await sendTelegramMessage(
    `🚨 <b>ALERTE PIRATAGE — ETAP</b>\n\n` +
    `🎯 Email ciblé  : <code>${email}</code>\n` +
    `🌐 IP suspecte  : <code>${ipAddress}</code>\n` +
    `🔁 Tentatives   : <b>${attempts}</b>\n` +
    `🕐 Heure        : ${t}\n\n` +
    `⚠️ Vérifiez immédiatement votre tableau de bord !`
  );
};


// ═══════════════════════════════════════════════════════════════════
//  2. CONNEXION D'UN CLIENT OU FOURNISSEUR
// ═══════════════════════════════════════════════════════════════════
exports.alertClientLogin = async ({ userName, userEmail, userRole, ipAddress }) => {
  const t     = now();
  const emoji = userRole === 'Client' ? '👤' : '🏭';
  const color = userRole === 'Client' ? '#0ea5e9' : '#8b5cf6';

  console.log(`${emoji} Connexion ${userRole} : ${userEmail} — IP ${ipAddress}`);

  // ── In-app ──────────────────────────────────────────────────────
  await notifyAdmins(
    `${emoji} Connexion ${userRole} détectée`,
    `${userName} (${userEmail}) s'est connecté le ${t} — IP : ${ipAddress}`,
    'info'
  );

  // ── Email ────────────────────────────────────────────────────────
  await sendAlertEmails(
    `${emoji} ETAP — Connexion ${userRole} : ${userName}`,
    `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
                border-radius:12px;overflow:hidden;
                box-shadow:0 4px 24px rgba(0,0,0,.15)">

      <!-- En-tête coloré -->
      <div style="background:linear-gradient(135deg,${color} 0%,#1e3a5f 100%);
                  padding:28px 32px;">
        <h1 style="color:#fff;margin:0;font-size:1.4rem;font-weight:800;">
          ${emoji} Connexion ${userRole} — ETAP
        </h1>
        <p style="color:rgba(255,255,255,.82);margin:8px 0 0;font-size:.93rem;">
          Un ${userRole.toLowerCase()} vient de se connecter à l'application
        </p>
      </div>

      <!-- Corps -->
      <div style="background:#fff;padding:28px 32px;">
        <table style="width:100%;border-collapse:collapse;font-size:.95rem;">
          <tr>
            <td style="padding:11px 14px;color:#6b7280;font-weight:700;width:38%;">
              👤 Nom / Raison sociale
            </td>
            <td style="padding:11px 14px;font-weight:700;color:#1e293b;">
              ${userName}
            </td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:11px 14px;color:#6b7280;font-weight:700;">
              📧 Email
            </td>
            <td style="padding:11px 14px;">
              ${userEmail}
            </td>
          </tr>
          <tr>
            <td style="padding:11px 14px;color:#6b7280;font-weight:700;">
              🏷️ Rôle
            </td>
            <td style="padding:11px 14px;">
              <span style="background:${color};color:#fff;padding:3px 10px;
                           border-radius:999px;font-size:.85rem;font-weight:600;">
                ${userRole}
              </span>
            </td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:11px 14px;color:#6b7280;font-weight:700;">
              🌐 Adresse IP
            </td>
            <td style="padding:11px 14px;font-family:monospace;">
              ${ipAddress}
            </td>
          </tr>
          <tr>
            <td style="padding:11px 14px;color:#6b7280;font-weight:700;">
              🕐 Heure
            </td>
            <td style="padding:11px 14px;">
              ${t}
            </td>
          </tr>
        </table>

        <div style="margin-top:22px;padding:16px 20px;
                    background:#f0f9ff;border-left:4px solid ${color};
                    border-radius:0 8px 8px 0;color:#0369a1;">
          Si cette connexion vous semble suspecte, vous pouvez désactiver ce compte
          depuis le panneau <strong>Utilisateurs</strong> de votre tableau de bord.
        </div>
      </div>

      <div style="background:#f1f5f9;padding:12px 32px;text-align:center;
                  color:#94a3b8;font-size:.78rem;">
        © 2026 ETAP — Surveillance des connexions
      </div>
    </div>
    `
  );

  // ── Telegram ─────────────────────────────────────────────────────
  await sendTelegramMessage(
    `${emoji} <b>Connexion ${userRole} — ETAP</b>\n\n` +
    `👤 Nom    : ${userName}\n` +
    `📧 Email  : ${userEmail}\n` +
    `🌐 IP     : ${ipAddress}\n` +
    `🕐 Heure  : ${t}`
  );
};


// ═══════════════════════════════════════════════════════════════════
//  3. ACTIVITÉ ANORMALE (flux Flask → Node)
// ═══════════════════════════════════════════════════════════════════
exports.alertAnomaly = async ({ userId, action, entityType, ipAddress, riskScore }) => {
  const t = now();

  await notifyAdmins(
    '⚠️ Activité suspecte détectée',
    `Utilisateur ${userId} — ${action} sur ${entityType} — Score : ${riskScore}/100 — IP : ${ipAddress}`,
    'warning'
  );

  // Email seulement si score très élevé (≥ 70)
  if (riskScore >= 70) {
    await sendAlertEmails(
      `⚠️ ETAP — Activité anormale (score ${riskScore}/100)`,
      `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
                  border-radius:12px;overflow:hidden;
                  box-shadow:0 4px 20px rgba(0,0,0,.15)">
        <div style="background:linear-gradient(135deg,#d97706,#92400e);padding:24px 30px;">
          <h1 style="color:#fff;margin:0;font-size:1.35rem;font-weight:800;">
            ⚠️ Activité Anormale — ETAP
          </h1>
        </div>
        <div style="background:#fff;padding:24px 30px;">
          <table style="width:100%;border-collapse:collapse;font-size:.93rem;">
            <tr><td style="padding:9px 12px;color:#6b7280;font-weight:700;">👤 Utilisateur</td>
                <td style="padding:9px 12px;">${userId}</td></tr>
            <tr style="background:#fffbeb;"><td style="padding:9px 12px;color:#6b7280;font-weight:700;">⚡ Action</td>
                <td style="padding:9px 12px;">${action} sur ${entityType}</td></tr>
            <tr><td style="padding:9px 12px;color:#6b7280;font-weight:700;">🔢 Score risque</td>
                <td style="padding:9px 12px;color:#d97706;font-weight:800;">${riskScore} / 100</td></tr>
            <tr style="background:#fffbeb;"><td style="padding:9px 12px;color:#6b7280;font-weight:700;">🌐 IP</td>
                <td style="padding:9px 12px;font-family:monospace;">${ipAddress}</td></tr>
            <tr><td style="padding:9px 12px;color:#6b7280;font-weight:700;">🕐 Heure</td>
                <td style="padding:9px 12px;">${t}</td></tr>
          </table>
        </div>
        <div style="background:#f1f5f9;padding:12px 30px;text-align:center;color:#94a3b8;font-size:.78rem;">
          © 2026 ETAP — Système de surveillance automatique
        </div>
      </div>
      `
    );
  }

  await sendTelegramMessage(
    `⚠️ <b>Activité Suspecte — ETAP</b>\n\n` +
    `👤 Utilisateur : <code>${userId}</code>\n` +
    `⚡ Action       : ${action} sur ${entityType}\n` +
    `🔢 Score risque : <b>${riskScore}/100</b>\n` +
    `🌐 IP           : ${ipAddress}\n` +
    `🕐 Heure        : ${t}`
  );
};
