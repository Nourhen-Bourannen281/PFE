

import axios from 'axios';

// ✅ Configuration de base
const api = axios.create({
  baseURL:  'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 secondes
});

/**
 * ==================== INTERCEPTEUR REQUEST ====================
 * Ajoute automatiquement le token JWT à chaque requête
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    // ✅ Ajouter le token avec le format "Bearer <token>"
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token ajouté à la requête:', config.url);
    } else {
      console.warn('⚠️ Pas de token trouvé');
    }

    return config;
  },
  (error) => {
    console.error('❌ Erreur requête:', error);
    return Promise.reject(error);
  }
);

/**
 * ==================== INTERCEPTEUR RESPONSE ====================
 * Gère les erreurs d'authentification & redirection
 */
api.interceptors.response.use(
  (response) => {
    console.log('✅ Réponse réussie:', response.config.url);
    return response;
  },
  (error) => {
    const { response, config } = error;

    // ============ 401 UNAUTHORIZED ============
    if (response?.status === 401) {
      console.warn('⏰ Token expiré ou invalide');

      // Nettoyer le stockage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('tokenExpires');

      // Rediriger vers login
      window.location.href = '/login';

      return Promise.reject(new Error('Token expiré. Reconnexion requise.'));
    }

    // ============ 403 FORBIDDEN ============
    if (response?.status === 403) {
      console.warn('🚫 Accès refusé');
      return Promise.reject(new Error('Accès refusé'));
    }

    // ============ 404 NOT FOUND ============
    if (response?.status === 404) {
      console.warn('❌ Ressource non trouvée');
      return Promise.reject(new Error('Ressource non trouvée'));
    }

    // ============ 500 SERVER ERROR ============
    if (response?.status >= 500) {
      console.error('🔥 Erreur serveur:', response.status);
      return Promise.reject(new Error('Erreur serveur. Veuillez réessayer plus tard.'));
    }

    // ============ NETWORK ERROR ============
    if (error.message === 'Network Error') {
      console.error('📡 Erreur réseau');
      return Promise.reject(new Error('Erreur de connexion. Vérifiez votre connexion internet.'));
    }

    // ============ TIMEOUT ============
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Délai d\'attente dépassé');
      return Promise.reject(new Error('La requête a pris trop de temps. Veuillez réessayer.'));
    }

    console.error('❌ Erreur:', error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default api;