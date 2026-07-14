/**
 * pages/Ventes.jsx - Version Corrigée & Optimisée
 * Gestion des ventes STEG (Gaz Naturel Local)
 * ✅ ESLint compliant
 * ✅ Meilleure gestion d'erreurs
 * ✅ Édition/Suppression complète
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import '../css/Ventes.css';

// Configuration API
const API_BASE_URL = 'http://localhost:5001/api';

// Données mockées pour le mode démo
const MOCK_PRODUCTS = [
  { _id: 'p1', nom: 'Gaz Naturel Standard', prixUnitaire: 0.85 },
  { _id: 'p2', nom: 'Gaz Naturel Premium', prixUnitaire: 1.20 }
];

const MOCK_VENTES = [
  {
    _id: 'v1',
    numeroVente: 'V-20250101-001',
    produit: { _id: 'p1', nom: 'Gaz Naturel Standard' },
    quantite: 12500,
    prixUnitaire: 0.85,
    montantTotal: 10625,
    client: 'STEG',
    contratRef: 'CT-2024-001',
    statut: 'livree',
    dateVente: new Date().toISOString()
  },
  {
    _id: 'v2',
    numeroVente: 'V-20250115-002',
    produit: { _id: 'p2', nom: 'Gaz Naturel Premium' },
    quantite: 8500,
    prixUnitaire: 1.20,
    montantTotal: 10200,
    client: 'STEG',
    contratRef: 'CT-2024-002',
    statut: 'confirmee',
    dateVente: new Date().toISOString()
  }
];

// ✅ Utilitaires
const generateTempId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR');
  } catch {
    return '-';
  }
};

const Ventes = () => {
  // ==================== STATE ====================
  const [allVentes, setAllVentes] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVente, setEditingVente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [formData, setFormData] = useState({
    numeroVente: '',
    produit: '',
    quantite: '',
    dateVente: new Date().toISOString().split('T')[0],
    prixUnitaire: '',
    contratRef: ''
  });

  // ==================== API CONFIG ====================
  const getApiConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Validation du token JWT (format: header.payload.signature)
    if (token.split('.').length !== 3) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      return null;
    }

    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }, []);

  const apiConfig = useMemo(() => getApiConfig(), [getApiConfig]);

  // ==================== HELPERS ====================
  const extractArray = useCallback((responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (responseData?.data && Array.isArray(responseData.data)) return responseData.data;
    if (responseData && typeof responseData === 'object') {
      for (const key in responseData) {
        if (Array.isArray(responseData[key])) return responseData[key];
      }
    }
    return [];
  }, []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
    return () => clearTimeout(timeoutId);
  }, []);

  const loadMockData = useCallback(() => {
    setDemoMode(true);
    setProducts(MOCK_PRODUCTS);
    setAllVentes(MOCK_VENTES);
    addToast('Mode démo actif - Données fictives', 'info');
  }, [addToast]);

  // ==================== FETCH DATA ====================
  const fetchVentes = useCallback(async () => {
    if (!apiConfig) {
      loadMockData();
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/ventes`, apiConfig);
      const ventesData = extractArray(response.data);
      setAllVentes(ventesData);
      setDemoMode(false);
    } catch (err) {
      console.error('Erreur chargement ventes:', err);
      if (err.code === 'ERR_NETWORK' || err.response?.status === 404 || err.response?.status === 500) {
        loadMockData();
      } else if (err.response?.status === 401) {
        addToast('Session expirée, veuillez vous reconnecter', 'error');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        addToast('Erreur lors du chargement des ventes', 'error');
      }
    }
  }, [apiConfig, extractArray, loadMockData, addToast]);

  const fetchProducts = useCallback(async () => {
    if (!apiConfig) {
      setProducts(MOCK_PRODUCTS);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/products`, apiConfig);
      const productsData = extractArray(response.data);
      setProducts(productsData.length > 0 ? productsData : MOCK_PRODUCTS);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      setProducts(MOCK_PRODUCTS);
    }
  }, [apiConfig, extractArray]);

  // ==================== CHARGEMENT INITIAL ====================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVentes(), fetchProducts()]);
      setLoading(false);
    };
    loadData();
  }, [fetchVentes, fetchProducts]);

  // ==================== FILTRAGE ====================
  const ventesFiltrees = useMemo(() => {
    let resultats = [...allVentes];

    // Filtre par date (vérifie dateVente, date, et createdAt comme fallback)
    resultats = resultats.filter(item => {
      const rawDate = item.dateVente || item.date || item.createdAt;
      if (!rawDate) return filterType === 'year'; // inclure si pas de date en mode annuel
      const itemDate = new Date(rawDate);
      if (Number.isNaN(itemDate.getTime())) return false;

      if (filterType === 'month') {
        return itemDate.getMonth() + 1 === selectedMonth &&
          itemDate.getFullYear() === selectedYear;
      }
      return itemDate.getFullYear() === selectedYear;
    });

    // Filtre par recherche
    if (searchTerm?.trim()) {
      const searchLower = searchTerm.toLowerCase();
      resultats = resultats.filter(item => {
        return (
          (item.numeroVente || '').toLowerCase().includes(searchLower) ||
          (item.produit?.nom || '').toLowerCase().includes(searchLower) ||
          (item.contratRef || '').toLowerCase().includes(searchLower) ||
          (item.client || '').toLowerCase().includes(searchLower) ||
          (item.statut || '').toLowerCase().includes(searchLower)
        );
      });
    }

    return resultats;
  }, [allVentes, filterType, selectedMonth, selectedYear, searchTerm]);

  // ==================== HANDLERS ====================
  const generateNumeroVente = useCallback(() => {
    const date = new Date();
    const annee = date.getFullYear();
    const mois = (date.getMonth() + 1).toString().padStart(2, '0');
    const jour = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `V-${annee}${mois}${jour}-${random}`;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.produit) {
      addToast('Veuillez sélectionner un produit', 'error');
      return;
    }
    if (!formData.quantite || parseFloat(formData.quantite) <= 0) {
      addToast('La quantité doit être un nombre positif', 'error');
      return;
    }
    if (!formData.prixUnitaire || parseFloat(formData.prixUnitaire) <= 0) {
      addToast('Le prix unitaire doit être un nombre positif', 'error');
      return;
    }

    const quantite = parseFloat(formData.quantite);
    const prixUnitaire = parseFloat(formData.prixUnitaire);
    const montantTotal = quantite * prixUnitaire;
    const numeroVente = editingVente
      ? formData.numeroVente
      : (formData.numeroVente || generateNumeroVente());

    const venteData = {
      numeroVente,
      produit: formData.produit,
      quantite,
      prixUnitaire,
      montantTotal,
      client: 'STEG',
      statut: 'en_attente',
      dateVente: formData.dateVente
        ? new Date(formData.dateVente).toISOString()
        : new Date().toISOString()
    };

    if (formData.contratRef?.trim()) {
      venteData.contratRef = formData.contratRef.trim();
    }

    // Mode démo
    if (demoMode || !apiConfig) {
      const selectedProduct = products.find(p => p._id === formData.produit);
      const newVente = {
        _id: editingVente?._id || generateTempId(),
        ...venteData,
        produit: selectedProduct || { _id: formData.produit, nom: 'Produit' }
      };

      if (editingVente) {
        setAllVentes(prev => prev.map(v => v._id === editingVente._id ? newVente : v));
        addToast('Vente modifiée avec succès (mode démo)', 'success');
      } else {
        setAllVentes(prev => [newVente, ...prev]);
        addToast('Vente créée avec succès (mode démo)', 'success');
      }

      setShowModal(false);
      resetForm();
      return;
    }

    // Mode API réel
    try {
      if (editingVente) {
        await axios.put(`${API_BASE_URL}/ventes/${editingVente._id}`, venteData, apiConfig);
        addToast('Vente modifiée avec succès', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/ventes`, venteData, apiConfig);
        addToast('Vente créée avec succès', 'success');
      }

      setShowModal(false);
      resetForm();
      await fetchVentes();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la sauvegarde';
      addToast(errorMessage, 'error');

      if (err.code === 'ERR_NETWORK' && !demoMode) {
        loadMockData();
      }
    }
  };

  const handleEdit = useCallback((vente) => {
    setEditingVente(vente);
    const rawDate = vente.dateVente || vente.date || vente.createdAt || '';
    const dateForInput = rawDate ? rawDate.split('T')[0] : new Date().toISOString().split('T')[0];
    setFormData({
      numeroVente: vente.numeroVente || '',
      produit: vente.produit?._id || vente.produit || '',
      quantite: vente.quantite || '',
      prixUnitaire: vente.prixUnitaire || '',
      contratRef: vente.contratRef || '',
      dateVente: dateForInput,
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      return;
    }

    if (demoMode || !apiConfig) {
      setAllVentes(prev => prev.filter(v => v._id !== id));
      addToast('Vente supprimée ', 'success');
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/ventes/${id}`, apiConfig);
      addToast('Vente supprimée avec succès', 'success');
      await fetchVentes();
    } catch (err) {
      console.error('Erreur suppression:', err);
      addToast('Erreur lors de la suppression', 'error');
    }
  }, [demoMode, apiConfig, addToast, fetchVentes]);

  const resetFilters = useCallback(() => {
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
    setFilterType('month');
    setSearchTerm('');
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      numeroVente: '',
      produit: '',
      quantite: '',
      prixUnitaire: '',
      contratRef: ''
    });
    setEditingVente(null);
  }, []);

  // ==================== CALCULATIONS ====================
  const montantTotalPreview = useMemo(() => {
    const quantite = parseFloat(formData.quantite) || 0;
    const prixUnitaire = parseFloat(formData.prixUnitaire) || 0;
    return `${(quantite * prixUnitaire).toLocaleString()} DT`;
  }, [formData.quantite, formData.prixUnitaire]);

  const stats = useMemo(() => {
    const totalVentes = ventesFiltrees.length;
    const volumeTotal = ventesFiltrees.reduce((sum, v) => sum + (parseFloat(v.quantite) || 0), 0);
    const montantTotal = ventesFiltrees.reduce((sum, v) => sum + (parseFloat(v.montantTotal) || 0), 0);
    const prixMoyen = volumeTotal > 0 ? montantTotal / volumeTotal : 0;

    return {
      totalVentes,
      volumeTotal,
      montantTotal,
      prixMoyen,
      statsParStatut: {
        en_attente: ventesFiltrees.filter(v => v.statut === 'en_attente').length,
        confirmee: ventesFiltrees.filter(v => v.statut === 'confirmee').length,
        livree: ventesFiltrees.filter(v => v.statut === 'livree').length,
        facturee: ventesFiltrees.filter(v => v.statut === 'facturee').length
      }
    };
  }, [ventesFiltrees]);

  const getPeriodText = useCallback(() => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    if (filterType === 'month') {
      return `${months[selectedMonth - 1]} ${selectedYear}`;
    }
    return `Année ${selectedYear}`;
  }, [filterType, selectedMonth, selectedYear]);

  const getStatusLabel = useCallback((statut) => {
    const statusMap = {
      'en_attente': 'En attente',
      'confirmee': 'Confirmée',
      'livree': 'Livrée',
      'facturee': 'Facturée',
      'annulee': 'Annulée'
    };
    return statusMap[statut] || statut;
  }, []);

  const getStatusClass = useCallback((statut) => {
    const classMap = {
      'en_attente': 'en_attente',
      'confirmee': 'confirmee',
      'livree': 'livree',
      'facturee': 'facturee',
      'annulee': 'annulee'
    };
    return `status-badge ${classMap[statut] || ''}`;
  }, []);

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Chargement des ventes...</p>
      </div>
    );
  }

  return (
    <div className="ventes-container">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>×</button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="page-header">
        <h1>📊 Ventes - Gaz Naturel (STEG)</h1>
        
        <div className="header-buttons">
          <button className="btn-secondary" onClick={resetFilters}>🔄 Réinitialiser</button>
          <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>➕ Nouvelle Vente</button>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-container">
        <div className="filter-group">
          <label>📅 Période</label>
          <div className="filter-buttons">
            <button className={`filter-btn ${filterType === 'month' ? 'active' : ''}`} onClick={() => setFilterType('month')}>Mensuel</button>
            <button className={`filter-btn ${filterType === 'year' ? 'active' : ''}`} onClick={() => setFilterType('year')}>Annuel</button>
          </div>
        </div>

        {filterType === 'month' && (
          <div className="filter-group">
            <label>📆 Mois</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString('fr', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-group">
          <label>📆 Année</label>
          <select value={selectedYear} onChange={(e) => {
            const y = parseInt(e.target.value, 10);
            setSelectedYear(y);
            setFilterType('year'); // passe en mode annuel automatiquement
          }}>
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="search-box">
          <label>🔍 Recherche</label>
          <input
            type="text"
            placeholder="N°, produit, contrat, client, statut..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button className="search-clear" onClick={() => setSearchTerm('')}>✕</button>}
        </div>
      </div>

      {/* Info bar */}
      <div className="info-bar">
        <span>Affichage pour : <strong>{getPeriodText()}</strong></span>
        <span className="info-badge">📊 {ventesFiltrees.length} vente{ventesFiltrees.length !== 1 ? 's' : ''} · Total: {allVentes.length}</span>
      </div>

      {/* Statistiques */}
      <div className="stats-cards">
        <div className="stat-card">
          <h3>📊 Nombre de ventes</h3>
          <p className="stat-value">{stats.totalVentes}</p>
          <small>{getPeriodText()}</small>
        </div>
        <div className="stat-card">
          <h3>📦 Volume Total</h3>
          <p className="stat-value">{stats.volumeTotal.toLocaleString()} m³</p>
          <small>{getPeriodText()}</small>
        </div>
        <div className="stat-card">
          <h3>💰 Montant Total</h3>
          <p className="stat-value">{stats.montantTotal.toLocaleString()} DT</p>
          <small>{getPeriodText()}</small>
        </div>
        <div className="stat-card">
          <h3>💵 Prix Moyen</h3>
          <p className="stat-value">{stats.prixMoyen.toFixed(2)} DT/m³</p>
          <small>Prix unitaire moyen</small>
        </div>
      </div>

      {/* Statistiques par statut */}
      <div className="stats-cards">
        <div className="stat-card">
          <h3>⏳ En attente</h3>
          <p className="stat-value">{stats.statsParStatut.en_attente}</p>
        </div>
        <div className="stat-card">
          <h3>✅ Confirmées</h3>
          <p className="stat-value">{stats.statsParStatut.confirmee}</p>
        </div>
        <div className="stat-card">
          <h3>🚚 Livrées</h3>
          <p className="stat-value">{stats.statsParStatut.livree}</p>
        </div>
        <div className="stat-card">
          <h3>📄 Facturées</h3>
          <p className="stat-value">{stats.statsParStatut.facturee}</p>
        </div>
      </div>

      {/* Tableau */}
      {stats.totalVentes > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Vente</th>
                <th>Date</th>
                <th>Produit</th>
                <th>Quantité</th>
                <th>Prix Unitaire</th>
                <th>Montant Total</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ventesFiltrees.map((vente) => (
                <tr key={vente._id}>
                  <td>{vente.numeroVente}</td>
                  <td>{formatDate(vente.dateVente)}</td>
                  <td>{vente.produit?.nom || '-'}</td>
                  <td>{(vente.quantite || 0).toLocaleString()} m³</td>
                  <td>{(vente.prixUnitaire || 0).toLocaleString()} DT</td>
                  <td>{(vente.montantTotal || 0).toLocaleString()} DT</td>
                  <td><span className={getStatusClass(vente.statut)}>{getStatusLabel(vente.statut)}</span></td>
                  <td className="actions-cell">
                    <button className="btn-edit" onClick={() => handleEdit(vente)}>✏️</button>
                    <button className="btn-delete" onClick={() => handleDelete(vente._id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" style={{ textAlign: 'right' }}>Total:</td>
                <td>{stats.volumeTotal.toLocaleString()} m³</td>
                <td>-</td>
                <td>{stats.montantTotal.toLocaleString()} DT</td>
                <td colSpan="2" />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h4>Aucune vente trouvée</h4>
          <p>{searchTerm || filterType !== 'month' ? 'Aucune vente ne correspond à vos critères.' : 'Cliquez sur "Nouvelle Vente" pour ajouter votre première vente.'}</p>
          <button className="btn-clear-filters" onClick={resetFilters}>🧹 Effacer tous les filtres</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVente ? '✏️ Modifier la Vente' : '➕ Nouvelle Vente'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Numéro Vente</label>
                <input
                  type="text"
                  value={formData.numeroVente}
                  onChange={(e) => setFormData({ ...formData, numeroVente: e.target.value })}
                  placeholder="Laissez vide pour génération automatique"
                />
                <small className="form-hint">Optionnel</small>
              </div>

              <div className="form-group">
                <label>Produit <span className="required">*</span></label>
                <select
                  value={formData.produit}
                  onChange={(e) => setFormData({ ...formData, produit: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.nom} - {p.prixUnitaire} DT/m³</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantité (m³) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantite}
                    onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Prix Unitaire (DT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prixUnitaire}
                    onChange={(e) => setFormData({ ...formData, prixUnitaire: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>📅 Date de vente *</label>
                <input
                  type="date"
                  value={formData.dateVente}
                  onChange={(e) => setFormData({ ...formData, dateVente: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Référence Contrat</label>
                <input
                  type="text"
                  value={formData.contratRef}
                  onChange={(e) => setFormData({ ...formData, contratRef: e.target.value })}
                  placeholder="Ex: CT-2024-001"
                />
                <small className="form-hint">Optionnel</small>
              </div>

              <div className="montant-preview">
                <label>💰 Montant Total</label>
                <div className="montant-value">{montantTotalPreview}</div>
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</button>
                <button type="submit" className="btn-primary">{editingVente ? '💾 Enregistrer' : '✅ Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventes;