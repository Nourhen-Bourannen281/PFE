// pfe/be/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware d'authentification - Protège les routes
 * Vérifie le token JWT et ajoute l'utilisateur à req.user
 */
const protect = async (req, res, next) => {
  // ============================================
  // MODE DÉVELOPPEMENT - À SUPPRIMER EN PRODUCTION
  // ============================================
  // Active le mode développement en définissant NODE_ENV=development
  // et BYPASS_AUTH=true dans votre fichier .env
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  MODE DÉVELOPPEMENT ACTIF - Authentification contournée');
    console.log('\x1b[36m%s\x1b[0m', '👤 Utilisateur admin automatique créé pour le développement');
    
    // Créer un utilisateur de développement
    req.user = { 
      _id: process.env.DEV_USER_ID || 'dev_' + Date.now(),
      role: process.env.DEV_USER_ROLE || 'admin',
      nom: process.env.DEV_USER_NAME || 'Développeur Test',
      email: process.env.DEV_USER_EMAIL || 'dev@test.com',
      prenom: process.env.DEV_USER_PRENOM || 'Dev',
      isDev: true
    };
    
    console.log('\x1b[32m%s\x1b[0m', `✅ Utilisateur: ${req.user.nom} (rôle: ${req.user.role})`);
    return next();
  }
  
  // ============================================
  // MODE PRODUCTION - Validation du token JWT
  // ============================================
  try {
    let token;
    
    // Récupérer le token du header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé - Token manquant' 
      });
    }
    
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_key');
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.id).select('-password');
    
    // Vérifier si l'utilisateur existe
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé - Utilisateur non trouvé' 
      });
    }
    
    // Ajouter l'utilisateur à l'objet req
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    
    // Gestion des différents types d'erreurs JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé - Token invalide' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé - Token expiré' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Non autorisé - Erreur d\'authentification' 
    });
  }
};

/**
 * Middleware d'autorisation - Vérifie les rôles
 * @param {...string} roles - Liste des rôles autorisés
 * @returns {Function} Middleware Express
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non authentifié - Veuillez vous connecter' 
      });
    }
    
    // Vérifier si le rôle de l'utilisateur est autorisé
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Accès refusé. Votre rôle "${req.user.role}" n'est pas autorisé. Rôles requis: ${roles.join(', ')}`,
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Middleware optionnel - Vérifie si l'utilisateur est admin
 * Utilise authorize('admin')
 */
const isAdmin = (req, res, next) => {
  return authorize('admin')(req, res, next);
};

/**
 * Middleware optionnel - Vérifie si l'utilisateur est client
 * Utilise authorize('client')
 */
const isClient = (req, res, next) => {
  return authorize('client')(req, res, next);
};

/**
 * Middleware optionnel - Vérifie si l'utilisateur est livreur
 * Utilise authorize('livreur')
 */
const isLivreur = (req, res, next) => {
  return authorize('livreur')(req, res, next);
};

module.exports = {
  protect,
  protectRoute: protect,   // alias used by some route files
  authorize,
  isAdmin,
  isClient,
  isLivreur
};