// utils/helpers.js

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================
// 1. FONCTIONS DE DATE ET HEURE
// ============================================

/**
 * Formate une date au format français
 * @param {Date|string} date - Date à formater
 * @param {boolean} withTime - Inclure l'heure ou non
 * @returns {string} Date formatée
 */
const formatDate = (date, withTime = false) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  if (withTime) {
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  return `${day}/${month}/${year}`;
};

/**
 * Retourne le temps relatif (ex: "il y a 5 minutes")
 * @param {Date|string} date - Date à comparer
 * @returns {string} Temps relatif
 */
const getRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diff = now.getTime() - past.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (minutes < 1) return 'à l\'instant';
  if (minutes < 60) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  if (days < 7) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  if (weeks < 4) return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  if (months < 12) return `il y a ${months} mois`;
  return `il y a ${years} an${years > 1 ? 's' : ''}`;
};

/**
 * Vérifie si une date est dans le passé
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean} True si la date est passée
 */
const isPastDate = (date) => {
  return new Date(date) < new Date();
};

/**
 * Calcule le nombre de jours entre deux dates
 * @param {Date|string} startDate - Date de début
 * @param {Date|string} endDate - Date de fin
 * @returns {number} Nombre de jours
 */
const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ============================================
// 2. FONCTIONS DE FORMATAGE
// ============================================

/**
 * Formate un nombre en devise tunisienne
 * @param {number} amount - Montant à formater
 * @returns {string} Montant formaté
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formate un numéro de téléphone tunisien
 * @param {string} phone - Numéro de téléphone
 * @returns {string} Numéro formaté
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  // Supprime tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  // Format: +216 XX XXX XXX
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('216')) {
    return `+216 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 11)}`;
  }
  return phone;
};

/**
 * Tronque un texte à une longueur maximale
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Met la première lettre en majuscule
 * @param {string} str - Chaîne à transformer
 * @returns {string} Chaîne avec première lettre majuscule
 */
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// ============================================
// 3. FONCTIONS DE VALIDATION
// ============================================

/**
 * Valide un email
 * @param {string} email - Email à valider
 * @returns {boolean} True si l'email est valide
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone tunisien
 * @param {string} phone - Numéro à valider
 * @returns {boolean} True si le numéro est valide
 */
const isValidPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 8 || (cleaned.length === 12 && cleaned.startsWith('216'));
};

/**
 * Valide un mot de passe
 * @param {string} password - Mot de passe à valider
 * @returns {object} Résultat de la validation
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caractères');
  }
  if (password.length > 50) {
    errors.push('Le mot de passe ne doit pas dépasser 50 caractères');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ============================================
// 4. FONCTIONS DE GÉNÉRATION
// ============================================

/**
 * Génère un ID unique
 * @param {string} prefix - Préfixe optionnel
 * @returns {string} ID unique
 */
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const id = `${timestamp}${random}`.toUpperCase();
  return prefix ? `${prefix}_${id}` : id;
};

/**
 * Génère un numéro de commande unique
 * @returns {string} Numéro de commande
 */
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CMD-${year}${month}${day}-${random}`;
};

/**
 * Génère un token aléatoire
 * @param {number} length - Longueur du token
 * @returns {string} Token généré
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Génère un code de vérification à 6 chiffres
 * @returns {string} Code de vérification
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// 5. FONCTIONS DE PÉNALITÉS
// ============================================

/**
 * Calcule le montant d'une pénalité de retard
 * @param {number} montantCommande - Montant de la commande
 * @param {number} delayDays - Nombre de jours de retard
 * @param {number} dailyRate - Taux journalier (défaut: 0.001 = 0.1%)
 * @returns {number} Montant de la pénalité
 */
const calculatePenalty = (montantCommande, delayDays, dailyRate = 0.001) => {
  if (delayDays <= 0) return 0;
  return delayDays * montantCommande * dailyRate;
};

/**
 * Détermine le niveau de sévérité d'un retard
 * @param {number} delayDays - Nombre de jours de retard
 * @returns {object} Niveau de sévérité
 */
const getSeverityLevel = (delayDays) => {
  if (delayDays <= 7) {
    return { level: 'Léger', color: '#ff9800', icon: '🟡', description: 'Retard mineur' };
  }
  if (delayDays <= 30) {
    return { level: 'Modéré', color: '#f44336', icon: '🔴', description: 'Retard significatif' };
  }
  return { level: 'Critique', color: '#9c27b0', icon: '💀', description: 'Retard sévère' };
};

// ============================================
// 6. FONCTIONS DE LOGGING
// ============================================

/**
 * Journalise un message avec timestamp
 * @param {string} level - Niveau du log (info, warn, error)
 * @param {string} message - Message à journaliser
 * @param {object} data - Données supplémentaires
 */
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  // Afficher dans la console avec couleur
  switch (level) {
    case 'error':
      console.error(`❌ [${timestamp}] ${message}`, data || '');
      break;
    case 'warn':
      console.warn(`⚠️ [${timestamp}] ${message}`, data || '');
      break;
    case 'info':
      console.log(`ℹ️ [${timestamp}] ${message}`, data || '');
      break;
    default:
      console.log(`📝 [${timestamp}] ${message}`, data || '');
  }
  
  // Ici vous pourriez écrire dans un fichier ou une base de données
  return logEntry;
};

/**
 * Journalise une erreur
 * @param {string} message - Message d'erreur
 * @param {Error} error - Objet erreur
 */
const logError = (message, error = null) => {
  log('error', message, error?.stack || error?.message || error);
};

/**
 * Journalise une action utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} action - Action effectuée
 * @param {object} details - Détails de l'action
 */
const logUserAction = (userId, action, details = null) => {
  log('info', `User ${userId} performed: ${action}`, details);
};

// ============================================
// 7. FONCTIONS DE RÉPONSES API
// ============================================

/**
 * Envoie une réponse de succès
 * @param {object} res - Objet response Express
 * @param {any} data - Données à retourner
 * @param {string} message - Message de succès
 * @param {number} statusCode - Code HTTP (défaut: 200)
 */
const successResponse = (res, data = null, message = 'Succès', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Envoie une réponse d'erreur
 * @param {object} res - Objet response Express
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code HTTP (défaut: 400)
 * @param {any} errors - Détails des erreurs
 */
const errorResponse = (res, message = 'Erreur', statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * Envoie une réponse de pagination
 * @param {object} res - Objet response Express
 * @param {array} data - Données paginées
 * @param {number} page - Page actuelle
 * @param {number} limit - Limite par page
 * @param {number} total - Nombre total d'éléments
 */
const paginatedResponse = (res, data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return res.json({
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  });
};

// ============================================
// 8. FONCTIONS DE FICHIERS
// ============================================

/**
 * Supprime un fichier
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<boolean>} True si supprimé
 */
const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    logError(`Erreur suppression fichier: ${filePath}`, error);
    return false;
  }
};

/**
 * Crée un dossier s'il n'existe pas
 * @param {string} dirPath - Chemin du dossier
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Génère un nom de fichier unique
 * @param {string} originalName - Nom original du fichier
 * @returns {string} Nom de fichier unique
 */
const getUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${name}_${timestamp}_${random}${ext}`;
};

// ============================================
// 9. FONCTIONS DE NETTOYAGE
// ============================================

/**
 * Nettoie un objet en supprimant les propriétés null/undefined
 * @param {object} obj - Objet à nettoyer
 * @returns {object} Objet nettoyé
 */
const cleanObject = (obj) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

/**
 * Échappe les caractères spéciaux HTML
 * @param {string} str - Chaîne à échapper
 * @returns {string} Chaîne échappée
 */
const escapeHtml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Supprime les accents d'une chaîne
 * @param {string} str - Chaîne à normaliser
 * @returns {string} Chaîne sans accents
 */
const removeAccents = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// ============================================
// 10. FONCTIONS STATISTIQUES
// ============================================

/**
 * Calcule des statistiques sur un tableau de nombres
 * @param {number[]} numbers - Tableau de nombres
 * @returns {object} Statistiques calculées
 */
const calculateStats = (numbers) => {
  if (!numbers || numbers.length === 0) {
    return { min: 0, max: 0, sum: 0, avg: 0, count: 0 };
  }
  
  const sum = numbers.reduce((a, b) => a + b, 0);
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const avg = sum / numbers.length;
  
  return {
    min,
    max,
    sum,
    avg: Math.round(avg * 100) / 100,
    count: numbers.length
  };
};

/**
 * Regroupe des données par une clé
 * @param {array} data - Tableau de données
 * @param {string} key - Clé de regroupement
 * @returns {object} Données groupées
 */
const groupBy = (data, key) => {
  return data.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

// ============================================
// 11. FONCTIONS DE SÉCURITÉ
// ============================================

/**
 * Masque partiellement un email
 * @param {string} email - Email à masquer
 * @returns {string} Email masqué
 */
const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `***@${domain}`;
  const maskedLocal = local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
};

/**
 * Masque partiellement un numéro de téléphone
 * @param {string} phone - Téléphone à masquer
 * @returns {string} Téléphone masqué
 */
const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 4) return '****';
  const start = cleaned.slice(0, 2);
  const end = cleaned.slice(-2);
  return `${start}****${end}`;
};

// ============================================
// EXPORT DES FONCTIONS
// ============================================

module.exports = {
  // Dates
  formatDate,
  getRelativeTime,
  isPastDate,
  daysBetween,
  
  // Formatage
  formatCurrency,
  formatPhoneNumber,
  truncateText,
  capitalize,
  
  // Validation
  isValidEmail,
  isValidPhone,
  validatePassword,
  
  // Génération
  generateUniqueId,
  generateOrderNumber,
  generateToken,
  generateVerificationCode,
  
  // Pénalités
  calculatePenalty,
  getSeverityLevel,
  
  // Logging
  log,
  logError,
  logUserAction,
  
  // Réponses API
  successResponse,
  errorResponse,
  paginatedResponse,
  
  // Fichiers
  deleteFile,
  ensureDirectoryExists,
  getUniqueFilename,
  
  // Nettoyage
  cleanObject,
  escapeHtml,
  removeAccents,
  
  // Statistiques
  calculateStats,
  groupBy,
  
  // Sécurité
  maskEmail,
  maskPhone
};