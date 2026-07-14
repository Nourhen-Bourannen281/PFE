// pages/admin/contrats/ContratsVente.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import '../../../css/ContratsVente.css';

const ContratsVente = () => {
  const [contrats, setContrats] = useState([]);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingContrat, setEditingContrat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduit, setSelectedProduit] = useState(null);
  
  const [formData, setFormData] = useState({
    produit: '',
    client: '',
    quantite: '',
    prixUnitaire: '',
    dateDebut: '',
    dateFin: '',
    conditionsPaiement: '',
    statut: 'Brouillon'
  });

  const getApiConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expirée');
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchContrats = useCallback(async () => {
    try {
      const config = getApiConfig();
      if (!config) return;
      const response = await axios.get('http://localhost:5001/api/contrats-vente', config);
      setContrats(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement contrats:', error);
      toast.error('Erreur chargement contrats');
    }
  }, [getApiConfig]);

  const fetchProduits = useCallback(async () => {
    try {
      const config = getApiConfig();
      if (!config) return;
      const response = await axios.get('http://localhost:5001/api/products', config);
      const produitsData = response.data.data || [];
      setProduits(produitsData);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  }, [getApiConfig]);

  const fetchClients = useCallback(async () => {
    try {
      const config = getApiConfig();
      if (!config) return;
      const response = await axios.get('http://localhost:5001/api/users', config);
      const clientsData = response.data.data || [];
      const filteredClients = clientsData.filter(user => user.role === 'Client');
      setClients(filteredClients);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  }, [getApiConfig]);

  useEffect(() => {
    Promise.all([fetchContrats(), fetchProduits(), fetchClients()]).finally(() => setLoading(false));
  }, [fetchContrats, fetchProduits, fetchClients]);

  const handleProduitChange = (produitId) => {
    const produit = produits.find(p => p._id === produitId);
    setSelectedProduit(produit);
    setFormData({
      ...formData,
      produit: produitId,
      prixUnitaire: produit?.prixUnitaire || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.produit || !formData.client || !formData.quantite || !formData.dateDebut || !formData.dateFin) {
      toast.error('Tous les champs obligatoires doivent être remplis');
      return;
    }

    if (new Date(formData.dateFin) <= new Date(formData.dateDebut)) {
      toast.error('La date de fin doit être postérieure à la date de début');
      return;
    }

    setLoading(true);
    try {
      const config = getApiConfig();
      if (!config) return;

      const contratData = {
        produit: formData.produit,
        client: formData.client,
        quantite: parseFloat(formData.quantite),
        prixUnitaire: parseFloat(formData.prixUnitaire),
        dateDebut: formData.dateDebut,
        dateFin: formData.dateFin,
        conditionsPaiement: formData.conditionsPaiement,
        statut: formData.statut
      };

      if (editingContrat) {
        await axios.put(`http://localhost:5001/api/contrats-vente/${editingContrat._id}`, contratData, config);
        toast.success('Contrat modifié');
      } else {
        await axios.post('http://localhost:5001/api/contrats-vente', contratData, config);
        toast.success('Contrat créé');
      }

      setShowModal(false);
      resetForm();
      fetchContrats();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      produit: '', client: '', quantite: '', prixUnitaire: '',
      dateDebut: '', dateFin: '', conditionsPaiement: '', statut: 'Brouillon'
    });
    setSelectedProduit(null);
    setEditingContrat(null);
  };

  const getStatutBadge = (statut) => {
    const classes = {
      'Brouillon': 'badge-warning',
      'En Cours': 'badge-info',
      'Terminé': 'badge-success',
      'Annulé': 'badge-danger'
    };
    return <span className={`statut-badge ${classes[statut] || 'badge-secondary'}`}>{statut}</span>;
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR');

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce contrat ?')) {
      try {
        await axios.delete(`http://localhost:5001/api/contrats-vente/${id}`, getApiConfig());
        toast.success('Contrat supprimé');
        fetchContrats();
      } catch (error) {
        console.error('Erreur suppression:', error);
        toast.error('Erreur suppression');
      }
    }
  };

  if (loading && contrats.length === 0) {
    return <div className="loading-container"><div className="spinner"></div><p>Chargement...</p></div>;
  }

  return (
    <div className="contrats-vente-container">
      <div className="page-header">
        <h1>📄 Contrats de Vente</h1>
        <p className="subtitle">Gestion des contrats liés aux produits pétroliers</p>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Nouveau Contrat
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{contrats.length}</h3>
            <p>Total Contrats</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <h3>{contrats.filter(c => c.statut === 'En Cours').length}</h3>
            <p>En Cours</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{contrats.filter(c => c.statut === 'Terminé').length}</h3>
            <p>Terminés</p>
          </div>
        </div>
      </div>

      <div className="contrats-list">
        {contrats.map(contrat => (
          <div key={contrat._id} className="contrat-card">
            <div className="contrat-header">
              <div className="contrat-number">{contrat.numeroContrat}</div>
              {getStatutBadge(contrat.statut)}
            </div>
            <div className="contrat-body">
              <div className="contrat-info">
                <div className="info-row">
                  <span className="label">Produit:</span>
                  <span className="value">{contrat.produit?.nom || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Client:</span>
                  <span className="value">{contrat.client?.nom || contrat.client?.raisonSociale || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Quantité:</span>
                  <span className="value">{contrat.quantite} {contrat.produit?.unite || 'unités'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Prix unitaire:</span>
                  <span className="value">{contrat.prixUnitaire} DT</span>
                </div>
                <div className="info-row">
                  <span className="label">Montant total:</span>
                  <span className="value highlight">{contrat.montantTotal?.toLocaleString()} DT</span>
                </div>
                <div className="info-row">
                  <span className="label">Période:</span>
                  <span className="value">{formatDate(contrat.dateDebut)} → {formatDate(contrat.dateFin)}</span>
                </div>
              </div>
              <div className="contrat-actions">
                <button className="btn-edit" onClick={() => {
                  const produitId = contrat.produit?._id || contrat.produit || '';
                  setEditingContrat(contrat);
                  setSelectedProduit(produits.find(p => p._id === produitId) || null);
                  setFormData({
                    produit: produitId,
                    client: contrat.client?._id || contrat.client || '',
                    quantite: contrat.quantite || '',
                    prixUnitaire: contrat.prixUnitaire || '',
                    dateDebut: contrat.dateDebut?.split('T')[0] || '',
                    dateFin: contrat.dateFin?.split('T')[0] || '',
                    conditionsPaiement: contrat.conditionsPaiement || '',
                    statut: contrat.statut || 'Brouillon'
                  });
                  setShowModal(true);
                }}>✏️</button>
                <button className="btn-delete" onClick={() => handleDelete(contrat._id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingContrat ? '✏️ Modifier Contrat' : '➕ Nouveau Contrat'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Produit *</label>
                <select value={formData.produit} onChange={e => handleProduitChange(e.target.value)} required>
                  <option value="">Sélectionner un produit</option>
                  {produits.map(p => (
                    <option key={p._id} value={p._id}>{p.nom} ({p.type}) - {p.prixUnitaire} DT/{p.unite}</option>
                  ))}
                </select>
                {selectedProduit && (
                  <div className="product-info-hint">
                    Stock disponible: {selectedProduit.stockInitial} {selectedProduit.unite}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Client *</label>
                <select value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} required>
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>{c.nom || c.raisonSociale} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantité *</label>
                  <input type="number" step="0.01" value={formData.quantite} onChange={e => setFormData({...formData, quantite: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Prix Unitaire (DT) *</label>
                  <input type="number" step="0.01" value={formData.prixUnitaire} onChange={e => setFormData({...formData, prixUnitaire: e.target.value})} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date Début *</label>
                  <input type="date" value={formData.dateDebut?.split('T')[0] || ''} onChange={e => setFormData({...formData, dateDebut: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Date Fin *</label>
                  <input type="date" value={formData.dateFin?.split('T')[0] || ''} onChange={e => setFormData({...formData, dateFin: e.target.value})} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Statut</label>
                  <select value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}>
                    <option value="Brouillon">Brouillon</option>
                    <option value="En Cours">En Cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Conditions de paiement</label>
                  <input type="text" value={formData.conditionsPaiement} onChange={e => setFormData({...formData, conditionsPaiement: e.target.value})} placeholder="Ex: Paiement à 30 jours" />
                </div>
              </div>

              <div className="montant-total">
                <strong>Montant Total: </strong>
                {((parseFloat(formData.quantite) || 0) * (parseFloat(formData.prixUnitaire) || 0)).toLocaleString()} DT
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? '⏳...' : (editingContrat ? 'Modifier' : 'Créer')}</button>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContratsVente;