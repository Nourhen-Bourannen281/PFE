import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getValidToken } from '../utils/auth';
import '../css/ExportImport.css';

function ExportImport() {
  const [emissions, setEmissions] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [pays, setPays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedContrat, setSelectedContrat] = useState('');
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    numeroEmission: '',
    contrat: '',
    destination: '',
    dateEmission: new Date().toISOString().split('T')[0],
    statut: 'En cours'
  });
  const [demoMode, setDemoMode] = useState(false);

  const token = getValidToken();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const isAdmin = user.role === 'Admin';
  const isCommercial = user.role === 'Commercial';

  const api = useMemo(() => {
    if (!token) return null;
    return axios.create({
      baseURL: 'http://localhost:5001/api',
      headers: { Authorization: `Bearer ${token}` }
    });
  }, [token]);

  // Données mockées (fallback complet)
  const mockPays = useMemo(() => [
    { _id: 'p1', nom: 'France', code: 'FR', continent: 'Europe' },
    { _id: 'p2', nom: 'Italie', code: 'IT', continent: 'Europe' },
    { _id: 'p3', nom: 'Algérie', code: 'DZ', continent: 'Afrique' },
    { _id: 'p4', nom: 'Tunisie', code: 'TN', continent: 'Afrique' },
    { _id: 'p5', nom: 'Allemagne', code: 'DE', continent: 'Europe' },
    { _id: 'p6', nom: 'Espagne', code: 'ES', continent: 'Europe' },
    { _id: 'p7', nom: 'Maroc', code: 'MA', continent: 'Afrique' },
    { _id: 'p8', nom: 'Libye', code: 'LY', continent: 'Afrique' },
    { _id: 'p9', nom: 'Turquie', code: 'TR', continent: 'Asie' },
    { _id: 'p10', nom: 'Chine', code: 'CN', continent: 'Asie' }
  ], []);

  const mockContrats = useMemo(() => [
    { _id: 'c1', numeroContrat: 'CT-2024-0001', type: 'vente', client: { raisonSociale: 'STEG' }, devise: 'TND' },
    { _id: 'c2', numeroContrat: 'CT-2024-0002', type: 'achat', fournisseur: { raisonSociale: 'STIR' }, devise: 'USD' },
    { _id: 'c3', numeroContrat: 'EXP-2024-0001', type: 'export', importateur: { raisonSociale: 'Entreprise Française SARL' }, devise: 'EUR' },
    { _id: 'c4', numeroContrat: 'EXP-2024-0002', type: 'export', importateur: { raisonSociale: 'Italian Import Srl' }, devise: 'EUR' },
    { _id: 'c5', numeroContrat: 'CT-2024-0005', type: 'vente', client: { raisonSociale: 'Ooredoo Tunisie' }, devise: 'TND' },
    { _id: 'c6', numeroContrat: 'EXP-2024-0003', type: 'export', importateur: { raisonSociale: 'Deutsche Energy GmbH' }, devise: 'EUR' }
  ], []);

  const mockEmissions = useMemo(() => [
    {
      _id: 'e1',
      numeroEmission: 'EXP-2025-0001',
      contrat: { _id: 'c3', numeroContrat: 'EXP-2024-0001' },
      destination: { _id: 'p1', nom: 'France' },
      dateEmission: '2025-01-15T10:00:00Z',
      statut: 'Terminé'
    },
    {
      _id: 'e2',
      numeroEmission: 'EXP-2025-0002',
      contrat: null,
      destination: { _id: 'p2', nom: 'Italie' },
      dateEmission: '2025-01-20T10:00:00Z',
      statut: 'En cours'
    },
    {
      _id: 'e3',
      numeroEmission: 'EXP-2025-0003',
      contrat: { _id: 'c4', numeroContrat: 'EXP-2024-0002' },
      destination: { _id: 'p2', nom: 'Italie' },
      dateEmission: '2025-01-25T10:00:00Z',
      statut: 'En cours'
    },
    {
      _id: 'e4',
      numeroEmission: 'EXP-2025-0004',
      contrat: null,
      destination: { _id: 'p5', nom: 'Allemagne' },
      dateEmission: '2025-02-01T10:00:00Z',
      statut: 'Annulé'
    },
    {
      _id: 'e5',
      numeroEmission: 'EXP-2025-0005',
      contrat: { _id: 'c6', numeroContrat: 'EXP-2024-0003' },
      destination: { _id: 'p5', nom: 'Allemagne' },
      dateEmission: '2025-02-05T10:00:00Z',
      statut: 'Terminé'
    }
  ], []);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  // Helper pour extraire un tableau depuis la réponse API (gère { data: [...] })
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

  // Chargement des données (API ou mode démo)
  const fetchData = useCallback(async () => {
    if (!token || !api) {
      setDemoMode(true);
      setPays(mockPays);
      setContrats(mockContrats);
      setEmissions(mockEmissions);
      addToast('Mode démo actif - Données fictives', 'info');
      return;
    }

    try {
      setLoading(true);
      setDemoMode(false);

      let emissionsData = [];
      try {
        const emissionsRes = await api.get('/emissions');
        emissionsData = extractArray(emissionsRes.data);
      } catch {
        console.warn('Erreur chargement émissions, utilisation mock');
        emissionsData = mockEmissions;
        addToast('Utilisation mock émissions', 'info');
      }
      setEmissions(emissionsData);

      let contratsData = [];
      try {
        const contratsRes = await api.get('/contrats');
        contratsData = extractArray(contratsRes.data);
      } catch {
        console.warn('Erreur chargement contrats, utilisation mock');
        contratsData = mockContrats;
        addToast('Utilisation mock contrats', 'info');
      }
      setContrats(contratsData);

      let paysData = [];
      try {
        const paysRes = await api.get('/pays');
        paysData = extractArray(paysRes.data);
      } catch {
        console.warn('Erreur chargement pays, utilisation mock');
        paysData = mockPays;
      }
      setPays(paysData);
    } catch (error) {
      console.error('Erreur fetchData:', error);
      addToast('Erreur chargement, mode démo activé', 'error');
      setDemoMode(true);
      setEmissions(mockEmissions);
      setContrats(mockContrats);
      setPays(mockPays);
    } finally {
      setLoading(false);
    }
  }, [api, token, addToast, mockEmissions, mockContrats, mockPays, extractArray]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createEmission = async () => {
    if (!isCommercial && !isAdmin) {
      addToast('Droits insuffisants', 'error');
      return;
    }
    if (demoMode) {
      addToast('Mode démo : création désactivée', 'error');
      return;
    }
    if (!formData.numeroEmission || !formData.destination || !formData.dateEmission) {
      addToast('Champs obligatoires manquants', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        numeroEmission: formData.numeroEmission,
        contrat: formData.contrat || null,
        destination: formData.destination,
        dateEmission: formData.dateEmission,
        statut: formData.statut
      };
      const response = await api.post('/emissions', payload);
      setEmissions(prev => [response.data, ...prev]);
      addToast('✅ Émission créée', 'success');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      addToast(error.response?.data?.message || 'Erreur création', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numeroEmission: '',
      contrat: '',
      destination: '',
      dateEmission: new Date().toISOString().split('T')[0],
      statut: 'En cours'
    });
  };

  const handleAssociate = async () => {
    if (!selectedItem || !selectedContrat) {
      addToast('Sélectionnez un contrat', 'error');
      return;
    }
    if (demoMode) {
      // Simulation locale
      setEmissions(prev =>
        prev.map(item =>
          item._id === selectedItem._id
            ? { ...item, contrat: contrats.find(c => c._id === selectedContrat) }
            : item
        )
      );
      addToast('✅ Association simulée (mode démo)', 'success');
      setShowAssociateModal(false);
      setSelectedContrat('');
      setSelectedItem(null);
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch(`/emissions/${selectedItem._id}/associate`, { contratId: selectedContrat });
      setEmissions(prev => prev.map(item => item._id === selectedItem._id ? response.data : item));
      addToast('✅ Association réussie', 'success');
      setShowAssociateModal(false);
      setSelectedContrat('');
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      addToast(error.response?.data?.message || 'Erreur association', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, numero) => {
    if (!isAdmin && !isCommercial) {
      addToast('Droits insuffisants', 'error');
      return;
    }
    if (demoMode) {
      setEmissions(prev => prev.filter(item => item._id !== id));
      addToast(`✅ Suppression simulée: ${numero}`, 'success');
      return;
    }
    if (window.confirm(`Supprimer ${numero} ?`)) {
      try {
        await api.delete(`/emissions/${id}`);
        setEmissions(prev => prev.filter(item => item._id !== id));
        addToast('✅ Supprimé', 'success');
        fetchData();
      } catch (error) {
        addToast(error.response?.data?.message || 'Erreur suppression', 'error');
      }
    }
  };

  const updateStatut = async (id, statut, numero) => {
    if (!isAdmin && !isCommercial) {
      addToast('Droits insuffisants', 'error');
      return;
    }
    if (demoMode) {
      setEmissions(prev =>
        prev.map(item => item._id === id ? { ...item, statut } : item)
      );
      addToast(`✅ Statut ${numero} -> ${statut} (démo)`, 'info');
      return;
    }
    try {
      const response = await api.patch(`/emissions/${id}/statut`, { statut });
      setEmissions(prev => prev.map(item => item._id === id ? response.data : item));
      addToast(`✅ Statut mis à jour`, 'success');
      fetchData();
    } catch (error) {
      addToast(error.response?.data?.message || 'Erreur mise à jour', 'error');
    }
  };

  const exportToExcel = () => {
    try {
      if (emissions.length === 0) {
        addToast('Aucune donnée à exporter', 'error');
        return;
      }
      const exportData = emissions.map(item => ({
        'Numéro': item.numeroEmission,
        'Contrat': item.contrat?.numeroContrat || 'Non associé',
        'Destination': item.destination?.nom || '-',
        'Date': new Date(item.dateEmission).toLocaleDateString('fr-FR'),
        'Statut': item.statut || 'En cours'
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Emissions');
      XLSX.writeFile(wb, `emissions_${new Date().toISOString().split('T')[0]}.xlsx`);
      addToast('📊 Export Excel réussi', 'success');
    } catch {
      addToast('Erreur export Excel', 'error');
    }
  };

  const exportToPDF = () => {
    try {
      if (emissions.length === 0) {
        addToast('Aucune donnée', 'error');
        return;
      }
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(10, 37, 64);
      doc.text('LISTE DES ÉMISSIONS', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
      const tableData = emissions.map(item => [
        item.numeroEmission,
        item.contrat?.numeroContrat || 'Non associé',
        item.destination?.nom || '-',
        new Date(item.dateEmission).toLocaleDateString('fr-FR'),
        item.statut || 'En cours'
      ]);
      autoTable(doc, {
        startY: 40,
        head: [['Numéro', 'Contrat', 'Destination', 'Date', 'Statut']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        margin: { left: 15, right: 15 }
      });
      doc.save(`emissions_${new Date().toISOString().split('T')[0]}.pdf`);
      addToast('📄 Export PDF réussi', 'success');
    } catch {
      addToast('Erreur export PDF', 'error');
    }
  };

  const getStatusClass = (statut) => {
    switch(statut) {
      case 'Terminé': return 'status-completed';
      case 'En cours': return 'status-progress';
      case 'Annulé': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  const getStatusIcon = (statut) => {
    switch(statut) {
      case 'Terminé': return '✅';
      case 'En cours': return '🔄';
      case 'Annulé': return '❌';
      default: return '📦';
    }
  };

  const getPartenaireNom = (contrat) => {
    if (!contrat) return null;
    return contrat.client?.raisonSociale || contrat.fournisseur?.raisonSociale || contrat.importateur?.raisonSociale || null;
  };

  const filteredData = useMemo(() => {
    const emissionsArray = Array.isArray(emissions) ? emissions : [];
    return emissionsArray.filter(item => {
      const numero = item.numeroEmission || '';
      const contratNumero = item.contrat?.numeroContrat || '';
      const paysNom = item.destination?.nom || '';
      return numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
             contratNumero.toLowerCase().includes(searchTerm.toLowerCase()) ||
             paysNom.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [emissions, searchTerm]);

  const stats = useMemo(() => {
    const emissionsArray = Array.isArray(emissions) ? emissions : [];
    return {
      total: emissionsArray.length,
      enCours: emissionsArray.filter(e => e.statut === 'En cours').length,
      termines: emissionsArray.filter(e => e.statut === 'Terminé').length,
      annules: emissionsArray.filter(e => e.statut === 'Annulé').length,
      associees: emissionsArray.filter(e => e.contrat).length
    };
  }, [emissions]);

  return (
    <div className="export-page">
      

      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              <span className="toast-icon">{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : 'ℹ'}</span>
              <span className="toast-message">{toast.message}</span>
            </div>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>×</button>
          </div>
        ))}
      </div>

      <div className="export-header">
        <div className="header-left">
          <h2>📦 Gestion des Émissions (Export)</h2>
          <p>Gestion des exportations internationales</p>
          <div className="role-badges">
            {isAdmin && <span className="role-badge admin">👑 Administrateur</span>}
            {isCommercial && <span className="role-badge commercial">💼 Commercial</span>}
          </div>
        </div>
      </div>

      <div className="export-stats">
        <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total Émissions</div></div>
        <div className="stat-card progress"><div className="stat-number">{stats.enCours}</div><div className="stat-label">En cours</div></div>
        <div className="stat-card success"><div className="stat-number">{stats.termines}</div><div className="stat-label">Terminées</div></div>
        <div className="stat-card cancelled"><div className="stat-number">{stats.annules}</div><div className="stat-label">Annulées</div></div>
        <div className="stat-card info"><div className="stat-number">{stats.associees}</div><div className="stat-label">Associées</div></div>
      </div>

      <div className="export-actions">
        {(isCommercial || isAdmin) && (
          <button className="btn-create" onClick={() => setShowModal(true)} disabled={loading}>+ Nouvelle Émission</button>
        )}
        <button className="btn-excel" onClick={exportToExcel} disabled={loading || filteredData.length === 0}>📊 Exporter Excel</button>
        <button className="btn-pdf" onClick={exportToPDF} disabled={loading || filteredData.length === 0}>📄 Exporter PDF</button>
      </div>

      <div className="search-section">
        <div className="search-box">
          <input type="text" placeholder="🔍 Rechercher par numéro, contrat ou destination..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
        </div>
      </div>

      <div className="export-table-wrapper">
        {loading ? (
          <div className="loading-block"><div className="spinner" /><p>Chargement...</p></div>
        ) : filteredData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h4>Aucune donnée</h4>
            <p>Aucune émission trouvée.</p>
            {(isCommercial || isAdmin) && <button className="btn-add-first" onClick={() => setShowModal(true)}>+ Créer une émission</button>}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Numéro</th><th>Contrat</th><th>Partenaire</th><th>Destination</th><th>Date</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredData.map(item => {
                const partenaireNom = getPartenaireNom(item.contrat);
                return (
                  <tr key={item._id}>
                    <td data-label="Numéro"><strong>{item.numeroEmission}</strong></td>
                    <td data-label="Contrat" className={item.contrat ? 'associated' : 'not-associated'}>{item.contrat?.numeroContrat || 'Non associé'}</td>
                    <td data-label="Partenaire">{partenaireNom || '-'}</td>
                    <td data-label="Destination">{item.destination?.nom || '-'}</td>
                    <td data-label="Date">{new Date(item.dateEmission).toLocaleDateString('fr-FR')}</td>
                    <td data-label="Statut">
                      {(isAdmin || isCommercial) ? (
                        <select className={`status-select ${getStatusClass(item.statut)}`} value={item.statut} onChange={(e) => updateStatut(item._id, e.target.value, item.numeroEmission)} disabled={loading}>
                          <option value="En cours">🔄 En cours</option>
                          <option value="Terminé">✅ Terminé</option>
                          <option value="Annulé">❌ Annulé</option>
                        </select>
                      ) : (
                        <span className={`status-badge ${getStatusClass(item.statut)}`}>{getStatusIcon(item.statut)} {item.statut}</span>
                      )}
                    </td>
                    <td data-label="Actions" className="actions-cell">
                      {!item.contrat && (isCommercial || isAdmin) && (
                        <button className="btn-associate" onClick={() => { setSelectedItem(item); setShowAssociateModal(true); }} disabled={loading}>🔗 Associer</button>
                      )}
                      {(isAdmin || isCommercial) && (
                        <button className="btn-delete" onClick={() => handleDelete(item._id, item.numeroEmission)} disabled={loading}>🗑️ Supprimer</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal création */}
      {showModal && (isCommercial || isAdmin) && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>📝 Nouvelle Émission</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Numéro *</label><input type="text" placeholder="EXP-2025-0001" value={formData.numeroEmission} onChange={e => setFormData({...formData, numeroEmission: e.target.value})} /></div>
              <div className="form-group"><label>Contrat (optionnel)</label><select value={formData.contrat} onChange={e => setFormData({...formData, contrat: e.target.value})}><option value="">-- Sans contrat --</option>{contrats.map(c => <option key={c._id} value={c._id}>{c.numeroContrat} - {c.client?.raisonSociale || c.fournisseur?.raisonSociale || c.importateur?.raisonSociale}</option>)}</select></div>
              <div className="form-group"><label>Pays de destination *</label><select value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})}><option value="">-- Sélectionner un pays --</option>{pays.map(p => <option key={p._id} value={p._id}>{p.nom}</option>)}</select></div>
              <div className="form-group"><label>Date *</label><input type="date" value={formData.dateEmission} onChange={e => setFormData({...formData, dateEmission: e.target.value})} /></div>
              <div className="form-group"><label>Statut</label><select value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}><option value="En cours">🔄 En cours</option><option value="Terminé">✅ Terminé</option><option value="Annulé">❌ Annulé</option></select></div>
            </div>
            <div className="modal-buttons"><button className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button><button className="btn-save" onClick={createEmission} disabled={loading}>{loading ? 'Création...' : 'Créer'}</button></div>
          </div>
        </div>
      )}

      {/* Modal association */}
      {showAssociateModal && (isCommercial || isAdmin) && (
        <div className="modal-overlay" onClick={() => setShowAssociateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>🔗 Associer un contrat</h3><button className="modal-close" onClick={() => setShowAssociateModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Sélectionner un contrat *</label><select value={selectedContrat} onChange={e => setSelectedContrat(e.target.value)}><option value="">-- Choisir un contrat --</option>{contrats.map(c => <option key={c._id} value={c._id}>{c.numeroContrat} - {c.client?.raisonSociale || c.fournisseur?.raisonSociale || c.importateur?.raisonSociale}</option>)}</select></div>
              <div className="info-box"><p><strong>Émission à associer:</strong> {selectedItem?.numeroEmission}</p><p><strong>Destination:</strong> {selectedItem?.destination?.nom}</p></div>
            </div>
            <div className="modal-buttons"><button className="btn-cancel" onClick={() => setShowAssociateModal(false)}>Annuler</button><button className="btn-save" onClick={handleAssociate} disabled={loading}>{loading ? 'Association...' : 'Associer'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExportImport;