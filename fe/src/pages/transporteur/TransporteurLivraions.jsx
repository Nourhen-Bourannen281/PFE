import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck, faCheckCircle, faPlay, faSync, faBuilding, faUser, faBox, faCalendar, faMapMarkerAlt, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import '../../css/TransporteurLivraisons.css';

function TransporteurLivraisons() {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('prete');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user._id || user.id;

  const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  // Génération d'ID unique pour toasts (évite duplications)
  const toastIdCounter = React.useRef(0);

  const addToast = (message, type = 'success') => {
    toastIdCounter.current += 1;
    const id = `toast-${Date.now()}-${toastIdCounter.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Charger TOUTES les livraisons depuis MongoDB (sans filtre)
  const fetchMesLivraisons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/livraisons');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.livraisons || []);

      console.log('📦 Total livraisons MongoDB:', list.length);
      console.log('🚚 Détails:', list.map(l => ({
        num: l.numeroLivraison,
        etat: l.etat,
        transporteur: l.transporteur?._id || l.transporteur || 'Non assigné'
      })));

      // Afficher TOUTES les livraisons (pas de filtre restrictif)
      setLivraisons(list);

      if (list.length === 0) {
        addToast('📭 Aucune livraison dans la base de données', 'info');
      } else {
        addToast(`✅ ${list.length} livraison(s) chargée(s)`, 'success');
      }

    } catch (error) {
      console.error('❌ Erreur chargement livraisons:', error);
      addToast(error.response?.data?.message || 'Erreur de chargement', 'error');
      setLivraisons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMesLivraisons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Démarrer transport (Prête -> En cours) via MongoDB
  const demarrerTransport = async (livraisonId) => {
    try {
      setLoading(true);
      await api.patch(`/livraisons/${livraisonId}/etat`, { etat: 'En cours' });
      addToast('🚚 Transport démarré avec succès', 'success');
      await fetchMesLivraisons();
    } catch (error) {
      console.error('Erreur démarrage:', error);
      addToast(error.response?.data?.message || 'Erreur lors du démarrage', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Terminer transport (En cours -> Livrée) via MongoDB
  const terminerTransport = async (livraisonId) => {
    try {
      setLoading(true);
      await api.patch(`/livraisons/${livraisonId}/etat`, {
        etat: 'Livrée',
        dateLivraison: new Date().toISOString()
      });
      addToast('📦 Transport terminé avec succès', 'success');
      await fetchMesLivraisons();
    } catch (error) {
      console.error('Erreur terminaison:', error);
      addToast(error.response?.data?.message || 'Erreur lors de la terminaison', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Annuler livraison
  const annulerTransport = async (livraisonId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette livraison?')) return;
    try {
      setLoading(true);
      await api.patch(`/livraisons/${livraisonId}/etat`, { etat: 'Annulée' });
      addToast('❌ Livraison annulée', 'success');
      await fetchMesLivraisons();
    } catch (error) {
      console.error('Erreur annulation:', error);
      addToast(error.response?.data?.message || 'Erreur lors de l\'annulation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPartenaireInfo = (livraison) => {
    const commande = livraison.commande || {};

    // Essai 1: client (commande.client)
    if (commande.client && typeof commande.client === 'object') {
      const c = commande.client;
      return {
        nom: c.raisonSociale || [c.prenom, c.nom].filter(Boolean).join(' ') || c.email || 'Client',
        type: 'client',
        icon: faUser,
        adresse: c.adresse || 'Non spécifiée',
        telephone: c.telephone || 'Non spécifié',
        email: c.email || 'Non spécifié'
      };
    }

    // Essai 2: fournisseur (commande.fournisseur)
    if (commande.fournisseur && typeof commande.fournisseur === 'object') {
      const f = commande.fournisseur;
      return {
        nom: f.raisonSociale || [f.prenom, f.nom].filter(Boolean).join(' ') || f.email || 'Fournisseur',
        type: 'fournisseur',
        icon: faBuilding,
        adresse: f.adresse || 'Non spécifiée',
        telephone: f.telephone || 'Non spécifié',
        email: f.email || 'Non spécifié'
      };
    }

    // Essai 3: partenaire (commande.partenaire)
    if (commande.partenaire && typeof commande.partenaire === 'object') {
      const p = commande.partenaire;
      return {
        nom: p.raisonSociale || [p.prenom, p.nom].filter(Boolean).join(' ') || p.email || 'Partenaire',
        type: p.type === 0 ? 'fournisseur' : 'client',
        icon: p.type === 0 ? faBuilding : faUser,
        adresse: p.adresse || 'Non spécifiée',
        telephone: p.telephone || 'Non spécifié',
        email: p.email || 'Non spécifié'
      };
    }

    return {
      nom: 'Partenaire SMART-TRADE 360°',
      type: 'inconnu',
      icon: faUser,
      adresse: 'Non spécifiée',
      telephone: 'Non spécifié',
      email: 'Non spécifié'
    };
  };

  const getTransporteurNom = (transporteur) => {
    if (!transporteur) return 'Non assigné';
    return transporteur.raisonSociale || transporteur.nom || transporteur.name || transporteur.email || 'Transporteur';
  };

  const getEtatIcon = (etat) => {
    switch(etat) {
      case 'Prête': return '✅';
      case 'En cours': return '🚚';
      case 'Livrée': return '📦';
      default: return '📄';
    }
  };

  // Filtrer les livraisons par recherche
  const filterBySearch = (livraisonsList) => {
    if (!searchTerm) return livraisonsList;
    return livraisonsList.filter(l => 
      l.numeroLivraison?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.commande?.numeroCommande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPartenaireInfo(l).nom.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Séparer les livraisons par état (inclut tous les états compatibles)
  const livraisonsPrete = livraisons.filter(l =>
    ['Prête', 'À préparer', 'En attente'].includes(l.etat) ||
    ['Prête', 'À préparer', 'En attente'].includes(l.statut)
  );
  const livraisonsEnCours = livraisons.filter(l =>
    l.etat === 'En cours' || l.statut === 'En cours'
  );
  const livraisonsLivree = livraisons.filter(l =>
    l.etat === 'Livrée' || l.statut === 'Livrée'
  );

  const filteredPrete = filterBySearch(livraisonsPrete);
  const filteredEnCours = filterBySearch(livraisonsEnCours);
  const filteredLivree = filterBySearch(livraisonsLivree);

  const stats = {
    prete: livraisonsPrete.length,
    enCours: livraisonsEnCours.length,
    livree: livraisonsLivree.length,
    total: livraisons.length
  };

  // Composant pour afficher une livraison
  const LivraisonCard = ({ livraison, type }) => {
    const partenaire = getPartenaireInfo(livraison);
    const produits = livraison.produits || livraison.commande?.produits || [];
    const dateCreation = livraison.dateCreation || livraison.createdAt;
    const adresse = livraison.adresseLivraison || partenaire.adresse;

    return (
      <div className={`livraison-card ${type}-card`}>
        <div className="card-header">
          <div>
            <span className="livraison-num">{livraison.numeroLivraison || 'LIV-' + String(livraison._id).slice(-6)}</span>
            <span className="commande-ref">
              Commande: {livraison.commande?.numeroCommande || (typeof livraison.commande === 'string' ? livraison.commande.slice(-6) : 'N/A')}
            </span>
          </div>
          <span className={`etat-badge ${type}`}>
            {getEtatIcon(livraison.etat)} {livraison.etat || 'En attente'}
          </span>
        </div>

        <div className="card-body">
          {/* Partenaire */}
          <div className="info-group">
            <div className="info-group-header">
              <FontAwesomeIcon icon={partenaire.icon} /> {partenaire.type === 'client' ? 'Client' : partenaire.type === 'fournisseur' ? 'Fournisseur' : 'Partenaire'}
            </div>
            <div className="info-row">
              <span className="label">Nom:</span>
              <span className="value">{partenaire.nom}</span>
            </div>
            <div className="info-row">
              <span className="label">Adresse:</span>
              <span className="value"><FontAwesomeIcon icon={faMapMarkerAlt} /> {adresse}</span>
            </div>
            {partenaire.telephone !== 'Non spécifié' && (
              <div className="info-row">
                <span className="label">Téléphone:</span>
                <span className="value"><FontAwesomeIcon icon={faPhone} /> {partenaire.telephone}</span>
              </div>
            )}
            {partenaire.email !== 'Non spécifié' && (
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value"><FontAwesomeIcon icon={faEnvelope} /> {partenaire.email}</span>
              </div>
            )}
          </div>

          {/* Produits */}
          {produits.length > 0 && (
            <div className="info-group">
              <div className="info-group-header">
                <FontAwesomeIcon icon={faBox} /> Produits à livrer ({produits.length})
              </div>
              {produits.map((p, idx) => {
                const prod = typeof p.produit === 'object' ? p.produit : {};
                const nom = prod.nom || p.nom || `Produit ${idx + 1}`;
                const qty = p.quantite || 0;
                const unite = prod.uniteMesure || prod.unite || p.unite || p.uniteMesure || '';
                return (
                  <div key={`${livraison._id}-prod-${idx}`} className="produit-row">
                    <span className="produit-nom">{nom}</span>
                    <span className="produit-quantite">{Number(qty).toLocaleString()} {unite}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Montant si disponible */}
          {livraison.commande?.montantTotal && (
            <div className="info-row">
              <span className="label">Montant total:</span>
              <span className="value" style={{ fontWeight: 700, color: '#0c2c5c' }}>
                {Number(livraison.commande.montantTotal).toLocaleString('fr-FR')} {livraison.commande.devise || 'TND'}
              </span>
            </div>
          )}

          {/* Date */}
          {dateCreation && !isNaN(new Date(dateCreation).getTime()) && (
            <div className="info-row">
              <span className="label">Date création:</span>
              <span className="value">
                <FontAwesomeIcon icon={faCalendar} /> {new Date(dateCreation).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
          {livraison.dateArriveePrevue && (
            <div className="info-row">
              <span className="label">Arrivée prévue:</span>
              <span className="value"><FontAwesomeIcon icon={faCalendar} /> {new Date(livraison.dateArriveePrevue).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
          {livraison.dateLivraison && (
            <div className="info-row">
              <span className="label">Date livraison:</span>
              <span className="value success">
                <FontAwesomeIcon icon={faCheckCircle} /> {new Date(livraison.dateLivraison).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
          {livraison.commentaire && (
            <div className="info-row">
              <span className="label">Commentaire:</span>
              <span className="value">{livraison.commentaire}</span>
            </div>
          )}

          {/* Transporteur */}
          <div className="info-row">
            <span className="label">Transporteur:</span>
            <span className="value"><FontAwesomeIcon icon={faTruck} /> {getTransporteurNom(livraison.transporteur)}</span>
          </div>
        </div>

        <div className="card-actions">
          {livraison.etat === 'Prête' && (
            <button className="btn-start" onClick={() => demarrerTransport(livraison._id)} disabled={loading}>
              <FontAwesomeIcon icon={faPlay} /> Démarrer la livraison
            </button>
          )}
          {livraison.etat === 'En cours' && (
            <button className="btn-end" onClick={() => terminerTransport(livraison._id)} disabled={loading}>
              <FontAwesomeIcon icon={faCheckCircle} /> Terminer la livraison
            </button>
          )}
          {livraison.etat === 'Livrée' && (
            <span className="completed-badge">
              <FontAwesomeIcon icon={faCheckCircle} /> Livraison terminée
            </span>
          )}
        </div>
      </div>
    );
  };

  // Rendu du contenu par onglet
  const renderContent = () => {
    if (activeTab === 'prete') {
      if (filteredPrete.length === 0) {
        return (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h4>Aucune livraison à démarrer</h4>
            <p>Toutes vos livraisons sont en cours ou terminées</p>
          </div>
        );
      }
      return (
        <div className="livraisons-grid">
          {filteredPrete.map(livraison => (
            <LivraisonCard key={livraison._id} livraison={livraison} type="prete" />
          ))}
        </div>
      );
    }

    if (activeTab === 'encours') {
      if (filteredEnCours.length === 0) {
        return (
          <div className="empty-state">
            <div className="empty-icon">🚚</div>
            <h4>Aucune livraison en cours</h4>
            <p>Vous n'avez aucune livraison en cours pour le moment</p>
          </div>
        );
      }
      return (
        <div className="livraisons-grid">
          {filteredEnCours.map(livraison => (
            <LivraisonCard key={livraison._id} livraison={livraison} type="encours" />
          ))}
        </div>
      );
    }

    if (activeTab === 'livree') {
      if (filteredLivree.length === 0) {
        return (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h4>Aucune livraison terminée</h4>
            <p>Les livraisons terminées apparaîtront ici</p>
          </div>
        );
      }
      return (
        <div className="livraisons-grid">
          {filteredLivree.map(livraison => (
            <LivraisonCard key={livraison._id} livraison={livraison} type="livree" />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="transporteur-container">

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              {toast.type === 'success' && <span className="toast-icon">✓</span>}
              {toast.type === 'error' && <span className="toast-icon">✗</span>}
              {toast.type === 'info' && <span className="toast-icon">ℹ</span>}
              <span className="toast-message">{toast.message}</span>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="transporteur-header">
        <div className="header-left">
          <h2>
            <FontAwesomeIcon icon={faTruck} /> Mes Livraisons
          </h2>
          <p>Gérez vos livraisons pour les clients STEG et fournisseurs STIR</p>
        </div>
        <div className="stats-cards">
          <div className="stat-card prete">
            <div className="stat-number">{stats.prete}</div>
            <div className="stat-label">À démarrer</div>
          </div>
          <div className="stat-card encours">
            <div className="stat-number">{stats.enCours}</div>
            <div className="stat-label">En cours</div>
          </div>
          <div className="stat-card livree">
            <div className="stat-number">{stats.livree}</div>
            <div className="stat-label">Terminées</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Rechercher par numéro de livraison, commande, client ou fournisseur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'prete' ? 'active' : ''}`}
          onClick={() => setActiveTab('prete')}
        >
          <FontAwesomeIcon icon={faPlay} /> À démarrer ({filteredPrete.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'encours' ? 'active' : ''}`}
          onClick={() => setActiveTab('encours')}
        >
          <FontAwesomeIcon icon={faSync} /> En cours ({filteredEnCours.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'livree' ? 'active' : ''}`}
          onClick={() => setActiveTab('livree')}
        >
          <FontAwesomeIcon icon={faCheckCircle} /> Terminées ({filteredLivree.length})
        </button>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement des livraisons...</p>
        </div>
      )}

      {/* Content */}
      {!loading && renderContent()}
    </div>
  );
}

export default TransporteurLivraisons;
