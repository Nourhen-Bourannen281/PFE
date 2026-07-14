// src/services/storage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

// Définition des clés de stockage
export const STORAGE_KEYS = {
  USER: '@etap_user',
  TOKEN: '@etap_token',
  REFRESH_TOKEN: '@etap_refresh_token',
  NOTIFICATIONS: '@etap_notifications',
  NOTIFICATION_SETTINGS: '@etap_notification_settings',
  CHAT_HISTORY: '@etap_chat_history',
  THEME: '@etap_theme',
  LANGUAGE: '@etap_language',
  LAST_SYNC: '@etap_last_sync',
};

// ============================================
// 1. GESTION DE L'UTILISATEUR
// ============================================

/**
 * Stocke les informations de l'utilisateur
 */
export const storeUser = async (user: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Erreur lors du stockage de l\'utilisateur:', error);
    throw error;
  }
};

/**
 * Récupère les informations de l'utilisateur
 */
export const getUser = async (): Promise<any | null> => {
  try {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
};

/**
 * Supprime les informations de l'utilisateur
 */
export const removeUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    throw error;
  }
};

// ============================================
// 2. GESTION DES TOKENS
// ============================================

/**
 * Stocke le token d'authentification
 */
export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch (error) {
    console.error('Erreur lors du stockage du token:', error);
    throw error;
  }
};

/**
 * Récupère le token d'authentification
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

/**
 * Stocke le refresh token
 */
export const storeRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  } catch (error) {
    console.error('Erreur lors du stockage du refresh token:', error);
    throw error;
  }
};

/**
 * Récupère le refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Erreur lors de la récupération du refresh token:', error);
    return null;
  }
};

/**
 * Supprime les tokens
 */
export const removeTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Erreur lors de la suppression des tokens:', error);
    throw error;
  }
};

// ============================================
// 3. GESTION DES NOTIFICATIONS
// ============================================

/**
 * Stocke les notifications
 */
export const storeNotifications = async (notifications: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  } catch (error) {
    console.error('Erreur lors du stockage des notifications:', error);
    throw error;
  }
};

/**
 * Récupère les notifications
 */
export const getNotifications = async (): Promise<any[]> => {
  try {
    const notifications = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return notifications ? JSON.parse(notifications) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return [];
  }
};

/**
 * Ajoute une notification
 */
export const addNotification = async (notification: any): Promise<void> => {
  try {
    const notifications = await getNotifications();
    const updatedNotifications = [notification, ...notifications].slice(0, 100);
    await storeNotifications(updatedNotifications);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la notification:', error);
    throw error;
  }
};

/**
 * Marque une notification comme lue
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notifications = await getNotifications();
    const updatedNotifications = notifications.map(notif => 
      notif._id === notificationId ? { ...notif, isRead: true } : notif
    );
    await storeNotifications(updatedNotifications);
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    throw error;
  }
};

/**
 * Supprime une notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notifications = await getNotifications();
    const updatedNotifications = notifications.filter(notif => notif._id !== notificationId);
    await storeNotifications(updatedNotifications);
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    throw error;
  }
};

/**
 * Stocke les paramètres de notification
 */
export const storeNotificationSettings = async (settings: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Erreur lors du stockage des paramètres de notification:', error);
    throw error;
  }
};

/**
 * Récupère les paramètres de notification
 */
export const getNotificationSettings = async (): Promise<any> => {
  try {
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    return settings ? JSON.parse(settings) : {
      pushEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      emailEnabled: false,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de notification:', error);
    return {
      pushEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      emailEnabled: false,
    };
  }
};

// ============================================
// 4. GESTION DE L'HISTORIQUE DU CHATBOT
// ============================================

/**
 * Stocke l'historique du chat pour un rôle spécifique
 */
export const storeChatHistory = async (role: string, history: any[]): Promise<void> => {
  try {
    const key = `${STORAGE_KEYS.CHAT_HISTORY}_${role}`;
    await AsyncStorage.setItem(key, JSON.stringify(history.slice(-50)));
  } catch (error) {
    console.error('Erreur lors du stockage de l\'historique du chat:', error);
    throw error;
  }
};

/**
 * Récupère l'historique du chat pour un rôle spécifique
 */
export const getChatHistory = async (role: string): Promise<any[]> => {
  try {
    const key = `${STORAGE_KEYS.CHAT_HISTORY}_${role}`;
    const history = await AsyncStorage.getItem(key);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique du chat:', error);
    return [];
  }
};

/**
 * Ajoute un message à l'historique du chat
 */
export const addChatMessage = async (role: string, message: any): Promise<void> => {
  try {
    const history = await getChatHistory(role);
    const updatedHistory = [...history, message];
    await storeChatHistory(role, updatedHistory);
  } catch (error) {
    console.error('Erreur lors de l\'ajout du message au chat:', error);
    throw error;
  }
};

/**
 * Efface l'historique du chat pour un rôle spécifique
 */
export const clearChatHistory = async (role: string): Promise<void> => {
  try {
    const key = `${STORAGE_KEYS.CHAT_HISTORY}_${role}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Erreur lors de l\'effacement de l\'historique du chat:', error);
    throw error;
  }
};

// ============================================
// 5. GESTION DES PRÉFÉRENCES UTILISATEUR
// ============================================

/**
 * Stocke le thème (clair/sombre)
 */
export const storeTheme = async (theme: 'light' | 'dark'): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error('Erreur lors du stockage du thème:', error);
    throw error;
  }
};

/**
 * Récupère le thème
 */
export const getTheme = async (): Promise<'light' | 'dark'> => {
  try {
    const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    return (theme as 'light' | 'dark') || 'light';
  } catch (error) {
    console.error('Erreur lors de la récupération du thème:', error);
    return 'light';
  }
};

/**
 * Stocke la langue
 */
export const storeLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  } catch (error) {
    console.error('Erreur lors du stockage de la langue:', error);
    throw error;
  }
};

/**
 * Récupère la langue
 */
export const getLanguage = async (): Promise<string> => {
  try {
    const language = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return language || 'fr';
  } catch (error) {
    console.error('Erreur lors de la récupération de la langue:', error);
    return 'fr';
  }
};

/**
 * Stocke la date de dernière synchronisation
 */
export const storeLastSync = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error('Erreur lors du stockage de la dernière synchronisation:', error);
    throw error;
  }
};

/**
 * Récupère la date de dernière synchronisation
 */
export const getLastSync = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch (error) {
    console.error('Erreur lors de la récupération de la dernière synchronisation:', error);
    return null;
  }
};

// ============================================
// 6. NETTOYAGE COMPLET - Sans utiliser multiRemove
// ============================================

/**
 * Efface toutes les données de l'application
 * Utilise uniquement removeItem (compatible avec toutes les versions)
 */
export const clearStorage = async (): Promise<void> => {
  try {
    // Suppression individuelle de toutes les clés connues
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    await AsyncStorage.removeItem(STORAGE_KEYS.THEME);
    await AsyncStorage.removeItem(STORAGE_KEYS.LANGUAGE);
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    
    // Récupérer et supprimer tous les historiques de chat
    const allKeys = await AsyncStorage.getAllKeys();
    const chatHistoryKeys = allKeys.filter(key => key.startsWith(STORAGE_KEYS.CHAT_HISTORY));
    
    for (const key of chatHistoryKeys) {
      await AsyncStorage.removeItem(key);
    }
    
    console.log('Stockage nettoyé avec succès');
  } catch (error) {
    console.error('Erreur lors du nettoyage du stockage:', error);
    throw error;
  }
};

/**
 * Efface uniquement les données de session (conserve les préférences)
 */
export const clearSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    console.log('Session nettoyée avec succès');
  } catch (error) {
    console.error('Erreur lors du nettoyage de la session:', error);
    throw error;
  }
};

// ============================================
// 7. UTILITAIRES GÉNÉRAUX
// ============================================

/**
 * Vérifie si l'utilisateur est connecté
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const token = await getToken();
    const user = await getUser();
    return !!(token && user);
  } catch (error) {
    console.error('Erreur lors de la vérification de connexion:', error);
    return false;
  }
};

/**
 * Récupère toutes les clés de stockage
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Erreur lors de la récupération des clés:', error);
    return [];
  }
};

/**
 * Récupère toutes les données de stockage - Sans utiliser multiGet
 */
export const getAllData = async (): Promise<Record<string, any>> => {
  try {
    const keys = await getAllKeys();
    const data: Record<string, any> = {};
    
    for (const key of keys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la lecture de la clé ${key}:`, error);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    return {};
  }
};

/**
 * Supprime plusieurs clés séquentiellement
 */
export const removeMultipleKeys = async (keys: string[]): Promise<void> => {
  try {
    for (const key of keys) {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression multiple:', error);
    throw error;
  }
};

// ============================================
// 8. EXPORT PAR DÉFAUT
// ============================================

export default {
  // Utilisateur
  storeUser,
  getUser,
  removeUser,
  
  // Tokens
  storeToken,
  getToken,
  storeRefreshToken,
  getRefreshToken,
  removeTokens,
  
  // Notifications
  storeNotifications,
  getNotifications,
  addNotification,
  markNotificationAsRead,
  deleteNotification,
  storeNotificationSettings,
  getNotificationSettings,
  
  // Chat
  storeChatHistory,
  getChatHistory,
  addChatMessage,
  clearChatHistory,
  
  // Préférences
  storeTheme,
  getTheme,
  storeLanguage,
  getLanguage,
  storeLastSync,
  getLastSync,
  
  // Utilitaires
  clearStorage,
  clearSession,
  isLoggedIn,
  getAllKeys,
  getAllData,
  removeMultipleKeys,
};