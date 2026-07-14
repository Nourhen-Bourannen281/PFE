// pages/commercial/Contrats.jsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

function loadSignatureImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth || 200;
        const h = img.naturalHeight || 80;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../css/Contrats.css';

const API = 'http://localhost:5001/api';

function Contrats() {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [produits, setProduits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatut, setFilterStatut] = useState('');

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const userRole = user?.role || localStorage.getItem('role') || '';
  const isAdmin = userRole.toLowerCase() === 'admin';
  const isCommercial = userRole.toLowerCase() === 'commercial';
  const isClient = userRole.toLowerCase() === 'client';
  const canView = isAdmin || isCommercial || isClient;
  const canCreate = isAdmin || isCommercial;
  const canEdit = isAdmin || isCommercial;
  const canDelete = isAdmin || isCommercial;
  const canValidate = isAdmin || isCommercial;
  const canExportPDF = isAdmin || isCommercial || isClient;

  const [form, setForm] = useState({
    numeroContrat: '',
    type: 'Vente',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    tiers: '',
    produits: [{ sousProduit: '', quantite: 1, prixUnitaire: '' }],
    devise: 'TND',
    statut: 'En attente',
    incoterm: 'EXW',
    conditionsLivraison: '',
    douane: false,
    paysDestination: '',
    portDepart: '',
    portArrivee: ''
  });

  const showToast = useCallback((message, type = 'success') => { toast[type](message); }, []);

  const extractArray = useCallback((res) => {
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res && typeof res === 'object') {
      for (const k of Object.keys(res)) { if (Array.isArray(res[k])) return res[k]; }
    }
    return [];
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const h = { headers: getHeaders() };
      
      // Gérer les erreurs individuellement pour chaque appel
      const [cRes, uRes, pRes] = await Promise.allSettled([
        axios.get(`${API}/contrats`, h),
        axios.get(`${API}/users`, h).catch(err => {
          console.warn('Erreur chargement users (403 attendu pour certains rôles):', err.message);
          return { status: 'rejected', reason: err };
        }),
        axios.get(`${API}/products`, h).catch(err => {
          console.warn('Erreur chargement products:', err.message);
          return { status: 'rejected', reason: err };
        })
      ]);
      
      if (cRes.status === 'fulfilled') setData(extractArray(cRes.value.data));
      
      // Ne pas bloquer si users échoue (certains rôles n'ont pas accès)
      if (uRes.status === 'fulfilled' && uRes.value?.data) {
        setUsers(extractArray(uRes.value.data));
      } else {
        // Si pas d'accès aux users, utiliser une liste vide
        setUsers([]);
      }
      
      if (pRes.status === 'fulfilled' && pRes.value?.data) {
        setProduits(extractArray(pRes.value.data));
      } else {
        setProduits([]);
      }
      
    } catch (err) {
      console.error('fetchAll error', err);
      showToast('Erreur chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, extractArray, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const generateContratNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const count = data.length + 1;
    const prefix = form.type === 'Export' ? 'CT-EXP' : 'CT-V';
    return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
  }, [form.type, data.length]);

  const resetForm = useCallback(() => {
    setForm({
      numeroContrat: generateContratNumber(),
      type: 'Vente',
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '',
      tiers: '',
      produits: [{ sousProduit: '', quantite: 1, prixUnitaire: '' }],
      devise: 'TND',
      statut: 'En attente',
      incoterm: 'EXW',
      conditionsLivraison: '',
      douane: false,
      paysDestination: '',
      portDepart: '',
      portArrivee: ''
    });
  }, [generateContratNumber]);

  const calculateTotal = useCallback(() => {
    return form.produits.reduce((t, item) =>
      t + (parseFloat(item.quantite) || 0) * (parseFloat(item.prixUnitaire) || 0), 0);
  }, [form.produits]);

  const handleAddProductLine = useCallback(() => {
    setForm(prev => ({ ...prev, produits: [...prev.produits, { sousProduit: '', quantite: 1, prixUnitaire: '' }] }));
  }, []);

  const handleRemoveProductLine = useCallback((index) => {
    setForm(prev => ({ ...prev, produits: prev.produits.filter((_, i) => i !== index) }));
  }, []);

  const handleProductChange = useCallback((index, field, value) => {
    setForm(prev => {
      const items = [...prev.produits];
      items[index] = { ...items[index], [field]: value };
      if (field === 'sousProduit' && value) {
        const found = produits.find(p => p._id === value);
        if (found?.prixUnitaire) items[index].prixUnitaire = found.prixUnitaire;
      }
      return { ...prev, produits: items };
    });
  }, [produits]);

  const buildPayload = useCallback(() => {
    const total = calculateTotal();
    const base = {
      numeroContrat: form.numeroContrat || generateContratNumber(),
      type:          form.type === 'Export' ? 'export' : 'vente', // Normaliser le type
      devise:        form.devise,
      montantTotal:  total,
      statut:        form.statut,
      dateDebut:     form.dateDebut || undefined,
      dateFin:       form.dateFin   || undefined,
      tiers:         form.tiers || undefined,
      produits:      form.produits
        .filter(p => p.sousProduit && p.quantite && p.prixUnitaire)
        .map(p => ({
          sousProduit:  p.sousProduit,
          quantite:     Number(p.quantite),
          prixUnitaire: Number(p.prixUnitaire),
        })),
      incoterm:             form.incoterm,
      conditionsLivraison:  form.conditionsLivraison,
      douane:               form.douane,
      paysDestination:      form.paysDestination,
      portDepart:           form.portDepart,
      portArrivee:          form.portArrivee,
    };
    
    // Attribution correcte selon le type
    if (form.type === 'Export') {
      base.importateur = form.tiers;
    } else {
      base.client = form.tiers;
    }
    
    return base;
  }, [form, calculateTotal, generateContratNumber]);

  const handleSave = useCallback(async () => {
    if (!canCreate) { showToast('Accès refusé', 'error'); return; }
    if (!form.numeroContrat?.trim()) { showToast('Le numéro de contrat est requis', 'error'); return; }
    if (!form.tiers) { showToast('Sélectionnez un partenaire', 'error'); return; }
    if (!form.dateFin) { showToast('La date de fin est requise', 'error'); return; }
    if (form.dateFin <= form.dateDebut) { showToast('La date de fin doit être après la date de début', 'error'); return; }

    setSaving(true);
    try {
      const h = { headers: getHeaders() };
      const payload = buildPayload();
      if (editingId) {
        await axios.put(`${API}/contrats/${editingId}`, payload, h);
        showToast(`Contrat ${form.numeroContrat} modifié`);
      } else {
        await axios.post(`${API}/contrats`, payload, h);
        showToast(`Contrat ${form.numeroContrat} créé`);
      }
      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchAll();
    } catch (err) {
      console.error('Save error:', err);
      showToast(err.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  }, [canCreate, form, editingId, getHeaders, buildPayload, showToast, resetForm, fetchAll]);

  const handleEdit = useCallback((item) => {
    if (!canEdit) { showToast('Accès refusé', 'error'); return; }
    setEditingId(item._id);
    const tiersId = item.client?._id || item.importateur?._id || item.fournisseur?._id || '';
    const typeLabel = item.type === 'export' ? 'Export' : 'Vente';
    setForm({
      numeroContrat: item.numeroContrat || '',
      type: typeLabel,
      dateDebut: item.dateCreation?.split('T')[0] || new Date().toISOString().split('T')[0],
      dateFin: item.dateFin?.split('T')[0] || '',
      tiers: tiersId,
      produits: item.produits?.length > 0 ? item.produits.map(p => ({
        sousProduit: p.sousProduit?._id || p.sousProduit || '',
        quantite: p.quantite || 1,
        prixUnitaire: p.prixUnitaire || ''
      })) : [{ sousProduit: '', quantite: 1, prixUnitaire: '' }],
      devise: item.devise || 'TND',
      statut: item.statut || 'En attente',
      incoterm: item.incoterm || 'EXW',
      conditionsLivraison: item.conditionsLivraison || '',
      douane: item.douane || false,
      paysDestination: item.paysDestination || '',
      portDepart: item.portDepart || '',
      portArrivee: item.portArrivee || ''
    });
    setShowModal(true);
  }, [canEdit, showToast]);

  const handleDelete = useCallback(async (id, numero) => {
    if (!canDelete) { showToast('Accès refusé', 'error'); return; }
    if (!window.confirm(`Supprimer le contrat ${numero} ?`)) return;
    try {
      await axios.delete(`${API}/contrats/${id}`, { headers: getHeaders() });
      showToast('Contrat supprimé');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur suppression', 'error');
    }
  }, [canDelete, getHeaders, showToast, fetchAll]);

  const handleValidate = useCallback(async (id, numero) => {
    if (!canValidate) { showToast('Accès refusé', 'error'); return; }
    try {
      await axios.put(`${API}/contrats/${id}`, { statut: 'Validé' }, { headers: getHeaders() });
      showToast(`Contrat ${numero} validé`);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur validation', 'error');
    }
  }, [canValidate, getHeaders, showToast, fetchAll]);

  const getTiersName = (item) => {
    if (item.client?.nom) return item.client.nom;
    if (item.client?.raisonSociale) return item.client.raisonSociale;
    if (item.importateur?.nom) return item.importateur.nom;
    if (item.importateur?.raisonSociale) return item.importateur.raisonSociale;
    if (item.fournisseur?.nom) return item.fournisseur.nom;
    if (item.fournisseur?.raisonSociale) return item.fournisseur.raisonSociale;
    return '-';
  };

  const getTypeLabel = (type) => {
    if (type === 'export') return 'Export';
    if (type === 'achat') return 'Achat';
    return 'Vente';
  };

  const exportContratPDF = useCallback(async (contrat) => {
    if (!canExportPDF) { showToast('Accès refusé', 'error'); return; }
    setPdfLoading(contrat._id);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 20;
      let yPos = 20;

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 60, 94);
      doc.text(contrat.type === 'export' ? 'CONTRAT D\'EXPORTATION' : 'CONTRAT DE VENTE', pageWidth / 2, yPos, { align: 'center' });

      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`N° ${contrat.numeroContrat}`, pageWidth / 2, yPos, { align: 'center' });

      yPos += 12;
      doc.setDrawColor(200, 200, 200);
      doc.line(marginX, yPos, pageWidth - marginX, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 60, 94);
      doc.text('RÉFÉRENCES DU CONTRAT', marginX, yPos);
      yPos += 7;

      autoTable(doc, {
        startY: yPos,
        head: [['Information', 'Valeur']],
        body: [
          ['Numéro', contrat.numeroContrat],
          ['Type', getTypeLabel(contrat.type)],
          ['Devise', contrat.devise || 'TND'],
          ['Montant Total', `${(contrat.montantTotal || 0).toLocaleString()} ${contrat.devise || 'TND'}`],
          ['Statut', contrat.statut],
          ['Date création', new Date(contrat.dateCreation).toLocaleDateString('fr-FR')],
        ],
        theme: 'striped',
        headStyles: { fillColor: [26, 60, 94], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        margin: { left: marginX, right: marginX }
      });

      yPos = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 60, 94);
      doc.text('PARTENAIRE', marginX, yPos);
      yPos += 7;

      const tiersName = getTiersName(contrat);
      autoTable(doc, {
        startY: yPos,
        head: [['Information', 'Valeur']],
        body: [
          ['Nom / Raison sociale', tiersName],
          ['Email', contrat.client?.email || contrat.importateur?.email || 'N/A'],
          ['Rôle', contrat.client?.role || contrat.importateur?.role || 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [26, 60, 94], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        margin: { left: marginX, right: marginX }
      });

      yPos = doc.lastAutoTable.finalY + 15;

      if (yPos > pageHeight - 100) { doc.addPage(); yPos = 20; }

      const sigColW = (pageWidth - 2 * marginX) / 2 - 5;
      const sigLeft = marginX;
      const sigRight = pageWidth / 2 + 5;

      const todayFr = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
      }).toUpperCase();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Fait à Tunis, le', sigLeft, yPos);
      const afterFaitA = sigLeft + doc.getTextWidth('Fait à Tunis, le ') + 1;
      doc.setFont('helvetica', 'bold');
      doc.text(todayFr, afterFaitA, yPos);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(afterFaitA - 1, yPos + 1, afterFaitA + doc.getTextWidth(todayFr) + 1, yPos + 1);
      doc.setLineWidth(0.2);
      doc.setFont('helvetica', 'normal');

      yPos += 14;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text((tiersName || 'CLIENT').toUpperCase().substring(0, 28), sigLeft, yPos);
      doc.text('SMART-TRADE 360°', sigRight, yPos);

      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const dots = '..........................................';
      doc.text(dots, sigLeft, yPos);
      yPos += 5;
      doc.text(dots, sigLeft, yPos);

      const sigImgY = yPos - 12;
      const signatureBase64 = await loadSignatureImage('/images/signature-etap.jpg');
      if (signatureBase64) {
        doc.addImage(signatureBase64, 'PNG', sigRight, sigImgY, sigColW, 30);
      } else {
        doc.text(dots, sigRight, yPos - 5);
        doc.text(dots, sigRight, yPos);
      }

      yPos += 30;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.line(sigLeft, yPos, sigLeft + sigColW, yPos);
      doc.line(sigRight, yPos, sigRight + sigColW, yPos);

      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('M. ____________________________', sigLeft, yPos);
      doc.text('M. Le Directeur Général', sigRight, yPos);

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, marginX, pageHeight - 10);

      const link = document.createElement('a');
      link.href = URL.createObjectURL(doc.output('blob'));
      link.download = `Contrat_${contrat.numeroContrat}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      showToast('PDF téléchargé');
    } catch (err) {
      console.error('PDF error', err);
      showToast('Erreur export PDF', 'error');
    } finally {
      setPdfLoading(null);
    }
  }, [canExportPDF, showToast]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = (item.numeroContrat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTiersName(item).toLowerCase().includes(searchTerm.toLowerCase());
      const typeLabel = getTypeLabel(item.type);
      const matchType = filterType === 'all' || typeLabel === filterType;
      const matchStatut = !filterStatut || item.statut === filterStatut;
      return matchSearch && matchType && matchStatut;
    });
  }, [data, searchTerm, filterType, filterStatut]);

  const stats = useMemo(() => ({
    total: data.length,
    ventes: data.filter(d => d.type === 'vente').length,
    exports: data.filter(d => d.type === 'export').length,
    enAttente: data.filter(d => d.statut === 'En attente').length,
    valides: data.filter(d => d.statut === 'Validé').length,
    montantTotal: data.reduce((s, d) => s + (d.montantTotal || 0), 0),
  }), [data]);

  const tiersForForm = useMemo(() => {
    if (form.type === 'Export') return users.filter(u => u.role === 'Fournisseur' || u.role === 'Commercial' || u.role === 'Client');
    return users.filter(u => u.role === 'Client');
  }, [users, form.type]);

  const getRoleLabel = () => {
    if (isAdmin) return '👤 Administrateur - Gestion complète';
    if (isCommercial) return '💼 Commercial - Gestion des contrats';
    if (isClient) return '👁️ Client - Consultation';
    return '';
  };

  if (!canView) {
    return (
      <div className="page-contrats">
        <div className="empty-state" style={{ margin: '100px auto' }}>
          <div className="empty-state-icon">🔒</div>
          <h4>Accès refusé</h4>
          <p>Vous n'avez pas les permissions nécessaires</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-contrats">
        <div className="empty-state" style={{ margin: '100px auto' }}>
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-contrats">
      <div className="role-banner">{getRoleLabel()}</div>

      <div className="header-contrats">
        <div className="header-left">
          <h2>📄 Gestion des Contrats</h2>
          <p>Contrats de vente et d'exportation</p>
        </div>

        <div className="contrats-stats">
          <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total</div></div>
          <div className="stat-card"><div className="stat-number">{stats.ventes}</div><div className="stat-label">Ventes</div></div>
          <div className="stat-card"><div className="stat-number">{stats.exports}</div><div className="stat-label">Exports</div></div>
          <div className="stat-card"><div className="stat-number">{stats.enAttente}</div><div className="stat-label">En attente</div></div>
          <div className="stat-card"><div className="stat-number">{stats.valides}</div><div className="stat-label">Validés</div></div>
          <div className="stat-card"><div className="stat-number">{(stats.montantTotal / 1000).toFixed(0)}k</div><div className="stat-label">Montant</div></div>
        </div>

        <div className="header-buttons">
          {canCreate && (
            <button className="btn-nouveau" onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}>
              + Nouveau Contrat
            </button>
          )}
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="type-filter">
            <option value="all">📋 Tous les types</option>
            <option value="Vente">📝 Ventes</option>
            <option value="Export">🌍 Exportations</option>
          </select>
        </div>
        <div className="statut-filter">
          <button className={`filter-btn ${!filterStatut ? 'active' : ''}`} onClick={() => setFilterStatut('')}>Tous</button>
          <button className={`filter-btn ${filterStatut === 'En attente' ? 'active' : ''}`} onClick={() => setFilterStatut('En attente')}>⏳ En attente</button>
          <button className={`filter-btn ${filterStatut === 'Validé' ? 'active' : ''}`} onClick={() => setFilterStatut('Validé')}>✅ Validés</button>
          <button className={`filter-btn ${filterStatut === 'Terminé' ? 'active' : ''}`} onClick={() => setFilterStatut('Terminé')}>🏁 Terminés</button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h4>Aucun contrat trouvé</h4>
          <p>{searchTerm ? 'Aucun contrat ne correspond à votre recherche' : 'Commencez par créer un nouveau contrat'}</p>
          {canCreate && !searchTerm && (
            <button className="btn-add-first" onClick={() => { resetForm(); setShowModal(true); }}>+ Créer un contrat</button>
          )}
        </div>
      ) : (
        <div className="contrats-grid">
          {filteredData.map(item => (
            <div key={item._id} className={`contrat-card ${item.type === 'export' ? 'export-card' : 'vente-card'}`}>
              <div className="contrat-card-header">
                <div className="contrat-number">
                  <span className="contrat-icon">{item.type === 'export' ? '🌍' : '📝'}</span>
                  <span className="contrat-num">{item.numeroContrat}</span>
                </div>
                <div className="contrat-badges">
                  <div className={`badge badge-type ${item.type === 'export' ? 'export' : ''}`}>
                    {getTypeLabel(item.type)}
                  </div>
                  <div className={`badge badge-status ${item.statut === 'Validé' ? 'success' : item.statut === 'Terminé' ? 'complete' : ''}`}>
                    {item.statut}
                  </div>
                </div>
              </div>

              <div className="contrat-card-body">
                <div className="contrat-info">
                  <div className="info-row">
                    <span className="info-label">Partenaire:</span>
                    <span className="info-value">{getTiersName(item)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Devise:</span>
                    <span className="info-value">{item.devise || 'TND'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Créé le:</span>
                    <span className="info-value">{new Date(item.dateCreation).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <div className="contrat-montant">
                  <span>Montant:</span>
                  <strong>{(item.montantTotal || 0).toLocaleString()} {item.devise}</strong>
                </div>
              </div>

              <div className="contrat-card-actions">
                {canExportPDF && (
                  <button onClick={() => exportContratPDF(item)} className="btn-action pdf" disabled={pdfLoading === item._id}>
                    {pdfLoading === item._id ? '⏳' : '📄'} PDF
                  </button>
                )}
                {canValidate && item.statut !== 'Validé' && item.statut !== 'Terminé' && (
                  <button onClick={() => handleValidate(item._id, item.numeroContrat)} className="btn-action validate">
                    ✅ Valider
                  </button>
                )}
                {canEdit && item.statut !== 'Validé' && item.statut !== 'Terminé' && (
                  <button onClick={() => handleEdit(item)} className="btn-action edit">
                    ✏️ Modifier
                  </button>
                )}
                {canDelete && item.statut !== 'Validé' && item.statut !== 'Terminé' && (
                  <button onClick={() => handleDelete(item._id, item.numeroContrat)} className="btn-action delete">
                    🗑️ Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {canCreate && showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? '✏️ Modifier' : '📝 Nouveau Contrat'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="Vente">Vente locale</option>
                    <option value="Export">Exportation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Numéro *</label>
                  <input value={form.numeroContrat} onChange={e => setForm({ ...form, numeroContrat: e.target.value })} placeholder="Auto-généré" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date de début *</label>
                  <input type="date" value={form.dateDebut} onChange={e => setForm({ ...form, dateDebut: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Date de fin *</label>
                  <input type="date" value={form.dateFin} onChange={e => setForm({ ...form, dateFin: e.target.value })} min={form.dateDebut} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Partenaire *</label>
                  <select value={form.tiers} onChange={e => setForm({ ...form, tiers: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {tiersForForm.map((u) => (
                      <option key={u._id || u.id} value={u._id || u.id}>
                        {u.nom || u.raisonSociale || u.email} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Devise</label>
                  <select value={form.devise} onChange={e => setForm({ ...form, devise: e.target.value })}>
                    <option value="TND">TND</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Statut</label>
                  <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                    <option value="En attente">En attente</option>
                    <option value="Validé">Validé</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Incoterm</label>
                  <select value={form.incoterm} onChange={e => setForm({ ...form, incoterm: e.target.value })}>
                    <option value="EXW">EXW</option>
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                    <option value="DAP">DAP</option>
                  </select>
                </div>
              </div>

              <h4>📦 Produits (calcul montant)</h4>
              {form.produits.map((prod, idx) => (
                <div key={idx} className="produit-ligne">
                  <select value={prod.sousProduit} onChange={e => handleProductChange(idx, 'sousProduit', e.target.value)}>
                    <option value="">Sélectionner produit</option>
                    {produits.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.nom}
                      </option>
                    ))}
                  </select>
                  <input type="number" placeholder="Qté" value={prod.quantite} onChange={e => handleProductChange(idx, 'quantite', e.target.value)} min="1" />
                  <input type="number" placeholder="Prix" value={prod.prixUnitaire} onChange={e => handleProductChange(idx, 'prixUnitaire', e.target.value)} min="0" step="0.01" />
                  {form.produits.length > 1 && (
                    <button type="button" className="btn-remove" onClick={() => handleRemoveProductLine(idx)}>🗑️</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-add-produit" onClick={handleAddProductLine}>+ Ajouter ligne</button>
              <div className="total">Total : <strong>{calculateTotal().toLocaleString()} {form.devise}</strong></div>
            </div>

            <div className="modal-buttons">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Enregistrement...' : (editingId ? 'Modifier' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contrats;