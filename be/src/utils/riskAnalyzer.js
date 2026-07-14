// utils/riskAnalyzer.js — Appelle le microservice Flask pour l'analyse de risque
const axios = require('axios');

const FLASK_URL = process.env.FLASK_URL || 'http://localhost:5001';

// Mapping méthode HTTP → action Flask
const METHOD_TO_ACTION = {
  GET:    'LOGIN',   // lecture
  POST:   'CREATE',
  PUT:    'UPDATE',
  PATCH:  'UPDATE',
  DELETE: 'DELETE',
};

// Mapping segment d'URL → entityType Flask
const PATH_TO_ENTITY = {
  users:        'User',
  auth:         'User',
  factures:     'Facture',
  livraisons:   'Livraison',
  commandes:    'Commande',
  'contrats-vente': 'Facture',
  contrats:     'Facture',
  penalties:    'Facture',
  penalites:    'Facture',
  stock:        'Livraison',
  emissions:    'Livraison',
};

/**
 * Détermine l'action Flask à partir de la méthode HTTP et de l'URL.
 * Le login est toujours "LOGIN" même si c'est un POST.
 */
const getAction = (method, url) => {
  if (/\/(auth\/login|auth\/qr-login)/.test(url)) return 'LOGIN';
  return METHOD_TO_ACTION[method] || 'CREATE';
};

/**
 * Détermine l'entityType Flask à partir de l'URL.
 * Ex: /api/factures/123 → "Facture"
 */
const getEntityType = (url) => {
  const segments = url.replace('/api/', '').split('/').filter(Boolean);
  const key = segments[0] || 'Unknown';
  return PATH_TO_ENTITY[key] || 'Unknown';
};

/**
 * Envoie une requête d'analyse à Flask.
 * Retourne null si Flask est indisponible (ne bloque jamais l'API Node).
 */
const analyzeRisk = async ({ userId, action, entityType, ipAddress }) => {
  try {
    const { data } = await axios.post(
      `${FLASK_URL}/analyze`,
      {
        userId:     String(userId || 'anonymous'),
        action,
        entityType,
        ipAddress:  ipAddress || '127.0.0.1',
      },
      { timeout: 3000 }
    );
    return data; // { risk_score, status, alert }
  } catch {
    // Flask indisponible → on laisse passer silencieusement
    return null;
  }
};

module.exports = { analyzeRisk, getAction, getEntityType };
