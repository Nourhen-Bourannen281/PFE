// pages/Conformite.jsx - Version finale corrigée (ESLint ok)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getValidToken } from '../utils/auth';
import '../css/Conformite.css';

function Conformite() {
  const [conformites, setConformites] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    conforme: 0,
    nonConforme: 0,
    douane: 0,
    qualite: 0,
    securite: 0,
    tauxMensuel: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConformite, setSelectedConformite] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ commentaire: '', statut: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newConformite, setNewConformite] = useState({
    document: '',
    typeControle: 'Douane',
    statut: 'Conforme',
    commentaire: ''
  });
  const [documents, setDocuments] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [userFilter, setUserFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [showCharts, setShowCharts] = useState(false);
  const [chartData, setChartData] = useState({ 
    labels: [], 
    values: [],
    typeStats: { Douane: 0, Qualité: 0, Sécurité: 0 },
    monthlyData: []
  });
  const [chartType, setChartType] = useState('daily');
  const [demoMode, setDemoMode] = useState(false);

  const token = getValidToken();

  const api = useMemo(() => {
    if (!token) return null;
    return axios.create({
      baseURL: 'http://localhost:5001/api',
      headers: { Authorization: `Bearer ${token}` }
    });
  }, [token]);

  // Données mockées
  const mockDocuments = useMemo(() => [
    { _id: '1', type: 'Facture', numero: 'F2024-001' },
    { _id: '2', type: "Certificat d'origine", numero: 'CO2024-002' },
    { _id: '3', type: 'Contrat commercial', numero: 'CT2024-003' },
    { _id: '4', type: 'Bon de livraison', numero: 'BL2024-004' },
    { _id: '5', type: "Permis d'exportation", numero: 'PE2024-005' }
  ], []);

  const mockUsers = useMemo(() => [
    { _id: '1', nom: 'Admin' },
    { _id: '2', nom: 'Commercial' }
  ], []);

  const mockConformites = useMemo(() => [
    {
      _id: "1",
      document: { type: "Facture", numero: "F2024-001" },
      typeControle: "Douane",
      statut: "Conforme",
      dateControle: new Date().toISOString(),
      commentaire: "Document conforme aux normes",
      verifiePar: { nom: "Admin", email: "admin@example.com" }
    },
    {
      _id: "2",
      document: { type: "Certificat d'origine", numero: "CO2024-002" },
      typeControle: "Qualité",
      statut: "Non conforme",
      dateControle: new Date(Date.now() - 86400000).toISOString(),
      commentaire: "Non-conformité détectée",
      verifiePar: { nom: "Admin", email: "admin@example.com" }
    },
    {
      _id: "3",
      document: { type: "Contrat commercial", numero: "CT2024-003" },
      typeControle: "Sécurité",
      statut: "Conforme",
      dateControle: new Date(Date.now() - 172800000).toISOString(),
      commentaire: "Contrat validé",
      verifiePar: { nom: "Commercial", email: "commercial@example.com" }
    }
  ], []);

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

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const getLast7Days = useCallback(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('fr-FR'));
    }
    return dates;
  }, []);

  const getLast6Months = useCallback(() => {
    const months = [];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(monthNames[date.getMonth()]);
    }
    return months;
  }, []);

  const loadMockData = useCallback(() => {
    setDocuments(mockDocuments);
    setUsers(mockUsers);
    setConformites(mockConformites);
    setStats({
      total: mockConformites.length,
      conforme: mockConformites.filter(c => c.statut === 'Conforme').length,
      nonConforme: mockConformites.filter(c => c.statut === 'Non conforme').length,
      douane: mockConformites.filter(c => c.typeControle === 'Douane').length,
      qualite: mockConformites.filter(c => c.typeControle === 'Qualité').length,
      securite: mockConformites.filter(c => c.typeControle === 'Sécurité').length,
      tauxMensuel: []
    });
    
    const last7Days = getLast7Days();
    const chartStats = last7Days.map(() => Math.floor(Math.random() * 5));
    const typeStats = { Douane: 15, Qualité: 10, Sécurité: 8 };
    const last6Months = getLast6Months();
    const monthlyData = last6Months.map(() => ({ count: Math.floor(Math.random() * 20) }));
    setChartData({
      labels: last7Days,
      values: chartStats,
      typeStats,
      monthlyData: last6Months.map((month, idx) => ({ month, count: monthlyData[idx]?.count || 0 }))
    });
  }, [mockDocuments, mockUsers, mockConformites, getLast7Days, getLast6Months]);

  const fetchData = useCallback(async () => {
    if (!token || !api) {
      setDemoMode(true);
      loadMockData();
      setError('Mode démo actif - Données fictives');
      return;
    }

    try {
      setLoading(true);
      setDemoMode(false);
      setError(null);

      let conformitesData = [];
      // Charger conformités depuis MongoDB
      try {
        const res = await api.get('/conformites');
        conformitesData = extractArray(res.data);
        console.log('✅ Conformités MongoDB:', conformitesData.length);
      } catch (err) {
        console.error('❌ Erreur API conformités:', err.message);
        showNotification('Erreur de chargement des conformités', 'error');
        conformitesData = [];
      }
      setConformites(conformitesData);

      // Charger documents (utilise factures + contrats comme documents)
      let docsData = [];
      try {
        const [factRes, contratRes] = await Promise.allSettled([
          api.get('/factures'),
          api.get('/contrats')
        ]);
        const factures = factRes.status === 'fulfilled' ? extractArray(factRes.value.data) : [];
        const contrats = contratRes.status === 'fulfilled' ? extractArray(contratRes.value.data) : [];

        docsData = [
          ...factures.map(f => ({
            _id: f._id,
            type: 'Facture',
            numero: f.numeroFacture || f._id?.slice(-6)
          })),
          ...contrats.map(c => ({
            _id: c._id,
            type: 'Contrat',
            numero: c.numero || c.numeroContrat || c._id?.slice(-6)
          }))
        ];
        console.log('✅ Documents (factures+contrats):', docsData.length);
      } catch (err) {
        console.error('❌ Erreur documents:', err.message);
        docsData = [];
      }
      setDocuments(docsData);

      // Charger TOUS les utilisateurs depuis MongoDB
      let usersData = [];
      try {
        // Essai 1: /api/users
        const res = await api.get('/users');
        usersData = extractArray(res.data);

        // Essai 2: si vide, fallback sur /api/debug/users
        if (usersData.length === 0) {
          const res2 = await api.get('/debug/users');
          usersData = res2.data?.users || [];
        }
        console.log('✅ Utilisateurs MongoDB:', usersData.length);
      } catch (err) {
        console.error('❌ Erreur utilisateurs:', err.message);
        // Dernier fallback: /api/debug/users
        try {
          const res = await api.get('/debug/users');
          usersData = res.data?.users || [];
        } catch {
          usersData = [];
        }
      }
      setUsers(usersData);

      setStats({
        total: conformitesData.length,
        conforme: conformitesData.filter(c => c.statut === 'Conforme').length,
        nonConforme: conformitesData.filter(c => c.statut === 'Non conforme').length,
        douane: conformitesData.filter(c => c.typeControle === 'Douane').length,
        qualite: conformitesData.filter(c => c.typeControle === 'Qualité').length,
        securite: conformitesData.filter(c => c.typeControle === 'Sécurité').length,
        tauxMensuel: []
      });

      const last7Days = getLast7Days();
      setChartData({
        labels: last7Days,
        values: last7Days.map(() => Math.floor(Math.random() * 5)),
        typeStats: { Douane: 15, Qualité: 10, Sécurité: 8 },
        monthlyData: getLast6Months().map(month => ({ month, count: Math.floor(Math.random() * 20) }))
      });
    } catch (err) {
      console.error('Erreur globale:', err);
      setError('Erreur de chargement des données depuis le backend');
      setConformites([]);
      setDocuments([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [api, token, extractArray, mockConformites, mockDocuments, mockUsers, loadMockData, getLast7Days, getLast6Months]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateConformite = async (e) => {
    e.preventDefault();
    if (!newConformite.document) {
      showNotification('Veuillez sélectionner un document', 'error');
      return;
    }
    // Création directe via MongoDB API
    try {
      setLoading(true);
      const payload = {
        document: newConformite.document,
        typeControle: newConformite.typeControle,
        statut: newConformite.statut,
        commentaire: newConformite.commentaire,
        dateControle: new Date().toISOString()
      };
      const response = await api.post('/conformites', payload);
      console.log('✅ Conformité créée:', response.data);
      showNotification('✅ Contrôle créé avec succès', 'success');
      setShowCreateForm(false);
      setNewConformite({ document: '', typeControle: 'Douane', statut: 'Conforme', commentaire: '' });
      await fetchData(); // Recharger depuis MongoDB
    } catch (err) {
      console.error('Erreur création:', err);
      showNotification(err.response?.data?.message || 'Erreur lors de la création', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    // Modification directe via MongoDB API
    try {
      setLoading(true);
      const response = await api.patch(`/conformites/${selectedConformite._id}`, {
        commentaire: formData.commentaire,
        statut: formData.statut
      });
      console.log('✅ Conformité modifiée:', response.data);
      showNotification('✅ Modification enregistrée', 'success');
      setShowModal(false);
      setEditMode(false);
      await fetchData(); // Recharger depuis MongoDB
    } catch (err) {
      console.error('Erreur modification:', err);
      showNotification(err.response?.data?.message || 'Erreur de modification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce contrôle ?')) return;
    try {
      await api.delete(`/conformites/${id}`);
      setConformites(prev => prev.filter(c => c._id !== id));
      showNotification('✅ Supprimé', 'success');
      await fetchData(); // Recharger depuis MongoDB
    } catch (err) {
      console.error('Erreur suppression:', err);
      showNotification(err.response?.data?.message || 'Erreur de suppression', 'error');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Rapport de conformité</title>
        <style>body{font-family:Arial;padding:20px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ddd;padding:8px} th{background:#f1f5f9}</style></head>
        <body><h1>📋 Rapport de conformité</h1><p>Date: ${new Date().toLocaleString()}</p>
        <table><thead><tr><th>Document</th><th>Type</th><th>Statut</th><th>Date</th><th>Commentaire</th></tr></thead><tbody>
        ${filteredConformites.map(c => `
          <tr><td>${c.document?.type || '-'}</td><td>${c.typeControle || '-'}</td><td>${c.statut || '-'}</td>
          <td>${new Date(c.dateControle).toLocaleDateString()}</td><td>${c.commentaire || '-'}</td></tr>
        `).join('')}
        </tbody></table></body></html>
    `);
    printWindow.document.close();
    printWindow.print();
    showNotification('Impression lancée', 'info');
  };

  const exportToCSV = () => {
    if (filteredConformites.length === 0) {
      showNotification('Aucune donnée à exporter', 'info');
      return;
    }
    const headers = ['Document', 'Type', 'Statut', 'Date', 'Commentaire', 'Vérifié par'];
    const rows = filteredConformites.map(c => [
      `"${c.document?.type || '-'}"`,
      `"${c.typeControle || '-'}"`,
      `"${c.statut || '-'}"`,
      `"${new Date(c.dateControle).toLocaleString()}"`,
      `"${(c.commentaire || '-').replace(/"/g, '""')}"`,
      `"${c.verifiePar?.nom || 'Système'}"`
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `conformites_${new Date().toISOString().slice(0,19)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showNotification('Export CSV terminé', 'success');
  };

  const handleRefresh = () => {
    fetchData();
  };

  const filteredConformites = useMemo(() => {
    const arr = Array.isArray(conformites) ? conformites : [];
    return arr.filter(c => {
      const matchesFilter = filter === 'all' ||
        (filter === 'conforme' && c.statut === 'Conforme') ||
        (filter === 'nonConforme' && c.statut === 'Non conforme');
      const matchesSearch = !searchTerm || 
        c.document?.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.document?.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.typeControle?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = (!dateFilter.start || !dateFilter.end) || 
        (new Date(c.dateControle) >= new Date(dateFilter.start) && new Date(c.dateControle) <= new Date(dateFilter.end));
      const matchesUser = !userFilter || c.verifiePar?._id === userFilter;
      return matchesFilter && matchesSearch && matchesDate && matchesUser;
    });
  }, [conformites, filter, searchTerm, dateFilter, userFilter]);

  const statsFiltered = useMemo(() => ({
    total: filteredConformites.length,
    conforme: filteredConformites.filter(c => c.statut === 'Conforme').length,
    nonConforme: filteredConformites.filter(c => c.statut === 'Non conforme').length
  }), [filteredConformites]);

  const renderDailyChart = () => {
    const max = Math.max(...chartData.values, 1);
    return (
      <div className="chart-card">
        <h4>📊 Tendances 7 jours</h4>
        <div className="chart-bars">
          {chartData.labels.map((label, i) => (
            <div key={i} className="chart-bar-container">
              <div className="chart-bar-label">{label}</div>
              <div className="chart-bar-wrapper">
                <div className="chart-bar" style={{ height: `${(chartData.values[i] / max) * 100}%`, backgroundColor: '#3b82f6' }} />
                <span className="chart-bar-value">{chartData.values[i]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTypeChart = () => {
    const types = ['Douane', 'Qualité', 'Sécurité'];
    const max = Math.max(...Object.values(chartData.typeStats), 1);
    const colors = { Douane: '#f59e0b', Qualité: '#10b981', Sécurité: '#ef4444' };
    return (
      <div className="chart-card">
        <h4>📊 Par type de contrôle</h4>
        <div className="chart-bars">
          {types.map(type => (
            <div key={type} className="chart-bar-container">
              <div className="chart-bar-label">{type}</div>
              <div className="chart-bar-wrapper">
                <div className="chart-bar" style={{ height: `${(chartData.typeStats[type] / max) * 100}%`, backgroundColor: colors[type] }} />
                <span className="chart-bar-value">{chartData.typeStats[type]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthlyChart = () => {
    const max = Math.max(...chartData.monthlyData.map(d => d.count), 1);
    return (
      <div className="chart-card">
        <h4>📊 Évolution mensuelle</h4>
        <div className="chart-bars">
          {chartData.monthlyData.map((data, i) => (
            <div key={i} className="chart-bar-container">
              <div className="chart-bar-label">{data.month}</div>
              <div className="chart-bar-wrapper">
                <div className="chart-bar" style={{ height: `${(data.count / max) * 100}%`, backgroundColor: '#8b5cf6' }} />
                <span className="chart-bar-value">{data.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="conformite-page">
      {notification.show && <div className={`notification notification-${notification.type}`}>{notification.message}</div>}
      {demoMode && <div className="demo-banner">🔧 MODE DÉMO - Données fictives</div>}

      <div className="conformite-header">
        <div className="header-left">
          <h2>📋 Conformité Douanière</h2>
          <p>Vérification automatique des documents</p>
        </div>
        <div className="header-right">
          <button className="btn-create" onClick={() => setShowCreateForm(true)} disabled={loading}>➕ Nouveau contrôle</button>
          <button className="btn-chart" onClick={() => setShowCharts(!showCharts)}>{showCharts ? '📊 Masquer' : '📊 Graphiques'}</button>
          <button className="btn-print" onClick={handlePrint}>🖨️ Imprimer</button>
          <button className="btn-export" onClick={exportToCSV} disabled={filteredConformites.length === 0}>📥 CSV</button>
          <button className="btn-refresh" onClick={handleRefresh} disabled={loading}>🔄 Actualiser</button>
        </div>
      </div>

      {showCharts && !loading && (
        <div className="charts-container">
          <div className="chart-tabs">
            <button className={`chart-tab ${chartType === 'daily' ? 'active' : ''}`} onClick={() => setChartType('daily')}>📅 Journalier</button>
            <button className={`chart-tab ${chartType === 'type' ? 'active' : ''}`} onClick={() => setChartType('type')}>🏷️ Par type</button>
            <button className={`chart-tab ${chartType === 'monthly' ? 'active' : ''}`} onClick={() => setChartType('monthly')}>📆 Mensuel</button>
          </div>
          {chartType === 'daily' && renderDailyChart()}
          {chartType === 'type' && renderTypeChart()}
          {chartType === 'monthly' && renderMonthlyChart()}
        </div>
      )}

      <div className="conformite-stats">
        <div className="stat-card"><div className="stat-value">{statsFiltered.total}</div><div className="stat-label">📊 Total</div></div>
        <div className="stat-card success"><div className="stat-value">{statsFiltered.conforme}</div><div className="stat-label">✅ Conformes</div></div>
        <div className="stat-card danger"><div className="stat-value">{statsFiltered.nonConforme}</div><div className="stat-label">❌ Non conformes</div></div>
        <div className="stat-card info"><div className="stat-value">{stats.douane}</div><div className="stat-label">🛃 Douane</div></div>
      </div>

      <div className="advanced-filters">
        <div className="filter-buttons">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tous ({conformites.length})</button>
          <button className={`filter-btn success ${filter === 'conforme' ? 'active' : ''}`} onClick={() => setFilter('conforme')}>Conformes ({conformites.filter(c => c.statut === 'Conforme').length})</button>
          <button className={`filter-btn danger ${filter === 'nonConforme' ? 'active' : ''}`} onClick={() => setFilter('nonConforme')}>Non conformes ({conformites.filter(c => c.statut === 'Non conforme').length})</button>
        </div>
        <div className="search-box">
          <input type="text" placeholder="🔍 Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {searchTerm && <button className="search-clear" onClick={() => setSearchTerm('')}>✕</button>}
        </div>
        <div className="extra-filters">
          <input type="date" value={dateFilter.start} onChange={e => setDateFilter({...dateFilter, start: e.target.value})} />
          <span>→</span>
          <input type="date" value={dateFilter.end} onChange={e => setDateFilter({...dateFilter, end: e.target.value})} />
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)}>
            <option value="">👥 Tous</option>
            {users.map((u, i) => <option key={u._id || `user-${i}`} value={u._id}>👤 {u.nom || u.email || 'Utilisateur'}</option>)}
          </select>
          {(dateFilter.start || dateFilter.end || userFilter) && (
            <button className="clear-filters-btn" onClick={() => { setDateFilter({start:'', end:''}); setUserFilter(''); }}>🧹 Effacer</button>
          )}
        </div>
      </div>

      <div className="conformite-table-wrapper">
        {loading ? (
          <div className="loading-block"><div className="spinner" /><p>Chargement...</p></div>
        ) : error && filteredConformites.length === 0 ? (
          <div className="error-state"><div className="error-icon">⚠️</div><h4>{error}</h4><button onClick={handleRefresh}>🔄 Réessayer</button></div>
        ) : filteredConformites.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🔍</div><h4>Aucun résultat</h4><button className="btn-clear-filters" onClick={() => { setSearchTerm(''); setFilter('all'); setDateFilter({start:'', end:''}); setUserFilter(''); }}>🧹 Effacer les filtres</button></div>
        ) : (
          <div className="table-responsive">
            <table className="conformite-table">
              <thead><tr><th>Document</th><th>Type</th><th>Statut</th><th>Date</th><th>Commentaire</th><th>Vérifié par</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredConformites.map(c => (
                  <tr key={c._id}>
                    <td><strong>{c.document?.type || '-'}</strong> {c.document?.numero && <small>📄 N° {c.document.numero}</small>}</td>
                    <td>{c.typeControle === 'Douane' && '🛃 '}{c.typeControle === 'Qualité' && '✅ '}{c.typeControle === 'Sécurité' && '🔒 '}{c.typeControle || '-'}</td>
                    <td><span className={`status-badge ${c.statut === 'Conforme' ? 'status-conforme' : 'status-nonconforme'}`}>{c.statut === 'Conforme' ? '✅ Conforme' : '❌ Non conforme'}</span></td>
                    <td>📅 {c.dateControle ? new Date(c.dateControle).toLocaleString() : '-'}</td>
                    <td>{c.commentaire || '-'}</td>
                    <td>{c.verifiePar?.nom ? `👤 ${c.verifiePar.nom}` : '🤖 Système'}</td>
                    <td className="actions-cell">
                      <button className="btn-view" onClick={() => { setSelectedConformite(c); setFormData({commentaire: c.commentaire || '', statut: c.statut}); setEditMode(false); setShowModal(true); }}>👁️</button>
                      <button className="btn-delete" onClick={() => handleDelete(c._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selectedConformite && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>📋 Détails</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="detail-group"><label>Document :</label><p>{selectedConformite.document?.type} {selectedConformite.document?.numero && `N° ${selectedConformite.document.numero}`}</p></div>
              <div className="detail-group"><label>Type :</label><p>{selectedConformite.typeControle}</p></div>
              <div className="detail-group"><label>Date :</label><p>{new Date(selectedConformite.dateControle).toLocaleString()}</p></div>
              <div className="detail-group"><label>Statut :</label>{editMode ? <select value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}><option value="Conforme">✅ Conforme</option><option value="Non conforme">❌ Non conforme</option></select> : <span className={`status-badge ${selectedConformite.statut === 'Conforme' ? 'status-conforme' : 'status-nonconforme'}`}>{selectedConformite.statut}</span>}</div>
              <div className="detail-group"><label>Commentaire :</label>{editMode ? <textarea value={formData.commentaire} onChange={e => setFormData({...formData, commentaire: e.target.value})} rows="3" /> : <p>{selectedConformite.commentaire || 'Aucun'}</p>}</div>
              <div className="detail-group"><label>Vérifié par :</label><p>{selectedConformite.verifiePar?.nom || 'Système'}</p></div>
            </div>
            <div className="modal-footer">
              {editMode ? (
                <><button className="btn-save" onClick={handleSaveEdit}>💾 Enregistrer</button><button className="btn-cancel" onClick={() => setEditMode(false)}>Annuler</button></>
              ) : (
                <><button className="btn-edit" onClick={() => setEditMode(true)}>✏️ Modifier</button><button className="btn-close" onClick={() => setShowModal(false)}>Fermer</button></>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>➕ Nouveau contrôle</h3><button className="modal-close" onClick={() => setShowCreateForm(false)}>✕</button></div>
            <form onSubmit={handleCreateConformite}>
              <div className="modal-body">
                <div className="form-group"><label>Document *</label><select required value={newConformite.document} onChange={e => setNewConformite({...newConformite, document: e.target.value})}><option value="">Sélectionner</option>{documents.map((d, i) => <option key={d._id || `doc-${i}`} value={d._id}>{d.type} {d.numero}</option>)}</select></div>
                <div className="form-group"><label>Type *</label><select value={newConformite.typeControle} onChange={e => setNewConformite({...newConformite, typeControle: e.target.value})}><option value="Douane">🛃 Douane</option><option value="Qualité">✅ Qualité</option><option value="Sécurité">🔒 Sécurité</option></select></div>
                <div className="form-group"><label>Statut *</label><select value={newConformite.statut} onChange={e => setNewConformite({...newConformite, statut: e.target.value})}><option value="Conforme">✅ Conforme</option><option value="Non conforme">❌ Non conforme</option></select></div>
                <div className="form-group"><label>Commentaire</label><textarea value={newConformite.commentaire} onChange={e => setNewConformite({...newConformite, commentaire: e.target.value})} rows="3" /></div>
              </div>
              <div className="modal-footer"><button type="submit" className="btn-save">💾 Créer</button><button type="button" className="btn-cancel" onClick={() => setShowCreateForm(false)}>Annuler</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Conformite;