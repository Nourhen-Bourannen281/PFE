const User = require('../models/User');
const ResetCode = require('../models/ResetCode');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios');



// ── Service d'alertes email ──────────────
let securityAlertService = null;
try {
  securityAlertService = require('../services/securityAlertService');
  console.log('✅ securityAlertService chargé - Alertes');
} catch (err) {
  console.log('⚠️ securityAlertService non trouvé:', err.message);
}



const FLASK_URL = process.env.FLASK_URL || 'http://localhost:5001';

// Notifie Flask d'un échec et retourne { attempts, brute_force }
const reportLoginFailed = async (email) => {
  try {
    const { data } = await axios.post(`${FLASK_URL}/login-failed`, { email }, { timeout: 2000 });
    return data;
  } catch {
    return { attempts: 1, brute_force: false };
  }
};

// Réinitialise le compteur d'échecs après un login réussi
const reportLoginSuccess = async (email) => {
  try {
    await axios.post(`${FLASK_URL}/login-success`, { email }, { timeout: 2000 });
  } catch { /* silencieux */ }
};

// Configuration socket pour les notifications
let createAndSendNotification = null;
try {
  const socket = require('../config/socket');
  createAndSendNotification = socket.createAndSendNotification;
} catch (err) {
  console.log('⚠️ Socket non configuré, notifications désactivées');
  createAndSendNotification = async () => {};
}

// Modèle History (si disponible)
let History = null;
try {
  History = require('../models/History');
} catch (err) {
  console.log('⚠️ Modèle History non trouvé, journalisation désactivée');
}

// Configuration email Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // false pour port 587 (TLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Vérifier la connexion SMTP au démarrage
transporter.verify((error) => {
  if (error) {
    console.error('❌ Erreur configuration email:', error.message);
    console.error('💡 Vérifier EMAIL_USER et EMAIL_PASS dans .env');
    console.error('💡 EMAIL_PASS doit être un App Password Gmail (16 caractères)');
  } else {
    console.log('✅ Configuration email OK - Prêt à envoyer des emails');
  }
});

// ==================== FONCTIONS UTILITAIRES ====================

const generateJWTToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET || 'etapgas2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const escapeEmail = (email) => {
  return email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Journaliser les actions
const logAction = async (userId, userRole, userEmail, action, entityType, entityId, details, req) => {
  if (!History) return;
  
  try {
    await History.create({
      userId,
      userRole,
      userEmail,
      action,
      entityType,
      entityId,
      details,
      ipAddress: req?.ip || 'unknown',
      userAgent: req?.headers?.['user-agent'] || 'unknown'
    });
  } catch (err) {
    console.error('Erreur journalisation:', err);
  }
};

// ==================== AUTHENTIFICATION ====================

// LOGIN - Connexion utilisateur
exports.login = async (req, res) => {
  try {
    const { email, password, motDePasse } = req.body;
    const loginPassword = password || motDePasse;
    
    if (!email || !loginPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Email et mot de passe requis' 
      });
    }
    
    console.log('🔐 Tentative de login:', email);
    
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${escapeEmail(email)}$`, 'i') }
    });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé:', email);
      // Compte quand même comme tentative échouée
      const failInfo = await reportLoginFailed(email);

      // 📧 Envoyer alerte email 
      if (securityAlertService) {
        securityAlertService.sendLoginAlert({
          userEmail: email,
          ip: req.ip || req.headers['x-forwarded-for'] || 'Inconnu',
          userAgent: req.headers['user-agent'] || 'Inconnu',
          success: false
        }).catch(err => console.error('Erreur alerte email:', err));
      }

      if (failInfo.brute_force && securityService) {
        securityService.alertBruteForce({
          email,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '?',
          attempts: failInfo.attempts,
        }).catch(() => {});
      }
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    console.log('✅ Utilisateur trouvé:', user.email, 'Rôle:', user.role);
    
    if (user.actif === false || user.isActive === false) {
      console.log('⚠️ Compte désactivé:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Compte désactivé. Veuillez contacter l\'administrateur.' 
      });
    }
    
    const isMatch = await user.comparePassword(loginPassword);
    console.log('🔑 Mot de passe valide:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Mot de passe incorrect pour:', email);
      // Signaler l'échec à Flask
      const failInfo = await reportLoginFailed(email);
      console.log(`⚠️ Tentatives pour ${email}: ${failInfo.attempts}`);

      const ip = req.ip || req.headers['x-forwarded-for'] || 'Inconnu';
      const userAgent = req.headers['user-agent'] || 'Inconnu';

      // 📧 Alerte email - chaque tentative échouée
      if (securityAlertService) {
        // Si >= 3 tentatives → Alerte PIRATAGE critique
        if (failInfo.attempts >= 3) {
          securityAlertService.sendHackAttemptAlert({
            userEmail: email,
            ip,
            attempts: failInfo.attempts,
            userAgent
          }).catch(err => console.error('Erreur alerte piratage:', err));
        } else {
          // Sinon alerte normale tentative échouée
          securityAlertService.sendLoginAlert({
            userEmail: email,
            ip,
            userAgent,
            success: false
          }).catch(err => console.error('Erreur alerte email:', err));
        }
      }

      if (failInfo.brute_force && securityService) {
        securityService.alertBruteForce({
          email,
          ipAddress: ip,
          attempts: failInfo.attempts,
        }).catch(() => {});
      }
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    // 📧 Alerte email - Connexion réussie à aziz.hamadi.dev@gmail.com
    if (securityAlertService) {
      securityAlertService.sendLoginAlert({
        userEmail: user.email,
        ip: req.ip || req.headers['x-forwarded-for'] || 'Inconnu',
        userAgent: req.headers['user-agent'] || 'Inconnu',
        success: true
      }).catch(err => console.error('Erreur alerte connexion réussie:', err));
    }

    // Réinitialise le compteur d'échecs
    reportLoginSuccess(email).catch(() => {});

    const token = generateJWTToken(user._id, user.role);

    await createAndSendNotification(
      user._id,
      'Nouvelle connexion',
      `Vous vous êtes connecté le ${new Date().toLocaleString()}`,
      'info'
    );

    // ── Alerte admin si Client ou Fournisseur se connecte ──────────
    if (['Client', 'Fournisseur'].includes(user.role) && securityService) {
      securityService.alertClientLogin({
        userName:  user.raisonSociale || user.nom || user.email,
        userEmail: user.email,
        userRole:  user.role,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '?',
      }).catch(() => {});
    }
    
    const userData = {
      id: user._id,
      nom: user.raisonSociale || user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      adresse: user.adresse,
      role: user.role,
      code: user.code,
      actif: user.actif
    };
    
    await logAction(
      user._id, user.role, user.email, 'login', 
      'user', user._id, { email: user.email }, req
    );
    
    console.log('🎉 Login réussi pour:', email);
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userData
    });
    
  } catch (err) {
    console.error('❌ Erreur login:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la connexion' 
    });
  }
};

// REGISTER - Inscription utilisateur
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, adresse, role, raisonSociale } = req.body;
    
    if (!nom || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Nom, email et mot de passe requis' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }
    
    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${escapeEmail(email)}$`, 'i') }
    });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Cet email est déjà utilisé' 
      });
    }
    
    const code = `USER${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const user = new User({
      nom,
      prenom,
      email: email.toLowerCase(),
      password,
      telephone,
      adresse,
      role: role || 'Client',
      raisonSociale: raisonSociale || nom,
      code,
      actif: true,
      isActive: true
    });
    
    await user.save();
    
    const token = generateJWTToken(user._id, user.role);
    
    await logAction(
      user._id, user.role, user.email, 'create', 
      'user', user._id, { nom, email, role: user.role }, req
    );
    
    console.log(`📝 Nouvel utilisateur inscrit: ${user.email} (${user.role})`);
    
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        adresse: user.adresse,
        role: user.role,
        code: user.code
      }
    });
    
  } catch (err) {
    console.error('❌ Erreur register:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de l\'inscription' 
    });
  }
};

// QR CODE LOGIN - Connexion par QR code
exports.qrLogin = async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ success: false, message: 'qrData manquant' });
    }

    let user = null;

    // Cas 1 : JWT valide
    try {
      const decoded = jwt.verify(qrData, process.env.JWT_SECRET || 'etapgas2026');
      user = await User.findById(decoded.id || decoded._id || decoded.userId);
    } catch (_) {}

    // Cas 2 : JSON { email, password }
    if (!user) {
      try {
        const creds = JSON.parse(qrData);
        if (creds.email && creds.password) {
          const found = await User.findOne({
            email: { $regex: new RegExp(`^${escapeEmail(creds.email)}$`, 'i') }
          });
          if (found) {
            const ok = await found.comparePassword(creds.password);
            if (ok) user = found;
          }
        }
      } catch (_) {}
    }

    // Cas 3 : email seul
    if (!user) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(qrData.trim())) {
        user = await User.findOne({
          email: { $regex: new RegExp(`^${escapeEmail(qrData.trim())}$`, 'i') }
        });
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'QR Code invalide ou expiré' });
    }

    if (user.actif === false || user.isActive === false) {
      return res.status(401).json({ success: false, message: 'Compte désactivé' });
    }

    const token = generateJWTToken(user._id, user.role);
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    const userData = {
      id: user._id,
      nom: user.raisonSociale || user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      adresse: user.adresse,
      role: user.role,
      code: user.code,
      actif: user.actif
    };

    console.log('📱 QR Login réussi:', user.email);
    res.json({ success: true, message: 'Connexion QR réussie', token, user: userData });
  } catch (err) {
    console.error('Erreur qr-login:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// LOGOUT - Déconnexion
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await logAction(
        req.user._id, req.user.role, req.user.email, 'logout', 
        'user', req.user._id, {}, req
      );
      console.log(`👋 Déconnexion: ${req.user.email}`);
    }
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (err) {
    console.error('Erreur logout:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la déconnexion' 
    });
  }
};

// GET ME - Obtenir le profil de l'utilisateur connecté
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -motDePasse -resetPasswordCode -resetPasswordToken -resetPasswordExpire');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        nom: user.raisonSociale || user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        adresse: user.adresse,
        role: user.role,
        code: user.code,
        actif: user.actif,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Erreur getMe:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};

// UPDATE PROFILE - Mettre à jour le profil
exports.updateProfile = async (req, res) => {
  try {
    const { nom, prenom, telephone, adresse } = req.body;
    
    if (nom) req.user.nom = nom;
    if (prenom) req.user.prenom = prenom;
    if (telephone) req.user.telephone = telephone;
    if (adresse) req.user.adresse = adresse;
    
    await req.user.save({ validateBeforeSave: false });
    
    await logAction(
      req.user._id, req.user.role, req.user.email, 'update_profile', 
      'user', req.user._id, { nom, prenom, telephone, adresse }, req
    );
    
    res.json({
      success: true,
      message: 'Profil mis à jour',
      user: {
        id: req.user._id,
        nom: req.user.nom,
        prenom: req.user.prenom,
        email: req.user.email,
        telephone: req.user.telephone,
        adresse: req.user.adresse,
        role: req.user.role
      }
    });
  } catch (err) {
    console.error('Erreur updateProfile:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};

// CHANGE PASSWORD - Changer le mot de passe
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Mot de passe actuel et nouveau requis' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
      });
    }
    
    const isMatch = await req.user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Mot de passe actuel incorrect' 
      });
    }
    
    req.user.password = newPassword;
    await req.user.save();
    
    await logAction(
      req.user._id, req.user.role, req.user.email, 'change_password', 
      'user', req.user._id, {}, req
    );
    
    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
    
  } catch (err) {
    console.error('Erreur changePassword:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur' 
    });
  }
};

// ==================== FORGOT PASSWORD (CODE À 6 CHIFFRES) ====================

// FORGOT PASSWORD - Envoyer le code de réinitialisation
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      console.log(`⚠️ Tentative reset pour email inexistant: ${normalizedEmail}`);
      // Message neutre pour ne pas révéler si l'email existe
      return res.json({
        success: true,
        message: '📧 Si votre email existe, vous recevrez un code de vérification dans quelques instants',
        dev_email_exists: false
      });
    }

    // Vérifier que le compte est actif
    if (user.actif === false || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: '⚠️ Votre compte est désactivé. Contactez l\'administrateur.'
      });
    }
    
    await ResetCode.deleteMany({ email: normalizedEmail, used: false });
    
    const code = generateResetCode();
    const resetToken = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    await ResetCode.create({
      email: normalizedEmail,
      code,
      resetToken,
      expiresAt,
      used: false,
      attempts: 0
    });
    
    user.resetPasswordCode = code;
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = expiresAt;
    await user.save({ validateBeforeSave: false });
    
    console.log(`📧 Code reset pour ${normalizedEmail}: ${code}`);
    
    // Envoyer l'email avec design SMART-TRADE 360°
    console.log(`📧 Tentative d'envoi email à ${user.email}...`);
    try {
      const userName = user.raisonSociale || `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email;
      const userRole = user.role || 'Utilisateur';

      const info = await transporter.sendMail({
          from: `"SMART-TRADE 360° Sécurité" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: '🔐 Code de réinitialisation - SMART-TRADE 360°',
          html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f7fa; padding: 20px;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #0c2c5c 0%, #3a5fa0 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 8px;">🔐</div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">SMART-TRADE 360°</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Réinitialisation de mot de passe</p>
              </div>

              <!-- Body -->
              <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">

                <h2 style="color: #0c2c5c; margin: 0 0 16px; font-size: 20px;">
                  Bonjour <strong>${userName}</strong> 👋
                </h2>

                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                  Vous avez demandé une réinitialisation de votre mot de passe sur SMART-TRADE 360°.
                </p>

                <div style="background: #eef2f9; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
                  <p style="margin: 0; font-size: 13px; color: #475569;">
                    <strong>👤 Compte :</strong> ${user.email}<br>
                    <strong>🔐 Rôle :</strong> ${userRole}
                  </p>
                </div>

                <!-- Code Box -->
                <div style="background: linear-gradient(135deg, #0c2c5c 0%, #3a5fa0 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 24px 0;">
                  <p style="color: rgba(255,255,255,0.85); margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                    Votre code de vérification
                  </p>
                  <div style="background: white; color: #0c2c5c; padding: 20px; border-radius: 8px; font-size: 36px; letter-spacing: 12px; font-weight: 800; font-family: 'Courier New', monospace;">
                    ${code}
                  </div>
                  <p style="color: rgba(255,255,255,0.7); margin: 12px 0 0; font-size: 12px;">
                    ⏰ Valable pendant <strong>15 minutes</strong>
                  </p>
                </div>

                <!-- Instructions -->
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #f59e0b; margin: 0 0 8px; font-size: 14px;">📋 Comment l'utiliser ?</h3>
                  <ol style="margin: 8px 0; padding-left: 20px; color: #78350f; font-size: 13px;">
                    <li>Retournez sur la page de connexion</li>
                    <li>Entrez le code à 6 chiffres ci-dessus</li>
                    <li>Créez votre nouveau mot de passe</li>
                    <li>Connectez-vous avec votre nouveau mot de passe ✅</li>
                  </ol>
                </div>

                <!-- Security Warning -->
                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #dc2626; margin: 0 0 8px; font-size: 14px;">🚨 Important - Sécurité</h3>
                  <ul style="margin: 8px 0; padding-left: 20px; color: #7f1d1d; font-size: 13px;">
                    <li><strong>Ne partagez JAMAIS ce code</strong> avec personne</li>
                    <li>L'équipe SMART-TRADE 360° ne vous demandera jamais ce code</li>
                    <li>Si vous n'avez pas demandé cette réinitialisation, <strong>ignorez cet email</strong></li>
                    <li>Vérifiez l'URL de connexion (méfiez-vous du phishing)</li>
                  </ul>
                </div>

                <!-- Footer -->
                <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    Cet email a été envoyé automatiquement par <strong>SMART-TRADE 360°</strong><br>
                    Si vous avez besoin d'aide, contactez le support : <a href="mailto:support@smart-trade360.com" style="color: #3a5fa0;">support@smart-trade360.com</a>
                  </p>
                  <p style="color: #cbd5e1; font-size: 11px; margin: 12px 0 0;">
                    © ${new Date().getFullYear()} SMART-TRADE 360° - Tous droits réservés
                  </p>
                </div>
              </div>
            </div>
          `
        });
      console.log(`✅ Email envoyé avec succès à ${user.email}`);
      console.log(`📨 Message ID: ${info.messageId}`);
      console.log(`📬 Code: ${code}`);
    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError.message);
      console.error('💡 Code généré (pour test):', code);
      // Ne pas bloquer l'utilisateur si l'email échoue
    }
    
    res.json({
      success: true,
      message: `📧 Code de vérification envoyé à ${normalizedEmail}. Vérifiez votre boîte de réception (et les spams).`,
      resetToken: resetToken,
      email: normalizedEmail,
      expiresIn: '15 minutes',
      dev_code: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (err) {
    console.error('❌ Erreur forgot-password:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// VERIFY RESET CODE - Vérifier le code
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code, resetToken } = req.body;
    
    if (!email || !code || !resetToken) {
      return res.status(400).json({ message: 'Email, code et token requis' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    const resetCode = await ResetCode.findOne({
      email: normalizedEmail,
      code: code,
      resetToken: resetToken,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!resetCode) {
      const expiredCode = await ResetCode.findOne({
        email: normalizedEmail,
        code: code,
        used: false,
        expiresAt: { $lte: new Date() }
      });
      
      if (expiredCode) {
        return res.status(400).json({ message: 'Code expiré. Veuillez en demander un nouveau.' });
      }
      
      const existingCode = await ResetCode.findOne({
        email: normalizedEmail,
        code: code,
        resetToken: resetToken
      });
      
      if (existingCode) {
        existingCode.attempts += 1;
        await existingCode.save();
        
        const remainingAttempts = 5 - existingCode.attempts;
        if (remainingAttempts <= 0) {
          await ResetCode.deleteOne({ _id: existingCode._id });
          return res.status(400).json({ message: 'Trop de tentatives. Veuillez demander un nouveau code.' });
        }
        
        return res.status(400).json({
          message: `Code incorrect. Il vous reste ${remainingAttempts} tentative(s).`
        });
      }
      
      return res.status(400).json({ message: 'Code invalide' });
    }
    
    resetCode.used = true;
    await resetCode.save();
    
    const tempToken = generateResetToken();
    
    console.log(`✅ Code vérifié pour ${normalizedEmail}`);
    
    res.json({
      success: true,
      message: 'Code vérifié avec succès',
      tempToken: tempToken
    });
  } catch (err) {
    console.error('❌ Erreur verify-reset-code:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// RESET PASSWORD - Réinitialiser le mot de passe
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword, resetToken } = req.body;
    
    if (!email || !code || !newPassword || !resetToken) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    const resetCode = await ResetCode.findOne({
      email: normalizedEmail,
      code: code,
      resetToken: resetToken,
      used: true
    });
    
    if (!resetCode) {
      return res.status(400).json({ message: 'Code non vérifié ou invalide.' });
    }
    
    const verificationTime = resetCode.updatedAt || resetCode.createdAt;
    const timeDiff = (new Date() - verificationTime) / 1000 / 60;
    
    if (timeDiff > 15) {
      return res.status(400).json({ message: 'Délai expiré. Veuillez recommencer.' });
    }
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save({ validateBeforeSave: false });
    
    await ResetCode.deleteMany({ email: normalizedEmail });
    
    await createAndSendNotification(
      user._id,
      'Mot de passe modifié',
      'Votre mot de passe a été réinitialisé avec succès',
      'success'
    );
    
    console.log(`✅ Mot de passe réinitialisé pour ${normalizedEmail}`);
    
    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    console.error('❌ Erreur reset-password:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// RESEND RESET CODE - Renvoyer le code
exports.resendResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.json({
        success: true,
        message: 'Si votre email est enregistré, vous recevrez un nouveau code'
      });
    }
    
    await ResetCode.deleteMany({ email: normalizedEmail, used: false });
    
    const code = generateResetCode();
    const resetToken = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    await ResetCode.create({
      email: normalizedEmail,
      code,
      resetToken,
      expiresAt,
      used: false,
      attempts: 0
    });
    
    user.resetPasswordCode = code;
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = expiresAt;
    await user.save({ validateBeforeSave: false });
    
    console.log(`📧 Nouveau code pour ${normalizedEmail}: ${code}`);
    
    res.json({
      success: true,
      message: 'Nouveau code envoyé',
      resetToken: resetToken,
      dev_code: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (err) {
    console.error('❌ Erreur resend-reset-code:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// ==================== GESTION DES UTILISATEURS (ADMIN) ====================

// CREATE USER - Créer un utilisateur (Admin)
exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, password, telephone, adresse, role } = req.body;
    
    if (!nom || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Nom, email et mot de passe requis' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }
    
    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${escapeEmail(email)}$`, 'i') }
    });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Cet email est déjà utilisé' 
      });
    }
    
    const code = `USER${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const newUser = new User({
      nom,
      prenom,
      email: email.toLowerCase(),
      password,
      telephone,
      adresse,
      role: role || 'Client',
      code,
      actif: true,
      isActive: true
    });
    
    await newUser.save();
    
    await logAction(
      req.user?._id, req.user?.role, req.user?.email, 'create_user', 
      'user', newUser._id, { email: newUser.email, role: newUser.role }, req
    );
    
    console.log(`👤 Nouvel utilisateur créé par admin: ${newUser.email} (${newUser.role})`);
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser._id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        telephone: newUser.telephone,
        adresse: newUser.adresse,
        role: newUser.role,
        code: newUser.code,
        actif: newUser.actif,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    console.error('❌ Erreur createUser:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ALL USERS - Liste tous les utilisateurs (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '', role = '' } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { raisonSociale: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -motDePasse -resetPasswordCode -resetPasswordToken -resetPasswordExpire')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Erreur getAllUsers:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET USER BY ID - Obtenir un utilisateur (Admin)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -motDePasse -resetPasswordCode -resetPasswordToken -resetPasswordExpire');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('Erreur getUserById:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE USER - Mettre à jour un utilisateur (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, adresse, role, actif } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (email) user.email = email.toLowerCase();
    if (telephone) user.telephone = telephone;
    if (adresse) user.adresse = adresse;
    if (role) user.role = role;
    if (actif !== undefined) {
      user.actif = actif;
      user.isActive = actif;
    }
    
    user.updatedAt = Date.now();
    await user.save();
    
    await logAction(
      req.user?._id, req.user?.role, req.user?.email, 'update_user', 
      'user', user._id, { email: user.email, role: user.role }, req
    );
    
    console.log(`✏️ Utilisateur mis à jour: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Utilisateur mis à jour',
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        adresse: user.adresse,
        role: user.role,
        actif: user.actif
      }
    });
  } catch (err) {
    console.error('Erreur updateUser:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE USER - Supprimer un utilisateur (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    await logAction(
      req.user?._id, req.user?.role, req.user?.email, 'delete_user', 
      'user', user._id, { email: user.email }, req
    );
    
    console.log(`🗑️ Utilisateur supprimé: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (err) {
    console.error('Erreur deleteUser:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ACTIVATE USER - Activer un utilisateur
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    user.actif = true;
    user.isActive = true;
    await user.save();
    
    await logAction(
      req.user?._id, req.user?.role, req.user?.email, 'activate_user', 
      'user', user._id, { email: user.email }, req
    );
    
    res.json({
      success: true,
      message: 'Utilisateur activé avec succès',
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        actif: user.actif
      }
    });
  } catch (err) {
    console.error('Erreur activateUser:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DEACTIVATE USER - Désactiver un utilisateur
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    user.actif = false;
    user.isActive = false;
    await user.save();
    
    await logAction(
      req.user?._id, req.user?.role, req.user?.email, 'deactivate_user', 
      'user', user._id, { email: user.email }, req
    );
    
    res.json({
      success: true,
      message: 'Utilisateur désactivé avec succès',
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        actif: user.actif
      }
    });
  } catch (err) {
    console.error('Erreur deactivateUser:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET USER STATS - Statistiques des utilisateurs
exports.getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          total: { $sum: 1 },
          actifs: { $sum: { $cond: [{ $eq: ['$actif', true] }, 1, 0] } },
          inactifs: { $sum: { $cond: [{ $eq: ['$actif', false] }, 1, 0] } }
        }
      }
    ]);
    
    const totalUsers = await User.countDocuments();
    
    res.json({
      success: true,
      data: {
        total: totalUsers,
        byRole: stats,
        roles: {
          Admin: await User.countDocuments({ role: 'Admin' }),
          Commercial: await User.countDocuments({ role: 'Commercial' }),
          Client: await User.countDocuments({ role: 'Client' }),
          Transporteur: await User.countDocuments({ role: 'Transporteur' }),
          Fournisseur: await User.countDocuments({ role: 'Fournisseur' })
        }
      }
    });
  } catch (err) {
    console.error('Erreur getUserStats:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET USERS BY ROLE - Liste des utilisateurs par rôle
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { actif = true } = req.query;
    
    const validRoles = ['Admin', 'Commercial', 'Client', 'Transporteur', 'Fournisseur'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: `Rôle invalide. Utilisez: ${validRoles.join(', ')}` 
      });
    }
    
    const users = await User.find({ 
      role, 
      actif: actif === 'true' 
    })
      .select('-password -motDePasse -resetPasswordCode -resetPasswordToken -resetPasswordExpire')
      .sort({ nom: 1 });
    
    res.json({
      success: true,
      data: users,
      count: users.length,
      role
    });
  } catch (err) {
    console.error('Erreur getUsersByRole:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET TRANSPORTEURS
exports.getTransporteurs = async (req, res) => {
  try {
    const transporteurs = await User.find({ 
      role: 'Transporteur', 
      actif: true 
    })
      .select('nom prenom email telephone role actif adresse code')
      .sort({ nom: 1 });
    
    res.json({
      success: true,
      data: transporteurs,
      count: transporteurs.length
    });
  } catch (err) {
    console.error('Erreur getTransporteurs:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET FOURNISSEURS
exports.getFournisseurs = async (req, res) => {
  try {
    const fournisseurs = await User.find({ 
      role: 'Fournisseur', 
      actif: true 
    })
      .select('nom prenom email telephone role actif adresse code raisonSociale')
      .sort({ nom: 1 });
    
    res.json({
      success: true,
      data: fournisseurs,
      count: fournisseurs.length
    });
  } catch (err) {
    console.error('Erreur getFournisseurs:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET COMMERCIAUX
exports.getCommerciaux = async (req, res) => {
  try {
    const commerciaux = await User.find({ 
      role: 'Commercial', 
      actif: true 
    })
      .select('nom prenom email telephone role actif')
      .sort({ nom: 1 });
    
    res.json({
      success: true,
      data: commerciaux,
      count: commerciaux.length
    });
  } catch (err) {
    console.error('Erreur getCommerciaux:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET CLIENTS
exports.getClients = async (req, res) => {
  try {
    const clients = await User.find({ 
      role: 'Client', 
      actif: true 
    })
      .select('nom prenom email telephone adresse role actif code raisonSociale')
      .sort({ nom: 1 });
    
    res.json({
      success: true,
      data: clients,
      count: clients.length
    });
  } catch (err) {
    console.error('Erreur getClients:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// VERIFY ACCOUNT - Vérifier un compte
exports.verifyAccount = async (req, res) => {
  const { token } = req.params;
  res.json({ 
    success: true,
    message: `Compte vérifié avec le token ${token}` 
  });
};

// REJECT ACCOUNT - Rejeter un compte
exports.rejectAccount = async (req, res) => {
  const { token } = req.params;
  res.json({ 
    success: true,
    message: `Compte rejeté avec le token ${token}` 
  });
};

// BATCH OPERATIONS - Opérations par lot
exports.batchActivateUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Liste d\'IDs utilisateur requise' 
      });
    }
    
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { actif: true, isActive: true, updatedAt: Date.now() }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} utilisateur(s) activé(s)`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Erreur batchActivateUsers:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.batchDeactivateUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Liste d\'IDs utilisateur requise' 
      });
    }
    
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { actif: false, isActive: false, updatedAt: Date.now() }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} utilisateur(s) désactivé(s)`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Erreur batchDeactivateUsers:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADMIN RESET PASSWORD - Réinitialiser le mot de passe d'un utilisateur (Admin)
exports.adminResetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email et nouveau mot de passe requis'
      });
    }
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${escapeEmail(email)}$`, 'i') }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    user.password = newPassword;
    user.motDePasse = newPassword;
    await user.save();
    
    await createAndSendNotification(
      user._id,
      'Mot de passe réinitialisé par administrateur',
      'Votre mot de passe a été réinitialisé par un administrateur',
      'warning'
    );
    
    res.json({ success: true, message: `Mot de passe réinitialisé pour ${user.email}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
