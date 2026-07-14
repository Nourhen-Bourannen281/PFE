// middlewares/riskMiddleware.js
// Analyse chaque action sensible après l'envoi de la réponse (non bloquant).
// SUSPICIOUS → notification warning   ANOMALY → notification error + log console + email + Telegram

const { analyzeRisk, getAction, getEntityType } = require('../utils/riskAnalyzer');
const Notification = require('../models/Notification');

let securityService = null;
try { securityService = require('../services/securityService'); } catch { /* optionnel */ }

// Routes à ignorer (lecture pure, debug, santé)
const SKIP_PATHS  = ['/api/health', '/api/debug', '/api/notifications', '/api/chat'];
const SKIP_METHODS = ['OPTIONS'];

const riskMiddleware = (req, res, next) => {
  if (
    SKIP_METHODS.includes(req.method) ||
    SKIP_PATHS.some(p => req.originalUrl.startsWith(p))
  ) {
    return next();
  }

  // Intercepte la fin de la réponse (non bloquant, réponse déjà envoyée)
  res.on('finish', async () => {
    // N'analyser que les succès (2xx)
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    const userId     = req.user?._id || req.user?.id || null;
    const action     = getAction(req.method, req.originalUrl);
    const entityType = getEntityType(req.originalUrl);
    const ipAddress  = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    const result = await analyzeRisk({ userId, action, entityType, ipAddress });
    if (!result) return;

    const { risk_score, status, alert } = result;

    if (status !== 'NORMAL') {
      console.warn(
        `🔍 Risk │ ${req.method} ${req.originalUrl} │ user:${userId} │ score:${risk_score} │ ${status}`
      );
    }

    // Notification in-app pour l'utilisateur courant
    if (alert && userId) {
      try {
        await Notification.create({
          userId,
          title:   status === 'ANOMALY' ? '🚨 Comportement anormal détecté' : '⚠️ Activité suspecte',
          message: `Score de risque : ${risk_score} | Action : ${action} sur ${entityType}`,
          type:    status === 'ANOMALY' ? 'error' : 'warning',
          read:    false,
          isRead:  false,
        });
      } catch { /* silencieux */ }
    }

    // Alerte admin complète (email + Telegram) uniquement sur ANOMALY
    if (status === 'ANOMALY' && securityService) {
      securityService.alertAnomaly({
        userId:     String(userId || 'anonyme'),
        action,
        entityType,
        ipAddress,
        riskScore:  risk_score,
      }).catch(() => {});
    }
  });

  next();
};

module.exports = riskMiddleware;
