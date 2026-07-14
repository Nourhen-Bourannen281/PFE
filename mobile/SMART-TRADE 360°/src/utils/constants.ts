// src/utils/constants.ts

// ============================================
// 1. CONFIGURATION DE L'API
// ============================================

export const API_CONFIG = {
  // URLs - À modifier selon votre environnement
  BASE_URL: 'http://192.168.1.115:5001',
  API_URL: 'http://192.168.1.115:5001/api',
  SOCKET_URL: 'http://192.168.1.115:5001',
  
  // Timeouts
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      QR_LOGIN: '/auth/qr-login',
      REFRESH_TOKEN: '/auth/refresh-token',
    },
    NOTIFICATIONS: {
      BASE: '/notifications',
      USER: (userId: string) => `/notifications/user/${userId}`,
      MARK_READ: (id: string) => `/notifications/${id}/read`,
      MARK_ALL_READ: (userId: string) => `/notifications/user/${userId}/read-all`,
    },
    PENALTIES: {
      BASE: '/penalties',
      USER: (userId: string) => `/penalties/user/${userId}`,
      CALCULATE: '/penalties/calculate',
      PAY: (id: string) => `/penalties/${id}/pay`,
    },
    HISTORY: {
      BASE: '/history',
      USER: (userId: string) => `/history/user/${userId}`,
      ALL: '/history/all',
      EXPORT: '/history/export',
    },
    CHATBOT: {
      BASE: '/chatbot',
      SEND: '/chatbot',
      SUGGESTIONS: '/chatbot/suggestions',
      CLEAR: '/chatbot/clear',
    },
    USERS: {
      BASE: '/users',
      PROFILE: (id: string) => `/users/${id}`,
      UPDATE: (id: string) => `/users/${id}`,
      CHANGE_PASSWORD: (id: string) => `/users/${id}/password`,
    },
    COMMANDES: {
      BASE: '/commandes',
      DETAIL: (id: string) => `/commandes/${id}`,
      CLIENT: (clientId: string) => `/commandes/client/${clientId}`,
      FOURNISSEUR: (fournisseurId: string) => `/commandes/fournisseur/${fournisseurId}`,
      STATUT: (id: string) => `/commandes/${id}/statut`,
    },
    CONTRATS: {
      BASE: '/contrats',
      DETAIL: (id: string) => `/contrats/${id}`,
      VALIDATE: (id: string) => `/contrats/${id}/validate`,
    },
    FACTURES: {
      BASE: '/factures',
      DETAIL: (id: string) => `/factures/${id}`,
      DOWNLOAD: (id: string) => `/factures/${id}/download`,
    },
    TIERS: {
      BASE: '/tiers',
      DETAIL: (id: string) => `/tiers/${id}`,
    },
  },
};

// ============================================
// 2. RÔLES UTILISATEURS
// ============================================

export const USER_ROLES = {
  ADMIN: 'Admin',
  COMMERCIAL: 'Commercial',
  CLIENT: 'Client',
  TRANSPORTEUR: 'Transporteur',
  FOURNISSEUR: 'Fournisseur',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROLE_CONFIG: Record<UserRole, {
  icon: string;
  label: string;
  color: string;
  description: string;
  permissions: string[];
}> = {
  [USER_ROLES.ADMIN]: {
    icon: '👑',
    label: 'Administrateur',
    color: '#9c27b0',
    description: 'Accès complet à toutes les fonctionnalités de la plateforme ETAP.',
    permissions: [
      'Gestion des utilisateurs',
      'Gestion des tiers',
      'Gestion du stock',
      'Validation des contrats',
      'Suivi des commandes',
      'Gestion des factures',
      'Export des données',
      'Pénalités de retard',
      'Notifications système',
    ],
  },
  [USER_ROLES.COMMERCIAL]: {
    icon: '💼',
    label: 'Commercial',
    color: '#2196f3',
    description: 'Gestion des contrats, commandes et relations clients.',
    permissions: [
      'Gestion des contrats',
      'Suivi des commandes',
      'Gestion des factures',
      'Export des données',
      'Gestion des tiers',
      'Notifications commerciales',
    ],
  },
  [USER_ROLES.CLIENT]: {
    icon: '🏢',
    label: 'Client',
    color: '#4caf50',
    description: 'Accès à vos commandes, livraisons et factures.',
    permissions: [
      'Consultation catalogue',
      'Passage de commandes',
      'Suivi des livraisons',
      'Consultation factures',
      'Assistant virtuel',
    ],
  },
  [USER_ROLES.TRANSPORTEUR]: {
    icon: '🚛',
    label: 'Transporteur',
    color: '#ff9800',
    description: 'Gestion et suivi de vos missions de livraison.',
    permissions: [
      'Consultation livraisons',
      'Mise à jour statut',
      'Suivi itinéraires',
      'Contact clients',
    ],
  },
  [USER_ROLES.FOURNISSEUR]: {
    icon: '🏭',
    label: 'Fournisseur',
    color: '#f44336',
    description: 'Gestion de vos commandes et livraisons.',
    permissions: [
      'Consultation commandes',
      'Gestion livraisons',
      'Consultation factures',
      'Gestion des pénalités',
    ],
  },
};

// ============================================
// 3. STATUTS DES COMMANDES
// ============================================

export const COMMANDE_STATUT = {
  EN_ATTENTE: 'en_attente',
  CONFIRMEE: 'confirmee',
  EN_LIVRAISON: 'en_livraison',
  LIVREE: 'livree',
  ANNULEE: 'annulee',
} as const;

export type CommandeStatut = typeof COMMANDE_STATUT[keyof typeof COMMANDE_STATUT];

export const COMMANDE_STATUT_CONFIG: Record<CommandeStatut, {
  label: string;
  icon: string;
  color: string;
}> = {
  [COMMANDE_STATUT.EN_ATTENTE]: {
    label: 'En attente',
    icon: '⏳',
    color: '#ff9800',
  },
  [COMMANDE_STATUT.CONFIRMEE]: {
    label: 'Confirmée',
    icon: '✅',
    color: '#4caf50',
  },
  [COMMANDE_STATUT.EN_LIVRAISON]: {
    label: 'En livraison',
    icon: '🚚',
    color: '#2196f3',
  },
  [COMMANDE_STATUT.LIVREE]: {
    label: 'Livrée',
    icon: '📦',
    color: '#9c27b0',
  },
  [COMMANDE_STATUT.ANNULEE]: {
    label: 'Annulée',
    icon: '❌',
    color: '#f44336',
  },
};

// ============================================
// 4. STATUTS DES NOTIFICATIONS
// ============================================

export const NOTIFICATION_TYPE = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: string;
  color: string;
  sound: string;
}> = {
  [NOTIFICATION_TYPE.INFO]: {
    icon: 'ℹ️',
    color: '#2196f3',
    sound: 'info.mp3',
  },
  [NOTIFICATION_TYPE.WARNING]: {
    icon: '⚠️',
    color: '#ff9800',
    sound: 'warning.mp3',
  },
  [NOTIFICATION_TYPE.ERROR]: {
    icon: '❌',
    color: '#f44336',
    sound: 'error.mp3',
  },
  [NOTIFICATION_TYPE.SUCCESS]: {
    icon: '✅',
    color: '#4caf50',
    sound: 'success.mp3',
  },
};

// ============================================
// 5. STATUTS DES PÉNALITÉS
// ============================================

export const PENALTY_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  WAIVED: 'waived',
} as const;

export type PenaltyStatus = typeof PENALTY_STATUS[keyof typeof PENALTY_STATUS];

export const PENALTY_CONFIG: Record<PenaltyStatus, {
  label: string;
  icon: string;
  color: string;
  actionText: string;
}> = {
  [PENALTY_STATUS.PENDING]: {
    label: 'En souffrance',
    icon: '⚠️',
    color: '#f44336',
    actionText: 'Payer',
  },
  [PENALTY_STATUS.PAID]: {
    label: 'Payée',
    icon: '✅',
    color: '#4caf50',
    actionText: 'Télécharger reçu',
  },
  [PENALTY_STATUS.WAIVED]: {
    label: 'En attente',
    icon: '⏳',
    color: '#ff9800',
    actionText: 'Contester',
  },
};

// ============================================
// 6. ACTIONS HISTORIQUE
// ============================================

export const HISTORY_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  VIEW: 'view',
  EXPORT: 'export',
  VALIDATE: 'validate',
  REJECT: 'reject',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
} as const;

export type HistoryAction = typeof HISTORY_ACTIONS[keyof typeof HISTORY_ACTIONS];

export const HISTORY_ACTION_CONFIG: Record<HistoryAction, {
  label: string;
  icon: string;
  color: string;
  verb: string;
}> = {
  [HISTORY_ACTIONS.CREATE]: {
    label: 'Création',
    icon: '➕',
    color: '#4caf50',
    verb: 'a créé',
  },
  [HISTORY_ACTIONS.UPDATE]: {
    label: 'Modification',
    icon: '✏️',
    color: '#2196f3',
    verb: 'a modifié',
  },
  [HISTORY_ACTIONS.DELETE]: {
    label: 'Suppression',
    icon: '🗑️',
    color: '#f44336',
    verb: 'a supprimé',
  },
  [HISTORY_ACTIONS.LOGIN]: {
    label: 'Connexion',
    icon: '🔑',
    color: '#1a3c5e',
    verb: 's\'est connecté',
  },
  [HISTORY_ACTIONS.LOGOUT]: {
    label: 'Déconnexion',
    icon: '🚪',
    color: '#ff9800',
    verb: 's\'est déconnecté',
  },
  [HISTORY_ACTIONS.VIEW]: {
    label: 'Consultation',
    icon: '👁️',
    color: '#9c27b0',
    verb: 'a consulté',
  },
  [HISTORY_ACTIONS.EXPORT]: {
    label: 'Export',
    icon: '📤',
    color: '#00bcd4',
    verb: 'a exporté',
  },
  [HISTORY_ACTIONS.VALIDATE]: {
    label: 'Validation',
    icon: '✅',
    color: '#8bc34a',
    verb: 'a validé',
  },
  [HISTORY_ACTIONS.REJECT]: {
    label: 'Rejet',
    icon: '❌',
    color: '#ff5722',
    verb: 'a rejeté',
  },
  [HISTORY_ACTIONS.UPLOAD]: {
    label: 'Téléversement',
    icon: '📎',
    color: '#607d8b',
    verb: 'a téléversé',
  },
  [HISTORY_ACTIONS.DOWNLOAD]: {
    label: 'Téléchargement',
    icon: '📥',
    color: '#009688',
    verb: 'a téléchargé',
  },
};

// ============================================
// 7. ENTITÉS HISTORIQUE
// ============================================

export const HISTORY_ENTITIES = {
  CONTRAT: 'contrat',
  COMMANDE: 'commande',
  LIVRAISON: 'livraison',
  FACTURE: 'facture',
  USER: 'user',
  TIERS: 'tiers',
  PRODUIT: 'produit',
  NOTIFICATION: 'notification',
  PENALTY: 'penalty',
} as const;

export type HistoryEntity = typeof HISTORY_ENTITIES[keyof typeof HISTORY_ENTITIES];

export const HISTORY_ENTITY_CONFIG: Record<HistoryEntity, {
  label: string;
  icon: string;
  color: string;
}> = {
  [HISTORY_ENTITIES.CONTRAT]: {
    label: 'Contrat',
    icon: '📄',
    color: '#2196f3',
  },
  [HISTORY_ENTITIES.COMMANDE]: {
    label: 'Commande',
    icon: '🛒',
    color: '#4caf50',
  },
  [HISTORY_ENTITIES.LIVRAISON]: {
    label: 'Livraison',
    icon: '🚚',
    color: '#ff9800',
  },
  [HISTORY_ENTITIES.FACTURE]: {
    label: 'Facture',
    icon: '💰',
    color: '#f44336',
  },
  [HISTORY_ENTITIES.USER]: {
    label: 'Utilisateur',
    icon: '👤',
    color: '#9c27b0',
  },
  [HISTORY_ENTITIES.TIERS]: {
    label: 'Tiers',
    icon: '🏢',
    color: '#607d8b',
  },
  [HISTORY_ENTITIES.PRODUIT]: {
    label: 'Produit',
    icon: '📦',
    color: '#00bcd4',
  },
  [HISTORY_ENTITIES.NOTIFICATION]: {
    label: 'Notification',
    icon: '🔔',
    color: '#ff5722',
  },
  [HISTORY_ENTITIES.PENALTY]: {
    label: 'Pénalité',
    icon: '⚠️',
    color: '#e91e63',
  },
};

// ============================================
// 8. CONFIGURATION QR CODE
// ============================================

export const QR_CODE_CONFIG = {
  BASE_URL: 'etap://',
  SIZE: 200,
  BACKGROUND_COLOR: '#ffffff',
  FOREGROUND_COLOR: '#1a3c5e',
  LOGO_SIZE: 40,
};

export const QR_FEATURES = {
  NOTIFICATIONS: 'notifications',
  PENALTIES: 'penalties',
  HISTORY: 'history',
  CHATBOT: 'chatbot',
  COMMANDES: 'commandes',
  FACTURES: 'factures',
  LIVRAISONS: 'livraisons',
  CONTRATS: 'contrats',
} as const;

export type QRFeature = typeof QR_FEATURES[keyof typeof QR_FEATURES];

export const QR_FEATURE_CONFIG: Record<QRFeature, {
  title: string;
  icon: string;
  description: string;
  requiredRole: UserRole[];
}> = {
  [QR_FEATURES.NOTIFICATIONS]: {
    title: 'Notifications',
    icon: '🔔',
    description: 'Accès rapide aux notifications en temps réel',
    requiredRole: [USER_ROLES.ADMIN, USER_ROLES.COMMERCIAL, USER_ROLES.CLIENT, USER_ROLES.TRANSPORTEUR, USER_ROLES.FOURNISSEUR],
  },
  [QR_FEATURES.PENALTIES]: {
    title: 'Pénalités',
    icon: '⚠️',
    description: 'Gestion des pénalités de retard',
    requiredRole: [USER_ROLES.ADMIN, USER_ROLES.FOURNISSEUR],
  },
  [QR_FEATURES.HISTORY]: {
    title: 'Historique',
    icon: '📜',
    description: 'Consultation de l\'historique des actions',
    requiredRole: [USER_ROLES.ADMIN],
  },
  [QR_FEATURES.CHATBOT]: {
    title: 'Assistant',
    icon: '🤖',
    description: 'Assistant virtuel pour vous aider',
    requiredRole: [USER_ROLES.ADMIN, USER_ROLES.COMMERCIAL, USER_ROLES.CLIENT, USER_ROLES.TRANSPORTEUR, USER_ROLES.FOURNISSEUR],
  },
  [QR_FEATURES.COMMANDES]: {
    title: 'Commandes',
    icon: '🛒',
    description: 'Accès rapide aux commandes',
    requiredRole: [USER_ROLES.ADMIN, USER_ROLES.COMMERCIAL, USER_ROLES.CLIENT, USER_ROLES.FOURNISSEUR],
  },
  [QR_FEATURES.FACTURES]: {
    title: 'Factures',
    icon: '💰',
    description: 'Consultation des factures',
    requiredRole: [USER_ROLES.ADMIN, USER_ROLES.COMMERCIAL, USER_ROLES.CLIENT, USER_ROLES.FOURNISSEUR],
  },
  [QR_FEATURES.LIVRAISONS]: {
    title: 'Livraisons',
    icon: '🚚',
    description: 'Suivi des livraisons',
    requiredRole: [USER_ROLES.ADMIN, USER_ROLES.CLIENT, USER_ROLES.TRANSPORTEUR],
  },
  [QR_FEATURES.CONTRATS]: {
    title: 'Contrats',
    icon: '📄',
    description: 'Gestion des contrats',
    requiredRole: [USER_ROLES.ADMIN, USER_ROLES.COMMERCIAL],
  },
};

// ============================================
// 9. CONFIGURATION CHATBOT
// ============================================

export const CHATBOT_CONFIG = {
  MAX_HISTORY: 50,
  TYPING_DELAY: 1000,
  SUGGESTIONS_COUNT: 4,
  
  // Messages par défaut
  DEFAULT_WELCOME: (role: UserRole) => {
    const messages: Record<UserRole, string> = {
      [USER_ROLES.ADMIN]: 'Bonjour ! Je suis votre assistant administrateur. Je peux vous aider avec les notifications, pénalités, historique et gestion des utilisateurs.',
      [USER_ROLES.COMMERCIAL]: 'Bonjour ! Je suis votre assistant commercial. Je peux vous aider avec les contrats, commandes et factures.',
      [USER_ROLES.CLIENT]: 'Bonjour ! Je suis votre assistant client. Je peux vous aider avec vos commandes, livraisons et factures.',
      [USER_ROLES.TRANSPORTEUR]: 'Bonjour ! Je suis votre assistant logistique. Je peux vous aider avec vos livraisons et itinéraires.',
      [USER_ROLES.FOURNISSEUR]: 'Bonjour ! Je suis votre assistant fournisseur. Je peux vous aider avec vos commandes, livraisons et pénalités.',
    };
    return messages[role] || messages[USER_ROLES.CLIENT];
  },
  
  ERROR_MESSAGE: 'Désolé, une erreur est survenue. Veuillez réessayer.',
  NOT_UNDERSTAND: 'Je n\'ai pas bien compris votre demande. Pouvez-vous reformuler ?',
};

// ============================================
// 10. MESSAGES D'ERREUR
// ============================================

export const ERROR_MESSAGES = {
  NETWORK: 'Erreur de connexion. Vérifiez votre réseau.',
  UNAUTHORIZED: 'Session expirée. Veuillez vous reconnecter.',
  FORBIDDEN: 'Vous n\'avez pas les droits nécessaires.',
  NOT_FOUND: 'Ressource non trouvée.',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
  TIMEOUT: 'La requête a expiré. Vérifiez votre connexion.',
  UNKNOWN: 'Une erreur inattendue est survenue.',
  
  // Auth
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  EMAIL_EXISTS: 'Cet email est déjà utilisé.',
  PASSWORD_TOO_WEAK: 'Le mot de passe doit contenir au moins 8 caractères.',
  
  // Commandes
  COMMANDE_NOT_FOUND: 'Commande non trouvée.',
  COMMANDE_ALREADY_PROCESSED: 'Cette commande a déjà été traitée.',
  INSUFFICIENT_STOCK: 'Stock insuffisant pour cette commande.',
  
  // Paiement
  PAYMENT_FAILED: 'Le paiement a échoué. Veuillez réessayer.',
  INSUFFICIENT_FUNDS: 'Fonds insuffisants.',
};

// ============================================
// 11. MESSAGES DE SUCCÈS
// ============================================

export const SUCCESS_MESSAGES = {
  LOGIN: 'Connexion réussie !',
  LOGOUT: 'Déconnexion réussie.',
  PROFILE_UPDATED: 'Profil mis à jour avec succès.',
  PASSWORD_CHANGED: 'Mot de passe modifié avec succès.',
  
  COMMANDE_CREATED: 'Commande créée avec succès.',
  COMMANDE_UPDATED: 'Commande mise à jour.',
  COMMANDE_CANCELLED: 'Commande annulée.',
  
  PAYMENT_SUCCESS: 'Paiement effectué avec succès.',
  NOTIFICATION_READ: 'Notification marquée comme lue.',
  ALL_NOTIFICATIONS_READ: 'Toutes les notifications ont été marquées comme lues.',
  
  EXPORT_SUCCESS: 'Export réussi. Le fichier va être téléchargé.',
};

// ============================================
// 12. CONFIGURATION STOCKAGE LOCAL
// ============================================

export const STORAGE_KEYS = {
  USER: '@etap_user',
  TOKEN: '@etap_token',
  REFRESH_TOKEN: '@etap_refresh_token',
  NOTIFICATIONS: '@etap_notifications',
  NOTIFICATION_SETTINGS: '@etap_notification_settings',
  CHAT_HISTORY: (role: string) => `@etap_chat_history_${role}`,
  THEME: '@etap_theme',
  LANGUAGE: '@etap_language',
  LAST_SYNC: '@etap_last_sync',
};

// ============================================
// 13. CONFIGURATION THÈME
// ============================================

export const THEME = {
  light: {
    primary: '#1a3c5e',
    primaryDark: '#1e3d59',
    primaryLight: '#e8f0fe',
    secondary: '#ff9800',
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    textHint: '#999999',
    divider: '#e0e0e0',
    border: '#eeeeee',
  },
  dark: {
    primary: '#3d7ea6',
    primaryDark: '#1a3c5e',
    primaryLight: '#1e3d59',
    secondary: '#ff9800',
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    textHint: '#808080',
    divider: '#2c2c2c',
    border: '#333333',
  },
};

export type ThemeMode = 'light' | 'dark';

// ============================================
// 14. CONFIGURATION PAGINATION
// ============================================

export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  INITIAL_PAGE: 1,
  ON_END_REACHED_THRESHOLD: 0.5,
};

// ============================================
// 15. FORMATS DATE
// ============================================

export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  TIME_ONLY: 'HH:mm',
  MONTH_YEAR: 'MMMM YYYY',
  RELATIVE: 'relative',
};

// ============================================
// 16. CONFIGURATION CAMÉRA QR
// ============================================

export const QR_SCANNER_CONFIG = {
  SCAN_INTERVAL: 1000,
  VIBRATION_DURATION: 200,
  ANIMATION_DURATION: 2000,
  FRAME_SIZE: 250,
  FRAME_BORDER_WIDTH: 2,
  FRAME_BORDER_COLOR: '#ffffff',
  FRAME_CORNER_COLOR: '#00ff00',
};

// ============================================
// 17. CONFIGURATION PÉNALITÉS
// ============================================

export const PENALTY_CONFIG_GLOBAL = {
  DAILY_RATE: 0.001, // 0.1% par jour
  MAX_DAYS: 90,
  NOTIFICATION_THRESHOLD_DAYS: [7, 14, 30, 60],
  GRACE_PERIOD_DAYS: 0,
  CURRENCY: 'TND',
  CURRENCY_SYMBOL: 'DT',
};

// ============================================
// 18. CONFIGURATION NOTIFICATIONS
// ============================================

export const NOTIFICATION_CONFIG_GLOBAL = {
  MAX_STORED: 100,
  AUTO_DISMISS_DELAY: 5000, // 5 secondes
  REFRESH_INTERVAL: 30000, // 30 secondes
  SOUND_ENABLED: true,
  VIBRATION_ENABLED: true,
  BADGE_ENABLED: true,
};

// ============================================
// 19. LISTES STATIQUES
// ============================================

export const PAYMENT_METHODS = [
  { id: 'card', label: 'Carte bancaire', icon: '💳' },
  { id: 'bank_transfer', label: 'Virement bancaire', icon: '🏦' },
  { id: 'cash', label: 'Espèces', icon: '💰' },
  { id: 'cheque', label: 'Chèque', icon: '📝' },
] as const;

export const DELIVERY_METHODS = [
  { id: 'standard', label: 'Standard (3-5 jours)', icon: '🚚', price: 0 },
  { id: 'express', label: 'Express (1-2 jours)', icon: '⚡', price: 50 },
  { id: 'pickup', label: 'Retrait en magasin', icon: '🏪', price: 0 },
] as const;

export const PRODUCT_CATEGORIES = [
  { id: 'carburant', label: 'Carburants', icon: '⛽' },
  { id: 'lubrifiant', label: 'Lubrifiants', icon: '🔧' },
  { id: 'gaz', label: 'Gaz', icon: '🔥' },
  { id: 'chimique', label: 'Produits chimiques', icon: '🧪' },
  { id: 'equipement', label: 'Équipements', icon: '🔩' },
] as const;

// ============================================
// 20. FONCTIONS UTILITAIRES
// ============================================

export const getFullImageUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  return `${API_CONFIG.BASE_URL}${path}`;
};

export const formatCurrency = (amount: number, currency: string = 'TND'): string => {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date, format: string = DATE_FORMATS.DISPLAY): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  switch (format) {
    case DATE_FORMATS.DISPLAY:
      return `${day}/${month}/${year}`;
    case DATE_FORMATS.DISPLAY_WITH_TIME:
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case DATE_FORMATS.API:
      return `${year}-${month}-${day}`;
    case DATE_FORMATS.TIME_ONLY:
      return `${hours}:${minutes}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

export const getRelativeTime = (date: string | Date): string => {
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
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours} h`;
  if (days < 7) return `il y a ${days} j`;
  if (weeks < 4) return `il y a ${weeks} sem`;
  if (months < 12) return `il y a ${months} mois`;
  return `il y a ${years} an${years > 1 ? 's' : ''}`;
};

export const getInitials = (name: string): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+216)?[0-9]{8}$/;
  return phoneRegex.test(phone);
};

// ============================================
// 21. EXPORT PAR DÉFAUT
// ============================================

export default {
  API_CONFIG,
  USER_ROLES,
  ROLE_CONFIG,
  COMMANDE_STATUT,
  COMMANDE_STATUT_CONFIG,
  NOTIFICATION_TYPE,
  NOTIFICATION_CONFIG,
  PENALTY_STATUS,
  PENALTY_CONFIG,
  HISTORY_ACTIONS,
  HISTORY_ACTION_CONFIG,
  HISTORY_ENTITIES,
  HISTORY_ENTITY_CONFIG,
  QR_CODE_CONFIG,
  QR_FEATURES,
  QR_FEATURE_CONFIG,
  CHATBOT_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  THEME,
  PAGINATION_CONFIG,
  DATE_FORMATS,
  QR_SCANNER_CONFIG,
  PENALTY_CONFIG_GLOBAL,
  NOTIFICATION_CONFIG_GLOBAL,
  PAYMENT_METHODS,
  DELIVERY_METHODS,
  PRODUCT_CATEGORIES,
  // Utilitaires
  getFullImageUrl,
  formatCurrency,
  formatDate,
  getRelativeTime,
  getInitials,
  truncateText,
  isValidEmail,
  isValidPhoneNumber,
};