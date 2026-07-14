// src/utils/auth.js
import axios from 'axios';

// ── Validation du token JWT ───────────────────────────────────────────────

export const isValidToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.warn('⚠️ Token expiré');
        return false;
      }
    }

    return true;
  } catch (e) {
    console.warn('⚠️ Token invalide:', e.message);
    return false;
  }
};

// ── Décoder le payload ────────────────────────────────────────────────────

export const decodeToken = (token) => {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
  } catch {
    return null;
  }
};

// ── Getters ───────────────────────────────────────────────────────────────

export const getToken = () => {
  return localStorage.getItem('token') || null;
};

// Alias pour compatibilité avec les anciens fichiers qui importent getValidToken
export const getValidToken = getToken;

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const getRole = () => {
  return getUser()?.role || null;
};

// ── Auth check ────────────────────────────────────────────────────────────

export const isAuthenticated = () => {
  const token = getToken();
  return isValidToken(token);
};

// ── Sauvegarder la session après login ───────────────────────────────────

export const saveSession = (token, user) => {
  if (!token) {
    console.error('❌ saveSession : token manquant');
    return false;
  }
  // Accepter le token même s'il n'est pas un JWT standard
  // (certains backends renvoient des tokens opaques)
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user || {}));
  return true;
};

// ── Déconnexion ───────────────────────────────────────────────────────────

export const logout = (navigate) => {
  localStorage.clear();
  if (navigate) navigate('/login');
};

// ── Headers Axios prêts à l'emploi ───────────────────────────────────────

export const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Intercepteur Axios ────────────────────────────────────────────────────
// Appeler UNE seule fois dans App.js

export const setupAxiosInterceptors = (navigate) => {
  axios.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.warn('🔒 Session expirée, redirection vers /login');
        logout(navigate);
      }
      return Promise.reject(error);
    }
  );
};