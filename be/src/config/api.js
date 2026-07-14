// src/config/api.js
const API_BASE_URL = 'http://localhost:5001/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  
  // Users
  USERS: `${API_BASE_URL}/users`,
  
  // Products
  PRODUCTS: `${API_BASE_URL}/products`,
  TYPE_PRODUITS: `${API_BASE_URL}/type-produits`,
  SOUS_PRODUITS: `${API_BASE_URL}/sous-produits`,
  
  // Stock
  STOCK: `${API_BASE_URL}/stock`,
  
  // Ventes et Contrats
  VENTES: `${API_BASE_URL}/ventes`,
  CONTRATS: `${API_BASE_URL}/contrats`,
  CONTRATS_VENTE: `${API_BASE_URL}/contrats-vente`,
  
  // Logistique
  CABOTAGE: `${API_BASE_URL}/cabotage`,
  NAVIRES: `${API_BASE_URL}/navires`,
  PORTS: `${API_BASE_URL}/ports`,
  
  // Référentiels
  PAYS: `${API_BASE_URL}/pays`,
  BANQUES: `${API_BASE_URL}/banques`,
  MODES_PAIEMENT: `${API_BASE_URL}/modes-paiement`,
  TYPES_FACTURE: `${API_BASE_URL}/types-facture`,
  
  // Documents
  FACTURES: `${API_BASE_URL}/factures`,
  COMMANDES: `${API_BASE_URL}/commandes`,
  LIVRAISONS: `${API_BASE_URL}/livraisons`,
  CARGAISONS: `${API_BASE_URL}/cargaisons`,
  
  // Export/Import
  EXPORT_IMPORT: `${API_BASE_URL}/export-import`,
  
  // Conformité
  CONFORMITES: `${API_BASE_URL}/conformites`,
  
  // Historique
  HISTORIQUE: `${API_BASE_URL}/historique`,
  HISTORIQUE_STATS: `${API_BASE_URL}/historique/stats`,
  
  // Emissions
  EMISSIONS: `${API_BASE_URL}/emissions`,
  
  // Utilitaires
  INIT_DATA: `${API_BASE_URL}/init-data`,
  HEALTH: `${API_BASE_URL}/health`,
};

export const getApiConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export default API_BASE_URL;