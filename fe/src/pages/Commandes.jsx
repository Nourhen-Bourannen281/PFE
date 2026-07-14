import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import '../css/Commandes.css';

function Commandes() {
  const [commandes, setCommandes] = useState([]);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingId, setValidatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: 'http://localhost:5001/api',
      headers: { 'Content-Type': 'application/json' },
    });

    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return instance;
  }, []);

  const fetchCommandes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/commandes');
      const data = response.data?.data || response.data || [];
      setCommandes(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  const handleValidation = async (commandeId, action) => {
    const statut = action === 'valider' ? 'Validée' : 'Refusée';
    
    try {
      setValidatingId(commandeId);
      const response = await api.patch(`/commandes/${commandeId}/valider`, { statut });
      
      if (response.data.success) {
        toast.success(response.data.message);
        
        if (response.data.facture) {
          toast.success(`Facture ${response.data.facture.numeroFacture} générée - Montant: ${response.data.facture.montantTTC.toLocaleString()} TND`);
        }
        
        fetchCommandes();
        setShowValidationModal(false);
        setSelectedCommande(null);
      }
    } catch (error) {
      console.error('Erreur validation:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la validation';
      toast.error(errorMsg);
    } finally {
      setValidatingId(null);
    }
  };

  const updateStatut = async (commandeId, newStatut) => {
    try {
      const response = await api.patch(`/commandes/${commandeId}/statut`, { statut: newStatut });
      
      if (response.data.success) {
        toast.success(`Statut mis à jour: ${newStatut}`);
        fetchCommandes();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur mise à jour');
    }
  };

  const exportPDF = async (commande) => {
    try {
      const response = await api.get(`/commandes/${commande._id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Commande_${commande.numeroCommande}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF généré');
    } catch (err) {
      toast.error('Erreur génération PDF');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatutClass = (statut) => {
    const classes = {
      'En attente': 'statut-attente',
      'Validée': 'statut-validee',
      'Refusée': 'statut-refusee',
      'Livrée': 'statut-livree',
      'Annulée': 'statut-annulee'
    };
    return classes[statut] || '';
  };

  const getStatutIcon = (statut) => {
    const icons = {
      'En attente': '⏳',
      'Validée': '✅',
      'Refusée': '❌',
      'Livrée': '📦',
      'Annulée': '🚫'
    };
    return icons[statut] || '📄';
  };

  const filteredCommandes = useMemo(() => {
    if (!commandes.length) return commandes;
    let result = [...commandes];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(cmd => 
        cmd.numeroCommande?.toLowerCase().includes(searchLower) ||
        cmd.userNom?.toLowerCase().includes(searchLower) ||
        cmd.userEmail?.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedStatut) {
      result = result.filter(cmd => cmd.statut === selectedStatut);
    }

    if (dateRange.start) {
      result = result.filter(cmd => new Date(cmd.dateCreation) >= new Date(dateRange.start));
    }

    if (dateRange.end) {
      result = result.filter(cmd => new Date(cmd.dateCreation) <= new Date(dateRange.end));
    }
    
    return result;
  }, [commandes, searchTerm, selectedStatut, dateRange]);

  const stats = useMemo(() => ({
    total: commandes.length,
    enAttente: commandes.filter(c => c.statut === 'En attente').length,
    validee: commandes.filter(c => c.statut === 'Validée').length,
    livree: commandes.filter(c => c.statut === 'Livrée').length,
    refusee: commandes.filter(c => c.statut === 'Refusée').length,
    montantTotal: commandes.reduce((sum, c) => sum + (c.montantTTC || 0), 0)
  }), [commandes]);

  return (
    <div className="commandes-page">
      <div className="commandes-header">
        <div className="header-left">
          <h2>📦 Gestion des Commandes Clients</h2>
          <p className="subtitle">Validez les commandes et gérez les factures</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="commandes-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total commandes</div>
        </div>
        <div className="stat-card stat-attente">
          <div className="stat-number">{stats.enAttente}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card stat-validee">
          <div className="stat-number">{stats.validee}</div>
          <div className="stat-label">Validées</div>
        </div>
        <div className="stat-card stat-livree">
          <div className="stat-number">{stats.livree}</div>
          <div className="stat-label">Livrées</div>
        </div>
        <div className="stat-card stat-refusee">
          <div className="stat-number">{stats.refusee}</div>
          <div className="stat-label">Refusées</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.montantTotal.toLocaleString()} TND</div>
          <div className="stat-label">Montant total</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-group">
          <input 
            type="text" 
            placeholder="🔍 Rechercher par n° commande ou client..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="search-input" 
          />
        </div>
        <div className="filter-group">
          <select value={selectedStatut} onChange={(e) => setSelectedStatut(e.target.value)} className="statut-filter">
            <option value="">Tous les statuts</option>
            <option value="En attente">⏳ En attente</option>
            <option value="Validée">✅ Validée</option>
            <option value="Refusée">❌ Refusée</option>
            <option value="Livrée">📦 Livrée</option>
            <option value="Annulée">🚫 Annulée</option>
          </select>
        </div>
        <div className="filter-group">
          <input 
            type="date" 
            placeholder="Date début" 
            value={dateRange.start} 
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
            className="date-input" 
          />
        </div>
        <div className="filter-group">
          <input 
            type="date" 
            placeholder="Date fin" 
            value={dateRange.end} 
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})} 
            className="date-input" 
          />
        </div>
        {(searchTerm || selectedStatut || dateRange.start || dateRange.end) && (
          <button className="btn-clear-filters" onClick={() => {
            setSearchTerm('');
            setSelectedStatut('');
            setDateRange({ start: '', end: '' });
          }}>
            Effacer filtres
          </button>
        )}
      </div>

      {/* Tableau des commandes */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner"></div>
          <p>Chargement des commandes...</p>
        </div>
      ) : filteredCommandes.length === 0 ? (
        <div className="empty-state">
          <h3>📭 Aucune commande trouvée</h3>
          <p>{searchTerm || selectedStatut ? 'Aucune commande ne correspond aux critères' : 'Aucune commande enregistrée'}</p>
        </div>
      ) : (
        <div className="commandes-table-container">
          <table className="commandes-table">
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Montant</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommandes.map((commande) => (
                <tr key={commande._id}>
                  <td className="commande-numero">
                    <strong>{commande.numeroCommande}</strong>
                   </td>
                  <td>
                    <div className="client-info">
                      <span className="client-nom">{commande.userNom || 'Client'}</span>
                      <span className="client-email">{commande.userEmail}</span>
                    </div>
                  </td>
                  <td>{formatDate(commande.dateCreation)}</td>
                  <td>
                    <span className={`statut-badge ${getStatutClass(commande.statut)}`}>
                      {getStatutIcon(commande.statut)} {commande.statut}
                    </span>
                  </td>
                  <td className="commande-montant">
                    <strong>{(commande.montantTTC || 0).toLocaleString()} TND</strong>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-detail" 
                        onClick={() => {
                          setSelectedCommande(commande);
                          setShowDetailModal(true);
                        }}
                        title="Détails"
                      >
                        👁️
                      </button>
                      <button 
                        className="btn-pdf" 
                        onClick={() => exportPDF(commande)}
                        title="PDF"
                      >
                        📄
                      </button>
                      
                      {commande.statut === 'En attente' && (
                        <button 
                          className="btn-validate" 
                          onClick={() => {
                            setSelectedCommande(commande);
                            setShowValidationModal(true);
                          }}
                          title="Valider/Refuser"
                        >
                          ✅
                        </button>
                      )}
                      
                      {commande.statut === 'Validée' && (
                        <button 
                          className="btn-livrer" 
                          onClick={() => updateStatut(commande._id, 'Livrée')}
                          title="Marquer comme livrée"
                        >
                          📦 Livrer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Détails */}
      {showDetailModal && selectedCommande && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Détails de la commande {selectedCommande.numeroCommande}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Informations client</h4>
                <div className="detail-grid">
                  <div><strong>Nom:</strong> {selectedCommande.userNom}</div>
                  <div><strong>Email:</strong> {selectedCommande.userEmail}</div>
                  <div><strong>Téléphone:</strong> {selectedCommande.userTelephone || 'Non renseigné'}</div>
                  <div><strong>Adresse:</strong> {selectedCommande.userAdresse || 'Non renseignée'}</div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Informations commande</h4>
                <div className="detail-grid">
                  <div><strong>Date création:</strong> {formatDate(selectedCommande.dateCreation)}</div>
                  <div><strong>Statut:</strong> <span className={`statut-badge ${getStatutClass(selectedCommande.statut)}`}>{selectedCommande.statut}</span></div>
                  <div><strong>Conditions paiement:</strong> {selectedCommande.conditionsPaiement}</div>
                  {selectedCommande.dateValidation && <div><strong>Date validation:</strong> {formatDate(selectedCommande.dateValidation)}</div>}
                  {selectedCommande.dateLivraisonPrevue && <div><strong>Livraison prévue:</strong> {formatDate(selectedCommande.dateLivraisonPrevue)}</div>}
                </div>
              </div>

              <div className="detail-section">
                <h4>Produits commandés</h4>
                <table className="produits-detail-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Prix unitaire</th>
                      <th>TVA</th>
                      <th>Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCommande.produits?.map((produit, idx) => {
                      const totalTTC = produit.quantite * produit.prixUnitaire * (1 + (produit.tva || 19) / 100);
                      return (
                        <tr key={idx}>
                          <td>{produit.nom}</td>
                          <td>{produit.quantite}</td>
                          <td>{produit.prixUnitaire?.toLocaleString()} TND</td>
                          <td>{produit.tva || 19}%</td>
                          <td>{totalTTC.toLocaleString()} TND</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" className="text-right"><strong>Total TTC:</strong></td>
                      <td><strong>{(selectedCommande.montantTTC || 0).toLocaleString()} TND</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedCommande.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p className="notes-content">{selectedCommande.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-buttons">
              <button onClick={() => exportPDF(selectedCommande)}>📄 Exporter PDF</button>
              <button onClick={() => setShowDetailModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Validation */}
      {showValidationModal && selectedCommande && (
        <div className="modal-overlay" onClick={() => setShowValidationModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✅ Valider / Refuser la commande</h3>
              <button className="modal-close" onClick={() => setShowValidationModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="validation-info">
                <p><strong>Commande:</strong> {selectedCommande.numeroCommande}</p>
                <p><strong>Client:</strong> {selectedCommande.userNom}</p>
                <p><strong>Email:</strong> {selectedCommande.userEmail}</p>
                <p><strong>Montant total:</strong> {(selectedCommande.montantTTC || 0).toLocaleString()} TND</p>
                <p><strong>Produits:</strong> {selectedCommande.produits?.length} article(s)</p>
              </div>
              
              <div className="validation-options">
                <button 
                  className="btn-validate-yes" 
                  onClick={() => handleValidation(selectedCommande._id, 'valider')}
                  disabled={validatingId === selectedCommande._id}
                >
                  {validatingId === selectedCommande._id ? '⏳...' : '✅ Valider la commande'}
                </button>
                <button 
                  className="btn-validate-no" 
                  onClick={() => handleValidation(selectedCommande._id, 'refuser')}
                  disabled={validatingId === selectedCommande._id}
                >
                  {validatingId === selectedCommande._id ? '⏳...' : '❌ Refuser la commande'}
                </button>
              </div>
              
              <div className="validation-note">
                <small>ℹ️ La validation générera automatiquement une facture et déduira les stocks.</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Commandes;