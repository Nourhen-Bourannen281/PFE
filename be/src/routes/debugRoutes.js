const express = require("express");
const router  = express.Router();
const debugController = require("../controllers/debugController");

router.get('/users',              debugController.getDebugUsers);
router.post('/fix-admin',         debugController.fixAdmin);
router.post('/fix-all-passwords', debugController.fixAllPasswords);

// ── Routes de test sécurité ───────────────────────────────────────
const nodemailer = require('nodemailer');

// GET /api/debug/test-email
// Envoie un email de test vers les deux adresses de surveillance
router.get('/test-email', async (req, res) => {
  const ALERT_EMAILS = (
    process.env.ALERT_EMAILS ||
    'ayetbrahimghofrane@gmail.com,nourhenbouranen02@gmail.com'
  ).split(',').map(e => e.trim());

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({
      success: false,
      message: 'SMTP_USER ou SMTP_PASS manquant dans .env'
    });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  const results = [];
  for (const to of ALERT_EMAILS) {
    try {
      await transporter.sendMail({
        from:    `"ETAP Sécurité 🛡️" <${process.env.SMTP_USER}>`,
        to,
        subject: '✅ Test ETAP — Système d\'alerte fonctionnel',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;
                      border-radius:10px;overflow:hidden;
                      box-shadow:0 4px 16px rgba(0,0,0,.12)">
            <div style="background:linear-gradient(135deg,#1a3c5e,#0ea5e9);
                        padding:24px 28px;">
              <h2 style="color:#fff;margin:0;">✅ Test réussi — ETAP</h2>
            </div>
            <div style="background:#fff;padding:24px 28px;">
              <p>Le système d'alerte email fonctionne correctement.</p>
              <p>Vous recevrez des notifications pour :</p>
              <ul>
                <li>🚨 Tentatives de piratage (brute-force)</li>
                <li>👤 Connexions Client / Fournisseur</li>
                <li>⚠️ Activités anormales</li>
              </ul>
              <p style="color:#64748b;font-size:.85rem;">
                Envoyé le ${new Date().toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        `
      });
      results.push({ email: to, status: '✅ Envoyé' });
      console.log(`📧 Email test envoyé → ${to}`);
    } catch (err) {
      results.push({ email: to, status: `❌ Erreur: ${err.message}` });
      console.error(`❌ Erreur email ${to}:`, err.message);
    }
  }

  res.json({ success: true, results });
});

// GET /api/debug/test-brute-force
// Simule une alerte brute-force
router.get('/test-brute-force', async (req, res) => {
  try {
    const securityService = require('../services/securityService');
    await securityService.alertBruteForce({
      email:     'test@example.com',
      ipAddress: '192.168.1.100',
      attempts:  5
    });
    res.json({ success: true, message: 'Alerte brute-force simulée — vérifiez vos emails et Telegram' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/debug/test-client-login
// Simule une alerte connexion Client
router.get('/test-client-login', async (req, res) => {
  try {
    const securityService = require('../services/securityService');
    await securityService.alertClientLogin({
      userName:  'Ahmed Ben Ali',
      userEmail: 'ahmed@client.com',
      userRole:  'Client',
      ipAddress: '192.168.1.50'
    });
    res.json({ success: true, message: 'Alerte connexion Client simulée — vérifiez vos emails' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;