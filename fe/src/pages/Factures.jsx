import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getValidToken } from '../utils/auth';
import '../css/Factures.css';

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

function Factures() {
  const [factures, setFactures] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [typesFacture, setTypesFacture] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    typeFacture: '',
    contrat: '',
    montantHT: '',
    dateEcheance: ''
  });
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    payees: 0,
    annulees: 0,
    totalMontant: 0
  });

  const token = getValidToken();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const isAdmin = user.role === 'Admin';
  const isCommercial = user.role === 'Commercial';

  // Configuration d'axios avec token si disponible
  const api = useMemo(() => {
    if (!token) return null;
    return axios.create({
      baseURL: 'http://localhost:5001/api',
      headers: { Authorization: `Bearer ${token}` }
    });
  }, [token]);


  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  // Helper pour extraire un tableau depuis la réponse API
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

  // Chargement des données
  const fetchData = useCallback(async () => {
    if (!token || !api) {
      addToast('Session expirée, veuillez vous reconnecter', 'error');
      return;
    }

    setLoading(true);
    try {
      const [typesRes, contratsRes, facturesRes] = await Promise.allSettled([
        api.get('/types-facture'),
        api.get('/contrats'),
        api.get('/factures'),
      ]);

      const typesData = typesRes.status === 'fulfilled' ? extractArray(typesRes.value.data) : [];
      const contratsData = contratsRes.status === 'fulfilled' ? extractArray(contratsRes.value.data) : [];
      const facturesData = facturesRes.status === 'fulfilled' ? extractArray(facturesRes.value.data) : [];

      setTypesFacture(typesData);
      setContrats(contratsData);
      setFactures(facturesData);

      setStats({
        total: facturesData.length,
        enAttente: facturesData.filter(f => f.statut === 'En attente').length,
        payees: facturesData.filter(f => f.statut === 'Payée').length,
        annulees: facturesData.filter(f => f.statut === 'Annulée').length,
        totalMontant: facturesData.reduce((sum, f) => sum + (f.montantTTC || 0), 0)
      });

      if (typesRes.status === 'rejected') addToast('Types de facture non chargés', 'info');
      if (contratsRes.status === 'rejected') addToast('Contrats non chargés', 'info');
      if (facturesRes.status === 'rejected') addToast('Erreur chargement des factures', 'error');
    } catch (error) {
      console.error('Erreur fetchData:', error);
      addToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, token, addToast, extractArray]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateNumeroFacture = useCallback(() => {
    const year = new Date().getFullYear();
    const count = factures.length + 1;
    const type = formData.typeFacture ? typesFacture.find(t => t._id === formData.typeFacture) : null;
    const prefix = type?.code || 'FAC';
    return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
  }, [factures.length, formData.typeFacture, typesFacture]);

  const calculateMontantTTC = useCallback((montantHT, devise) => {
    if (devise === 'USD' || devise === 'EUR') {
      return montantHT;
    }
    return montantHT * 1.2;
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!isCommercial) {
      addToast('Vous n\'avez pas les droits pour créer une facture', 'error');
      setShowModal(false);
      return;
    }

    if (!formData.typeFacture) {
      addToast('Veuillez sélectionner un type de facture', 'error');
      return;
    }
    if (!formData.contrat) {
      addToast('Veuillez sélectionner un contrat', 'error');
      return;
    }
    if (!formData.montantHT || parseFloat(formData.montantHT) <= 0) {
      addToast('Veuillez entrer un montant valide', 'error');
      return;
    }
    if (!formData.dateEcheance) {
      addToast('Veuillez entrer une date d\'échéance', 'error');
      return;
    }

    try {
      setLoading(true);

      const selectedContrat = contrats.find(c => c._id === formData.contrat);
      const montantHT = parseFloat(formData.montantHT);
      const montantTTC = calculateMontantTTC(montantHT, selectedContrat?.devise || 'TND');

      const payload = {
        typeFacture: formData.typeFacture,
        contrat: formData.contrat,
        montantHT: montantHT,
        montantTTC: montantTTC,
        devise: selectedContrat?.devise || 'TND',
        dateEcheance: formData.dateEcheance,
        numeroFacture: generateNumeroFacture()
      };

      await api.post('/factures', payload);

      addToast('✅ Facture créée avec succès', 'success');
      setShowModal(false);
      setFormData({ typeFacture: '', contrat: '', montantHT: '', dateEcheance: '' });
      fetchData();
    } catch (error) {
      console.error('Erreur création facture:', error);
      addToast(error.response?.data?.message || 'Erreur lors de la création de la facture', 'error');
    } finally {
      setLoading(false);
    }
  }, [isCommercial, formData, contrats, api, addToast, calculateMontantTTC, generateNumeroFacture, fetchData]);

  const updateStatut = useCallback(async (id, statut) => {
    if (!isAdmin && !isCommercial) {
      addToast('Vous n\'avez pas les droits pour modifier le statut', 'error');
      return;
    }

    try {
      await api.patch(`/factures/${id}/statut`, { statut });
      addToast('Statut mis à jour avec succès', 'success');
      fetchData();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      addToast(error.response?.data?.message || 'Erreur lors de la mise à jour du statut', 'error');
    }
  }, [api, addToast, fetchData, isAdmin, isCommercial]);

  const downloadPDF = useCallback(async (facture, numeroFacture) => {
    try {
      setLoading(true);

      // Essayer d'abord l'API backend si disponible
      if (api) {
        try {
          const pdfResponse = await api.get(`/factures/${facture._id}/pdf`, {
            responseType: 'blob'
          });
          const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `facture_${numeroFacture}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          addToast('📄 Facture téléchargée avec succès', 'success');
          return;
        } catch (apiError) {
          console.warn('API PDF non disponible, génération côté client:', apiError);
        }
      }

      // Génération PDF côté client
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const marginX = 20;
      let yPosition = 20;

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(10, 37, 64);
      doc.text('FACTURE', doc.internal.pageSize.getWidth() / 2, yPosition, { align: 'center' });

      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(numeroFacture, doc.internal.pageSize.getWidth() / 2, yPosition, { align: 'center' });

      yPosition += 15;
      doc.setDrawColor(200, 200, 200);
      doc.line(marginX, yPosition, doc.internal.pageSize.getWidth() - marginX, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(10, 37, 64);
      doc.text('INFORMATIONS FACTURE', marginX, yPosition);

      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const partenaireNom = facture.contrat?.client?.raisonSociale ||
        facture.contrat?.fournisseur?.raisonSociale ||
        facture.contrat?.importateur?.raisonSociale || 'N/A';

      const infoFacture = [
        ['Numéro facture', facture.numeroFacture || 'N/A'],
        ['Type facture', facture.typeFacture?.nom || 'N/A'],
        ['Contrat associé', facture.contrat?.numeroContrat || 'N/A'],
        ['Client / Partenaire', partenaireNom],
        ['Date création', new Date(facture.dateCreation).toLocaleDateString('fr-FR')],
        ['Date échéance', new Date(facture.dateEcheance).toLocaleDateString('fr-FR')],
        ['Statut', facture.statut || 'En attente'],
        ['Devise', facture.devise || 'TND']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Information', 'Valeur']],
        body: infoFacture,
        theme: 'striped',
        headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 120 } },
        margin: { left: marginX, right: marginX }
      });

      yPosition = doc.lastAutoTable.finalY + 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(10, 37, 64);
      doc.text('MONTANTS', marginX, yPosition);

      yPosition += 7;

      const montantsInfo = [
        ['Montant HT', `${(facture.montantHT || 0).toLocaleString()} ${facture.devise || 'TND'}`],
        ['TVA (20%)', facture.devise === 'TND' ? `${((facture.montantHT || 0) * 0.2).toLocaleString()} ${facture.devise}` : '0 (Export)'],
        ['Montant TTC', `${(facture.montantTTC || 0).toLocaleString()} ${facture.devise || 'TND'}`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Désignation', 'Montant']],
        body: montantsInfo,
        theme: 'striped',
        headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { cellWidth: 90, halign: 'right' } },
        margin: { left: marginX, right: marginX }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Check if enough space for signature block (~80mm needed)
      if (yPosition > doc.internal.pageSize.getHeight() - 100) {
        doc.addPage();
        yPosition = 20;
      }

      const pageW = doc.internal.pageSize.getWidth();
      const sigColW = (pageW - 2 * marginX) / 2 - 5;
      const sigLeft = marginX;
      const sigRight = pageW / 2 + 5;

      // ── Ligne "Fait à ... le DATE" ──────────────────────────
      const todayFr = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
      }).toUpperCase();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Fait à Tunis, le', sigLeft, yPosition);
      const afterFaitA = sigLeft + doc.getTextWidth('Fait à Tunis, le ') + 1;
      doc.setFont('helvetica', 'bold');
      doc.text(todayFr, afterFaitA, yPosition);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(afterFaitA - 1, yPosition + 1, afterFaitA + doc.getTextWidth(todayFr) + 1, yPosition + 1);
      doc.setFont('helvetica', 'normal');
      doc.setLineWidth(0.2);

      yPosition += 14;

      // ── Noms des sociétés ────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const partLeft = (partenaireNom || 'CLIENT').toUpperCase().substring(0, 28);
      doc.text(partLeft, sigLeft, yPosition);
      doc.text('SMART-TRADE 360°', sigRight, yPosition);

      yPosition += 7;

      // ── Zone signature gauche : lignes pointillées (client) ──
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const dots = '..........................................';
      doc.text(dots, sigLeft, yPosition);
      yPosition += 5;
      doc.text(dots, sigLeft, yPosition);

      // ── Zone signature droite : image signature SMART-TRADE 360° ──────────
      const sigImgY = yPosition - 12;
      const sigImgX = sigRight;
      const sigImgW = sigColW;
      const sigImgH = 30;
      const signatureBase64 = await loadSignatureImage('/images/signature-etap.jpg');
      if (signatureBase64) {
        doc.addImage(signatureBase64, 'PNG', sigImgX, sigImgY, sigImgW, sigImgH);
      } else {
        doc.text(dots, sigRight, yPosition - 5);
        doc.text(dots, sigRight, yPosition);
      }

      // ── Plus de cachets - on garde uniquement la signature ───
      yPosition += 30;

      // ── Ligne de nom sous le cachet ──────────────────────────
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.line(sigLeft, yPosition, sigLeft + sigColW, yPosition);
      doc.line(sigRight, yPosition, sigRight + sigColW, yPosition);

      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('M. ____________________________', sigLeft, yPosition);
      doc.text('M. Le Directeur Général', sigRight, yPosition);

      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Document généré le ${new Date().toLocaleString('fr-FR')}`, marginX, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Facture ${facture.numeroFacture}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

      const fileName = `Facture_${facture.numeroFacture}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      addToast('📄 Facture téléchargée avec succès', 'success');
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      addToast('❌ Erreur lors du téléchargement de la facture', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, addToast]);

  const getDeviseIcon = useCallback((devise) => {
    if (devise === 'USD') return '💵';
    if (devise === 'EUR') return '💶';
    return '💰';
  }, []);

  const getStatusClass = useCallback((statut) => {
    switch (statut) {
      case 'En attente': return 'status-pending';
      case 'Payée': return 'status-paid';
      case 'Annulée': return 'status-cancelled';
      default: return '';
    }
  }, []);

  // Filtrage sécurisé
  const filteredFactures = useMemo(() => {
    const facturesArray = Array.isArray(factures) ? factures : [];
    return facturesArray.filter(f => {
      const matchesSearch = f.numeroFacture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.contrat?.numeroContrat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.typeFacture?.nom?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatut = !selectedStatut || f.statut === selectedStatut;
      return matchesSearch && matchesStatut;
    });
  }, [factures, searchTerm, selectedStatut]);

  return (
    <div className="factures-page">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              {toast.type === 'success' && <span className="toast-icon">✓</span>}
              {toast.type === 'error' && <span className="toast-icon">✗</span>}
              {toast.type === 'info' && <span className="toast-icon">ℹ</span>}
              <span className="toast-message">{toast.message}</span>
            </div>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>×</button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="factures-header">
        <div className="header-content">
          <h1>📄 Gestion des Factures</h1>
          <p>Factures locales (TND) et export (USD/EUR)</p>
          <div className="role-badges">
            {isAdmin && <span className="role-badge admin">👑 Administrateur</span>}
            {isCommercial && <span className="role-badge commercial">💼 Commercial</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="factures-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-number">{stats.enAttente}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card success">
          <div className="stat-number">{stats.payees}</div>
          <div className="stat-label">Payées</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-number">{stats.annulees}</div>
          <div className="stat-label">Annulées</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-number">
            {stats.totalMontant.toLocaleString()} TND
          </div>
          <div className="stat-label">Montant total</div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Rechercher par n° facture, contrat ou type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="statut-filter">
          <button className={`filter-btn ${!selectedStatut ? 'active' : ''}`} onClick={() => setSelectedStatut('')}>
            Toutes ({stats.total})
          </button>
          <button className={`filter-btn ${selectedStatut === 'En attente' ? 'active' : ''}`} onClick={() => setSelectedStatut('En attente')}>
            ⏳ En attente ({stats.enAttente})
          </button>
          <button className={`filter-btn ${selectedStatut === 'Payée' ? 'active' : ''}`} onClick={() => setSelectedStatut('Payée')}>
            ✅ Payées ({stats.payees})
          </button>
          <button className={`filter-btn ${selectedStatut === 'Annulée' ? 'active' : ''}`} onClick={() => setSelectedStatut('Annulée')}>
            ❌ Annulées ({stats.annulees})
          </button>
        </div>
      </div>

      {/* Bouton nouvelle facture */}
      {isCommercial && (
        <div className="factures-actions">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Nouvelle Facture
          </button>
        </div>
      )}

      {/* Tableau */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : filteredFactures.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h4>Aucune facture trouvée</h4>
          <p>{searchTerm || selectedStatut ? 'Aucune facture ne correspond à vos critères' : 'Commencez par créer une facture'}</p>
          {isCommercial && !searchTerm && !selectedStatut && (
            <button className="btn-add-first" onClick={() => setShowModal(true)}>
              + Créer une facture
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Type</th>
                <th>Contrat</th>
                <th>Client/Partenaire</th>
                <th>Montant TTC</th>
                <th>Devise</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFactures.map(f => {
                const partenaireNom = f.contrat?.client?.raisonSociale ||
                  f.contrat?.fournisseur?.raisonSociale ||
                  f.contrat?.importateur?.raisonSociale || 'N/A';
                return (
                  <tr key={f._id}>
                    <td data-label="N° Facture"><strong>{f.numeroFacture}</strong></td>
                    <td data-label="Type">{f.typeFacture?.nom || '-'}</td>
                    <td data-label="Contrat">{f.contrat?.numeroContrat || '-'}</td>
                    <td data-label="Client/Partenaire">{partenaireNom}</td>
                    <td data-label="Montant TTC"><strong>{(f.montantTTC || 0).toLocaleString()}</strong></td>
                    <td data-label="Devise">{getDeviseIcon(f.devise)} {f.devise}</td>
                    <td data-label="Échéance">{new Date(f.dateEcheance).toLocaleDateString('fr-FR')}</td>
                    <td data-label="Statut">
                      {(isAdmin || isCommercial) ? (
                        <select
                          className={`status-select ${getStatusClass(f.statut)}`}
                          value={f.statut}
                          onChange={(e) => updateStatut(f._id, e.target.value)}
                        >
                          <option value="En attente">⏳ En attente</option>
                          <option value="Payée">✅ Payée</option>
                          <option value="Annulée">❌ Annulée</option>
                        </select>
                      ) : (
                        <span className={`status-badge ${getStatusClass(f.statut)}`}>
                          {f.statut}
                        </span>
                      )}
                    </td>
                    <td data-label="Actions">
                      <button
                        className="btn-pdf-small"
                        onClick={() => downloadPDF(f, f.numeroFacture)}
                        disabled={loading}
                      >
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal création */}
      {showModal && isCommercial && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Nouvelle Facture</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Type de facture *</label>
                  <select
                    value={formData.typeFacture}
                    onChange={e => setFormData({ ...formData, typeFacture: e.target.value })}
                    required
                  >
                    <option value="">-- Sélectionner un type --</option>
                    {typesFacture.map(t => (
                      <option key={t._id} value={t._id}>{t.nom} ({t.code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Contrat *</label>
                  <select
                    value={formData.contrat}
                    onChange={e => setFormData({ ...formData, contrat: e.target.value })}
                    required
                  >
                    <option value="">-- Sélectionner un contrat --</option>
                    {contrats.map(c => {
                      const partenaire = c.client?.raisonSociale || c.fournisseur?.raisonSociale || c.importateur?.raisonSociale;
                      return (
                        <option key={c._id} value={c._id}>
                          {c.numeroContrat} - {partenaire} ({c.devise})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label>Montant HT *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Montant hors taxes"
                    value={formData.montantHT}
                    onChange={e => setFormData({ ...formData, montantHT: e.target.value })}
                    required
                  />
                  <small className="form-hint">
                    {formData.contrat && contrats.find(c => c._id === formData.contrat)?.devise === 'TND'
                      ? 'TVA 20% appliquée automatiquement'
                      : 'Export: TVA 0%'}
                  </small>
                </div>

                <div className="form-group">
                  <label>Date d'échéance *</label>
                  <input
                    type="date"
                    value={formData.dateEcheance}
                    onChange={e => setFormData({ ...formData, dateEcheance: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={loading}
                >
                  {loading ? 'Création...' : 'Créer la facture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message si l'admin essaie de créer */}
      {showModal && !isCommercial && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⛔ Accès refusé</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <p>Vous n'avez pas les droits pour créer une facture.</p>
                <p>Seuls les utilisateurs avec le rôle <strong>"Commercial"</strong> peuvent créer des factures.</p>
              </div>
            </div>
            <div className="modal-buttons">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Factures;