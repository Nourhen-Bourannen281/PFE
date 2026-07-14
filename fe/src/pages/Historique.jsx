// pages/Historique.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';
import '../css/Historique.css';

const API_BASE_URL = 'http://localhost:5001/api';

const DEMO_DATA = {
  admin: {
    historique: [
      {
        _id: '1', entityType: 'Commande', action: 'create',
        ancienStatut: null, nouveauStatut: 'En attente',
        details: 'Création de la commande #CMD-2024-001',
        utilisateur: { nom: 'Jean Dupont', email: 'jean@example.com', pseudo: 'jdupont' },
        createdAt: new Date().toISOString(),
      },
      {
        _id: '2', entityType: 'Facture', action: 'update',
        ancienStatut: 'En attente', nouveauStatut: 'Payée',
        details: 'Mise à jour du statut de paiement',
        utilisateur: { nom: 'Marie Martin', email: 'marie@example.com', pseudo: 'mmartin' },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        _id: '3', entityType: 'Contrat', action: 'validate',
        ancienStatut: 'Brouillon', nouveauStatut: 'Signé',
        details: 'Validation du contrat #CT-2024-045',
        utilisateur: { nom: 'Pierre Durand', email: 'pierre@example.com', pseudo: 'pdurand' },
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        _id: '4', entityType: 'Livraison', action: 'update',
        ancienStatut: 'En préparation', nouveauStatut: 'Expédiée',
        details: 'Livraison #LIV-2024-089 expédiée',
        utilisateur: { nom: 'Sophie Bernard', email: 'sophie@example.com', pseudo: 'sbernard' },
        createdAt: new Date(Date.now() - 259200000).toISOString(),
      },
    ],
    stats: {
      actionsParType: [
        { _id: 'create',   count: 15 },
        { _id: 'update',   count: 28 },
        { _id: 'delete',   count: 5  },
        { _id: 'validate', count: 12 },
      ],
      totalParEntite: { Commande: 25, Facture: 18, Contrat: 10, Livraison: 7 },
    },
  },
  user: {
    historique: [
      {
        _id: '1', entityType: 'Commande', action: 'create',
        ancienStatut: null, nouveauStatut: 'En attente',
        details: 'Votre commande #CMD-2024-001 a été créée',
        utilisateur: { nom: 'Jean Dupont', email: 'jean@example.com' },
        createdAt: new Date().toISOString(),
      },
      {
        _id: '2', entityType: 'Facture', action: 'update',
        ancienStatut: 'En attente', nouveauStatut: 'Payée',
        details: 'Votre facture #FAC-2024-123 a été payée',
        utilisateur: { nom: 'Jean Dupont', email: 'jean@example.com' },
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
  },
};

// ─── Helper : filtre les données démo selon les critères actifs ───────────────
function applyDemoFilters(list, { entityType, searchTerm, dateRange }) {
  let result = [...list];

  if (entityType) {
    result = result.filter(i => i.entityType === entityType);
  }

  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    result = result.filter(i =>
      i.details?.toLowerCase().includes(s) ||
      i.utilisateur?.nom?.toLowerCase().includes(s) ||
      i.utilisateur?.pseudo?.toLowerCase().includes(s)
    );
  }

  if (dateRange.start) {
    const sd = new Date(dateRange.start);
    sd.setHours(0, 0, 0, 0);
    result = result.filter(i => new Date(i.createdAt) >= sd);
  }

  if (dateRange.end) {
    const ed = new Date(dateRange.end);
    ed.setHours(23, 59, 59, 999);
    result = result.filter(i => new Date(i.createdAt) <= ed);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────

const Historique = () => {
  const [historique,  setHistorique]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [page,        setPage]        = useState(1);
  const [entityType,  setEntityType]  = useState('');
  const [searchTerm,  setSearchTerm]  = useState('');
  const [dateRange,   setDateRange]   = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [stats,       setStats]       = useState({
    actionsParType: [], totalParEntite: {}, actionsParUtilisateur: [],
  });
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [token, setToken] = useState(null);

  // Récupération du token
  useEffect(() => {
    setToken(getToken());
  }, []);

  const role = useMemo(
    () => (localStorage.getItem('role') || '').toLowerCase(), []
  );

  // ── Instance Axios ─────────────────────────────────────────
  const api = useMemo(() => {
    if (!token) return null;
    return axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  // ── extractArray ───────────────────────────────────────────
  const extractArray = useCallback((responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray(responseData.data)) return responseData.data;
    if (responseData && typeof responseData === 'object') {
      for (const key in responseData) {
        if (Array.isArray(responseData[key])) return responseData[key];
      }
    }
    return [];
  }, []);

  // ── formatDate ─────────────────────────────────────────────
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(date);
    } catch {
      return '-';
    }
  }, []);

  // loadDemoData prend les filtres en paramètres
  const loadDemoData = useCallback((filters = { entityType, searchTerm, dateRange }) => {
    const source = role === 'admin' ? DEMO_DATA.admin.historique : DEMO_DATA.user.historique;
    const statsData = role === 'admin' ? DEMO_DATA.admin.stats : {};

    const filtered = applyDemoFilters(source, filters);

    setHistorique(filtered);
    setStats(statsData);
  }, [role, entityType, searchTerm, dateRange]);

  // ── fetchHistorique ────────────────────────────────────────
  const fetchHistorique = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!token || !api) {
      setIsDemoMode(true);
      loadDemoData();
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('page', page);
      if (entityType)      params.append('entityType', entityType);
      if (searchTerm)      params.append('search',     searchTerm);
      if (dateRange.start) params.append('dateStart',  dateRange.start);
      if (dateRange.end)   params.append('dateEnd',    dateRange.end);

      const endpoint = role === 'admin' ? '/historique' : '/historique/me';
      const response = await api.get(`${endpoint}?${params.toString()}`);
      const data = response.data.data || response.data;

      const historiqueData = extractArray(data);
      setHistorique(historiqueData);
      setIsDemoMode(false);

    } catch (err) {
      console.error('Erreur chargement:', err);
      
      if (err.response?.status === 401) {
        setError('Session expirée, veuillez vous reconnecter');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          window.location.href = '/login';
        }, 2000);
        setIsDemoMode(true);
        loadDemoData();
      } else if (err.response?.status === 404 || err.response?.status === 500 || err.code === 'ERR_NETWORK') {
        setIsDemoMode(true);
        loadDemoData();
        setError('Mode démo activé - Serveur indisponible');
      } else {
        setIsDemoMode(true);
        loadDemoData();
      }
    } finally {
      setLoading(false);
    }
  }, [api, token, role, page, entityType, searchTerm, dateRange, loadDemoData, extractArray]);

  // ── fetchStats ────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (role !== 'admin' || !token || !api || isDemoMode) return;
    try {
      const response = await api.get('/historique/stats');
      const data = response.data.data || response.data;
      setStats({
        actionsParType:        data.actionsParType        || [],
        totalParEntite:        data.totalParEntite        || {},
        actionsParUtilisateur: data.actionsParUtilisateur || [],
      });
    } catch {
      // Silencieux
    }
  }, [role, token, api, isDemoMode]);

  const resetFilters = useCallback(() => {
    setEntityType('');
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
    setPage(1);
    setShowFilters(false);
  }, []);

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    fetchHistorique();
  }, [fetchHistorique]);

  useEffect(() => {
    if (role === 'admin' && !isDemoMode && token && api) {
      fetchStats();
    }
  }, [role, isDemoMode, token, api, fetchStats]);

  // Réinitialiser page quand les filtres changent
  useEffect(() => {
    setPage(1);
    if (isDemoMode) {
      loadDemoData({ entityType, searchTerm, dateRange });
    }
  }, [entityType, searchTerm, dateRange, isDemoMode, loadDemoData]);

  // Calcul de la pagination
  const itemsPerPage = 10;
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedHistorique = Array.isArray(historique) ? historique.slice(startIndex, startIndex + itemsPerPage) : [];
  const totalPagesCount = Math.max(1, Math.ceil((Array.isArray(historique) ? historique.length : 0) / itemsPerPage));

  // ── Render helpers ─────────────────────────────────────────
  const renderFilters = () => (
    <div className="historique-controls">
      {isDemoMode && <div className="demo-badge">⚠️ Mode démo actif</div>}
      <button className="btn-filter-toggle" onClick={() => setShowFilters(v => !v)}>
        {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'} 🔍
      </button>
    </div>
  );

  const renderFilterForm = () => {
    if (!showFilters) return null;
    return (
      <div className="historique-filters">
        <div className="filter-group">
          <label>Type d'entité</label>
          <select value={entityType} onChange={e => setEntityType(e.target.value)}>
            <option value="">Tous les types</option>
            <option value="Commande">Commandes</option>
            <option value="Facture">Factures</option>
            <option value="Contrat">Contrats</option>
            <option value="Livraison">Livraisons</option>
            <option value="Vente">Ventes</option>
            <option value="User">Utilisateurs</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Recherche</label>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Date début</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <label>Date fin</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
          />
        </div>
        <div className="filter-actions">
          <button className="btn-reset" onClick={resetFilters}>Réinitialiser</button>
        </div>
      </div>
    );
  };

  const renderStats = () => {
    if (role !== 'admin' || !stats.actionsParType?.length) return null;
    const ACTION_LABELS = {
      create: 'Créations', update: 'Modifications',
      delete: 'Suppressions', validate: 'Validations',
    };
    return (
      <div className="historique-stats">
        <h3>Statistiques des actions</h3>
        <div className="stats-grid">
          {stats.actionsParType.map(s => (
            <div key={s._id} className="stat-card">
              <div className="stat-value">{s.count}</div>
              <div className="stat-label">{ACTION_LABELS[s._id] || s._id}</div>
            </div>
          ))}
        </div>
        {Object.keys(stats.totalParEntite || {}).length > 0 && (
          <div className="stats-entities">
            <h4>Par type d'entité</h4>
            <div className="stats-grid-small">
              {Object.entries(stats.totalParEntite).map(([entite, count]) => (
                <div key={entite} className="stat-card-small">
                  <span className="stat-label-small">{entite}</span>
                  <span className="stat-value-small">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTable = () => {
    const ACTION_LABELS = {
      create: 'Création', update: 'Modification',
      delete: 'Suppression', validate: 'Validation',
    };

    const getStatusChange = (item) => {
      if (item.ancienStatut && item.nouveauStatut) return `${item.ancienStatut} → ${item.nouveauStatut}`;
      return item.nouveauStatut || item.ancienStatut || '-';
    };

    if (paginatedHistorique.length === 0 && !loading) {
      return (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>Aucun historique trouvé</p>
          {(entityType || searchTerm || dateRange.start || dateRange.end) &&
            <small>Essayez de modifier les filtres</small>}
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <table className="historique-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Action</th>
              <th>Statut</th>
              <th>Détails</th>
              {role === 'admin' && <th>Utilisateur</th>}
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedHistorique.map((item, index) => (
              <tr key={item._id || index}>
                <td>{item.entityType || '-'}</td>
                <td>
                  <span className={`badge-action ${item.action || 'default'}`}>
                    {ACTION_LABELS[item.action] || item.action || '-'}
                  </span>
                </td>
                <td>{getStatusChange(item)}</td>
                <td title={item.details}>
                  {item.details
                    ? item.details.length > 50
                      ? `${item.details.substring(0, 50)}...`
                      : item.details
                    : '-'}
                </td>
                {role === 'admin' && (
                  <td>
                    {item.utilisateur ? (
                      <div>
                        <strong>
                          {item.utilisateur.nom || item.utilisateur.pseudo || 'Inconnu'}
                        </strong>
                        {item.utilisateur.email && (
                          <small className="user-email">({item.utilisateur.email})</small>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                )}
                <td>{formatDate(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPagesCount <= 1 || historique.length === 0) return null;

    return (
      <div className="historique-pagination">
        <button className="btn-pagination" onClick={() => setPage(1)}
          disabled={page === 1} aria-label="Première page">⏮</button>
        <button className="btn-pagination" onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1} aria-label="Page précédente">◀</button>
        <div className="page-info">
          <span className="page-current">{page}</span>
          <span className="page-separator">/</span>
          <span className="page-total">{totalPagesCount}</span>
        </div>
        <button className="btn-pagination" onClick={() => setPage(p => Math.min(p + 1, totalPagesCount))}
          disabled={page === totalPagesCount} aria-label="Page suivante">▶</button>
        <button className="btn-pagination" onClick={() => setPage(totalPagesCount)}
          disabled={page === totalPagesCount} aria-label="Dernière page">⏭</button>
      </div>
    );
  };

  // ── JSX principal ──────────────────────────────────────────
  return (
    <div className="historique-page">
      <div className="historique-header">
        <div className="historique-header-content">
          <h1>Historique des actions</h1>
          <p>Suivi des actions sur les commandes, factures, contrats et livraisons</p>
          {isDemoMode && <div className="demo-warning">⚠️ Mode démo — données fictives</div>}
        </div>
        {renderFilters()}
      </div>

      {renderFilterForm()}

      {error && (
        <div className="historique-error" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError('')} className="error-close" aria-label="Fermer">×</button>
        </div>
      )}

      {renderStats()}

      {historique.length > 0 && !loading && (
        <div className="historique-info">
          <div className="total-info">
            {historique.length} entrée{historique.length > 1 ? 's' : ''} trouvée{historique.length > 1 ? 's' : ''}
            {entityType  && ` pour ${entityType.toLowerCase()}s`}
            {searchTerm  && ` contenant "${searchTerm}"`}
            {isDemoMode  && ' (mode démo)'}
          </div>
        </div>
      )}

      <div className="historique-table-wrapper">
        {loading ? (
          <div className="loading-block">
            <div className="spinner" />
            <p>Chargement de l'historique...</p>
          </div>
        ) : (
          <>
            {renderTable()}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default Historique;