// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration API
const DEV_PC_IP = '172.16.27.20';

const getApiUrl = () => {
  if (__DEV__) {
    return `http://${DEV_PC_IP}:5001/api`;
  }
  return 'https://votre-api-production.com/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@etap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ ${error.config?.url} - ${error.response.status}`);
      console.error(error.response.data);
    } else if (error.request) {
      console.error(`🔌 Erreur réseau: ${error.message}`);
    } else {
      console.error(`💥 Erreur: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH
// ============================================
export const login = (email: string, password: string) => 
  api.post('/auth/login', { email, password });

export const qrLogin = (qrData: string) => 
  api.post('/auth/qr-login', { qrData });

export const forgotPassword = (email: string) => 
  api.post('/auth/forgot-password', { email });

// ============================================
// NOTIFICATIONS
// ============================================
export const getNotifications = (_userId?: string) =>
  api.get(`/notifications`);

export const markNotificationRead = (id: string) =>
  api.put(`/notifications/${id}/read`);

export const markAllNotificationsRead = (_userId?: string) =>
  api.put(`/notifications/read-all`);

// ============================================
// PÉNALITÉS
// ============================================
export const getPenalties = (userId?: string) =>
  api.get(`/penalties`, { params: userId ? { userId } : undefined });

export const payPenalty = (id: string) => 
  api.post(`/penalties/${id}/pay`);

// ============================================
// HISTORIQUE
// ============================================
export const getUserHistory = (userId: string, params?: any) => 
  api.get(`/history/user/${userId}`, { params });

// ============================================
// CHATBOT
// ============================================
export const sendChatMessage = (message: string, userRole: string, history?: any[]) => 
  api.post('/chatbot', { message, userRole, conversationHistory: history });

// ============================================
// UTILISATEUR
// ============================================
export const updateUserProfile = (userId: string, data: any) => 
  api.put(`/users/${userId}/profile`, data);

export const changePassword = (userId: string, oldPassword: string, newPassword: string) => 
  api.post(`/users/${userId}/change-password`, { oldPassword, newPassword });

export default api;