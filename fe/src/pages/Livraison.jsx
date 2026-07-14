// pages/admin/Livraisons.jsx - VERSION FINALE CORRIGÉE
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import '../css/Livraison.css';

function Livraisons() {
  // ═══════════════════════════════════════════════════════════
  // 1. STATE
  // ═══════════════════════════════════════════════════════════
  const [livraisons, setLivraisons] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [transporteurs, setTransporteurs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEtat, setSelectedEtat] = useState('');

  // ═══════════════════════════════════════════════════════════
  // 2. USER & AUTH
  // ═══════════════════════════════════════════════════════════
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const token = localStorage.getItem('token');
  const userRole = user?.role?.toLowerCase() || '';
  const userId = user?._id || user?.id || '';
  const isAdmin = userRole === 'admin';
  const isCommercial = userRole === 'commercial';
  const isClient = userRole === 'client';
  const isFournisseur = userRole === 'fournisseur';
  const isTransporteur = userRole === 'transporteur';

  // Permissions par rôle
  const canView = isAdmin || isCommercial || isClient || isFournisseur || isTransporteur;
  const canCreate = isAdmin || isCommercial;
  const canEdit = isAdmin || isCommercial;
  const canAssignTransporteur = isAdmin;

  // ═══════════════════════════════════════════════════════════
  // 3. API CLIENT
  // ═══════════════════════════════════════════════════════════
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: 'http://localhost:5001/api',
      headers: { 'Content-Type': 'application/json' },
    });

    instance.interceptors.request.use((config) => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          toast.error('Session expirée, veuillez vous reconnecter');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 4. FONCTIONS DE FORMATAGE SÉCURISÉES
  // ═══════════════════════════════════════════════════════════
  
  const ensureString = useCallback((value, defaultValue = 'N/A') => {
    if (!value) return defaultValue;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      const name = value.raisonSociale || value.nom || value.name || value._id;
      if (name && typeof name === 'string') return name;
      return defaultValue;
    }
    return String(value);
  }, []);

  const getTransporteurNom = useCallback((transporteur) => {
    if (!transporteur) return 'Non assigné';
    return ensureString(transporteur, 'Transporteur');
  }, [ensureString]);

  const getPartenaireNom = useCallback((commande) => {
    if (!commande) return 'N/A';
    
    const partenaire = commande.client || commande.fournisseur || commande.importateur || commande.partenaire;
    
    if (!partenaire) return 'N/A';
    return ensureString(partenaire, 'Partenaire');
  }, [ensureString]);

  // ═══════════════════════════════════════════════════════════
  // 5. FETCH DATA (CORRIGÉE)
  // ═══════════════════════════════════════════════════════════
  const fetchData = useCallback(async () => {
    if (!token) {
      toast.error('❌ Authentification requise');
      return;
    }

    try {
      setLoading(true);

      // 1. Récupérer les livraisons
      const livraisonsRes = await api.get('/livraisons');
      setLivraisons(Array.isArray(livraisonsRes.data) ? livraisonsRes.data : livraisonsRes.data?.data || []);

      // 2. Récupérer les commandes validées
      const commandesRes = await api.get('/commandes?statut=Validée');
      setCommandes(Array.isArray(commandesRes.data) ? commandesRes.data : commandesRes.data?.data || []);

      // 3. Récupérer les transporteurs - VERSION CORRIGÉE
      let transporteursData = [];
      
      try {
        // Essayer d'abord la route standard
        const transporteursRes = await api.get('/transporteurs');
        transporteursData = transporteursRes.data?.data || transporteursRes.data || [];
        
        if (transporteursData.length === 0) {
          // Si aucun transporteur, essayer la route test-all-users
          const testRes = await api.get('/livraisons/test-all-users');
          transporteursData = testRes.data?.transporteurs || [];
          console.log('📦 Transporteurs chargés via test-all-users:', transporteursData.length);
        }
        
        if (transporteursData.length === 0) {
          // Dernier recours : chercher dans tous les utilisateurs
          const usersRes = await api.get('/users');
          const allUsers = usersRes.data?.data || usersRes.data || [];
          transporteursData = allUsers.filter(u => u.role === 'Transporteur');
          console.log('📦 Transporteurs chargés via /users:', transporteursData.length);
        }
      } catch (err) {
        console.error('Erreur chargement transporteurs:', err);
      }
      
      setTransporteurs(transporteursData);
      
      if (transporteursData.length === 0) {
        toast.warning('⚠️ Aucun transporteur trouvé. Veuillez en créer dans la section utilisateurs.');
      } else {
        toast.success(`✅ Données chargées (${transporteursData.length} transporteur(s))`);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error(error.response?.data?.message || '❌ Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [token, api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ═══════════════════════════════════════════════════════════
  // 6. CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════
  const createLivraison = useCallback(async () => {
    if (!canCreate) {
      toast.error('❌ Accès refusé');
      return;
    }
    if (!selectedCommande) {
      toast.error('⚠️ Sélectionnez une commande');
      return;
    }

    const existing = livraisons.find((l) => l.commande?._id === selectedCommande._id);
    if (existing) {
      toast.error(`⚠️ Livraison existe déjà pour ${selectedCommande.numeroCommande}`);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/livraisons/from-commande/' + selectedCommande._id);
      setLivraisons((prev) => [response.data.data, ...prev]);
      toast.success(`✅ Livraison créée pour ${selectedCommande.numeroCommande}`);
      setShowModal(false);
      setSelectedCommande(null);
      fetchData();
    } catch (error) {
      console.error('Erreur création:', error);
      toast.error(error.response?.data?.message || '❌ Erreur création');
    } finally {
      setLoading(false);
    }
  }, [canCreate, selectedCommande, livraisons, api, fetchData]);

  const updateEtat = useCallback(
    async (livraisonId, nouvelEtat) => {
      if (!canEdit) {
        toast.error('❌ Accès refusé');
        return;
      }

      let commentaireValue = '';
      if (nouvelEtat === 'Annulée') {
        commentaireValue = prompt('Raison de l\'annulation :');
        if (!commentaireValue) return;
      }

      try {
        setLoading(true);
        const response = await api.patch(`/livraisons/${livraisonId}/etat`, {
          etat: nouvelEtat,
          commentaire: commentaireValue,
        });
        setLivraisons((prev) => prev.map((l) => (l._id === livraisonId ? response.data.data : l)));

        const messages = {
          'Prête': '✅ Livraison prête',
          'En cours': '🚚 Livraison en cours',
          'Livrée': '📦 Livraison livrée',
          'Annulée': '❌ Livraison annulée',
        };
        toast.success(messages[nouvelEtat] || `État: ${nouvelEtat}`);
      } catch (error) {
        console.error('Erreur mise à jour:', error);
        toast.error(error.response?.data?.message || '❌ Erreur mise à jour');
      } finally {
        setLoading(false);
      }
    },
    [canEdit, api]
  );

  const assignTransporteur = useCallback(async (livraisonId, transporteurId) => {
    if (!canAssignTransporteur) {
      toast.error('❌ Seul l’admin peut assigner');
      return;
    }
    if (!transporteurId) {
      toast.error('⚠️ Sélectionnez un transporteur');
      return;
    }

    try {
      setLoading(true);
      const response = await api.patch(`/livraisons/${livraisonId}/assign-transporteur`, {
        transporteurId: transporteurId
      });
      
      if (response.data.success) {
        setLivraisons((prev) => prev.map((l) => 
          l._id === livraisonId ? response.data.data : l
        ));
        toast.success('✅ Transporteur assigné avec succès');
        setShowAssignModal(false);
        setSelectedLivraison(null);
      }
    } catch (error) {
      console.error('Erreur assignation:', error);
      toast.error(error.response?.data?.message || '❌ Erreur assignation');
    } finally {
      setLoading(false);
    }
  }, [canAssignTransporteur, api]);

  // ═══════════════════════════════════════════════════════════
  // 7. PDF EXPORT
  // ═══════════════════════════════════════════════════════════
  const downloadBonLivraison = useCallback(
    async (livraisonId, numeroLivraison) => {
      if (!canEdit) {
        toast.error('❌ Accès refusé');
        return;
      }

      try {
        setPdfLoading(livraisonId);
        
        const response = await api.get(`/livraisons/${livraisonId}/pdf`, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Bon_Livraison_${numeroLivraison}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('📄 PDF téléchargé');
      } catch (err) {
        console.error('Erreur PDF:', err);
        toast.error('❌ Erreur lors de la génération du PDF');
      } finally {
        setPdfLoading(null);
      }
    },
    [canEdit, api]
  );

  // ═══════════════════════════════════════════════════════════
  // 8. AUTRES HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════
  const getEtatClass = useCallback((etat) => {
    const classes = {
      'À préparer': 'etat-preparer',
      'Prête': 'etat-prete',
      'En cours': 'etat-cours',
      'Livrée': 'etat-livree',
      'Annulée': 'etat-annulee',
    };
    return classes[etat] || '';
  }, []);

  const getEtatIcon = useCallback((etat) => {
    const icons = {
      'À préparer': '⏳',
      'Prête': '✅',
      'En cours': '🚚',
      'Livrée': '📦',
      'Annulée': '❌',
    };
    return icons[etat] || '📄';
  }, []);

  const getEtatsPossibles = useCallback((etatActuel) => {
    const etats = {
      'À préparer': ['Prête', 'Annulée'],
      'Prête': ['En cours', 'Annulée'],
      'En cours': ['Livrée', 'Annulée'],
    };
    return etats[etatActuel] || [];
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 9. FILTERING & STATS
  // ═══════════════════════════════════════════════════════════
  const filteredLivraisons = useMemo(() => {
    return livraisons.filter((l) => {
      const cmd = l.commande || {};
      const partenaire = cmd.partenaire || cmd.client || cmd.fournisseur || {};
      const partenaireId = partenaire?._id || partenaire;
      const partenaireName = ensureString(partenaire, '').toUpperCase();
      const transpId = l.transporteur?._id || l.transporteur;

      const roleFilter = isAdmin || isCommercial ||
        (isFournisseur && (
          String(partenaireId) === String(userId) ||
          partenaire.type === 0 ||
          partenaire.role === 'Fournisseur' ||
          partenaireName.includes('STEG') ||
          partenaireName.includes('STIR')
        )) ||
        (isClient && (
          String(partenaireId) === String(userId) ||
          partenaire.type === 1 ||
          partenaire.role === 'Client'
        )) ||
        (isTransporteur && (
          String(transpId) === String(userId) ||
          ['Prête', 'En cours', 'À préparer'].includes(l.etat)
        ));

      if (!roleFilter) return false;

      const transporteurNom = getTransporteurNom(l.transporteur);
      const partenaireNom = getPartenaireNom(cmd);
      const matchesSearch =
        l.numeroLivraison?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.commande?.numeroCommande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transporteurNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partenaireNom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEtat = !selectedEtat || l.etat === selectedEtat;
      return matchesSearch && matchesEtat;
    });
  }, [livraisons, searchTerm, selectedEtat, getTransporteurNom, getPartenaireNom, ensureString, isAdmin, isCommercial, isClient, isFournisseur, isTransporteur, userId]);

  const stats = useMemo(
    () => ({
      total: livraisons.length,
      aPreparer: livraisons.filter((l) => l.etat === 'À préparer').length,
      prete: livraisons.filter((l) => l.etat === 'Prête').length,
      enCours: livraisons.filter((l) => l.etat === 'En cours').length,
      livrees: livraisons.filter((l) => l.etat === 'Livrée').length,
    }),
    [livraisons]
  );

  // Commandes disponibles pour création
  const commandesDisponibles = useMemo(() => {
    const commandesAvecLivraison = new Set(
      livraisons.map(l => l.commande?._id?.toString())
    );
    return commandes.filter(
      cmd => !commandesAvecLivraison.has(cmd._id?.toString())
    );
  }, [commandes, livraisons]);

  // ═══════════════════════════════════════════════════════════
  // 10. EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleCloseModal = useCallback(() => {
    if (!loading) {
      setShowModal(false);
      setSelectedCommande(null);
    }
  }, [loading]);

  const handleCloseAssignModal = useCallback(() => {
    if (!loading) {
      setShowAssignModal(false);
      setSelectedLivraison(null);
    }
  }, [loading]);

  // ═══════════════════════════════════════════════════════════
  // 11. ACCESS CONTROL
  // ═══════════════════════════════════════════════════════════
  if (!canView) {
    return (
      <div className="livraisons-page">
        <div className="empty-state" style={{ margin: '100px auto' }}>
          <h3>🔒 Accès refusé</h3>
          <p>Vous devez être connecté pour accéder aux livraisons.</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 12. RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="livraisons-page">
      <div className="role-banner">
        {isAdmin ? '👤 Administrateur - Gestion complète + Signature livreurs' : 
         isCommercial ? '💼 Commercial - Gestion des livraisons' : 
         isTransporteur ? '🚚 Transporteur - Livraisons assignées' :
         isClient ? '👥 Client - Suivi des livraisons' :
         isFournisseur ? '🏭 Fournisseur - Suivi des livraisons' : '❓ Rôle inconnu'}
      </div>

      <div className="livraisons-header">
        <div className="header-left">
          <h2>🚚 Gestion des Livraisons</h2>
          <p>Suivi complet des livraisons</p>
        </div>

        <div className="livraisons-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.aPreparer}</div>
            <div className="stat-label">À préparer</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.prete}</div>
            <div className="stat-label">Prête</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.enCours}</div>
            <div className="stat-label">En cours</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.livrees}</div>
            <div className="stat-label">Livrées</div>
          </div>
        </div>

        {canCreate && (
          <button className="btn-nouveau" onClick={() => setShowModal(true)} disabled={loading}>
            + Nouvelle Livraison
          </button>
        )}
      </div>

      <div className="filters-section">
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <div className="etat-filter">
          <button className={`filter-btn ${!selectedEtat ? 'active' : ''}`} onClick={() => setSelectedEtat('')}>
            Tous ({stats.total})
          </button>
          <button className={`filter-btn ${selectedEtat === 'À préparer' ? 'active' : ''}`} onClick={() => setSelectedEtat('À préparer')}>
            ⏳ À préparer ({stats.aPreparer})
          </button>
          <button className={`filter-btn ${selectedEtat === 'Prête' ? 'active' : ''}`} onClick={() => setSelectedEtat('Prête')}>
            ✅ Prête ({stats.prete})
          </button>
          <button className={`filter-btn ${selectedEtat === 'En cours' ? 'active' : ''}`} onClick={() => setSelectedEtat('En cours')}>
            🚚 En cours ({stats.enCours})
          </button>
          <button className={`filter-btn ${selectedEtat === 'Livrée' ? 'active' : ''}`} onClick={() => setSelectedEtat('Livrée')}>
            📦 Livrée ({stats.livrees})
          </button>
        </div>
      </div>

      {loading && !filteredLivraisons.length ? (
        <div className="empty-state">
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
          <p>Chargement des livraisons...</p>
        </div>
      ) : filteredLivraisons.length === 0 ? (
        <div className="empty-state">
          <h3>🚚 Aucune livraison</h3>
          <p>{searchTerm || selectedEtat ? 'Aucune livraison ne correspond à vos critères' : 'Créez votre première livraison'}</p>
          {canCreate && !searchTerm && !selectedEtat && (
            <button className="btn-add-first" onClick={() => setShowModal(true)}>
              + Créer une livraison
            </button>
          )}
        </div>
      ) : (
        <div className="livraisons-grid">
          {filteredLivraisons.map((livraison) => {
            const etatClass = getEtatClass(livraison.etat);
            const partenaireNom = getPartenaireNom(livraison.commande);
            const transporteurNom = getTransporteurNom(livraison.transporteur);
            
            return (
              <div key={livraison._id} className="livraison-card">
                <div className={`livraison-header ${etatClass}`}>
                  <div className="header-info">
                    <span className="livraison-num">{livraison.numeroLivraison || 'N/A'}</span>
                    <span className="commande-ref">Commande: {livraison.commande?.numeroCommande || 'N/A'}</span>
                  </div>
                  <div className={`livraison-etat ${etatClass}`}>
                    {getEtatIcon(livraison.etat)} {livraison.etat || 'N/A'}
                  </div>
                </div>

                <div className="livraison-body">
                  <div className="info-row">
                    <span className="info-label">Client/Partenaire:</span>
                    <span className="info-value">{partenaireNom}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">Transporteur:</span>
                    <span className="info-value">{transporteurNom}</span>
                  </div>

                  {canAssignTransporteur && (
                    <div className="info-row">
                      <span className="info-label">Action:</span>
                      <button
                        className="btn-assign"
                        onClick={() => {
                          setSelectedLivraison(livraison);
                          setShowAssignModal(true);
                        }}
                      >
                        {!livraison.transporteur ? '✍️ Signer livreur' : '🔄 Changer'}
                      </button>
                    </div>
                  )}

                  <div className="info-row">
                    <span className="info-label">Date création:</span>
                    <span className="info-value">{livraison.dateCreation ? new Date(livraison.dateCreation).toLocaleDateString('fr-FR') : 'N/A'}</span>
                  </div>

                  {livraison.commentaire && (
                    <div className="info-row">
                      <span className="info-label">Commentaire:</span>
                      <span className="info-value commentaire">{livraison.commentaire}</span>
                    </div>
                  )}
                </div>

                <div className="livraison-actions">
                  {canEdit && (
                    <>
                      <button
                        className="btn-pdf"
                        onClick={() => downloadBonLivraison(livraison._id, livraison.numeroLivraison)}
                        disabled={pdfLoading === livraison._id}
                      >
                        {pdfLoading === livraison._id ? '⏳' : '📄'} PDF
                      </button>

                      {getEtatsPossibles(livraison.etat).map((etat) => (
                        <button
                          key={etat}
                          className={`btn-etat ${etat === 'Annulée' ? 'btn-danger' : ''}`}
                          onClick={() => updateEtat(livraison._id, etat)}
                          disabled={loading}
                        >
                          {etat === 'Prête' && '✅ Prête'}
                          {etat === 'En cours' && '🚚 En cours'}
                          {etat === 'Livrée' && '📦 Livrée'}
                          {etat === 'Annulée' && '❌ Annuler'}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Création */}
      {canCreate && showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Nouvelle Livraison</h3>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>
                  Commande validée * 
                  {commandesDisponibles.length > 0 && (
                    <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                      ({commandesDisponibles.length} commande(s) sans livraison)
                    </span>
                  )}
                </label>
                
                <select
                  value={selectedCommande?._id || ''}
                  onChange={(e) => {
                    const cmd = commandes.find((c) => c._id === e.target.value);
                    setSelectedCommande(cmd);
                  }}
                >
                  <option value="">-- Sélectionner une commande --</option>
                  {commandesDisponibles.map((cmd) => {
                    const partenaireNom = getPartenaireNom(cmd);
                    return (
                      <option key={cmd._id} value={cmd._id}>
                        {cmd.numeroCommande || 'N/A'} - {partenaireNom} - {(cmd.montantTotal || 0).toLocaleString()} {cmd.devise || 'TND'}
                      </option>
                    );
                  })}
                </select>
                
                {commandesDisponibles.length === 0 && (
                  <p style={{ color: '#ff9800', marginTop: '10px', fontSize: '14px' }}>
                    ⚠️ Aucune commande disponible. Toutes les commandes validées ont déjà une livraison.
                  </p>
                )}
              </div>

              {selectedCommande && (
                <div className="selected-commande-info">
                  <h4>Détails de la commande</h4>
                  <p><strong>Partenaire:</strong> {getPartenaireNom(selectedCommande)}</p>
                  <p><strong>Montant:</strong> {(selectedCommande.montantTotal || 0).toLocaleString()} {selectedCommande.devise || 'TND'}</p>
                  <p><strong>Date:</strong> {selectedCommande.dateCreation ? new Date(selectedCommande.dateCreation).toLocaleDateString('fr-FR') : 'N/A'}</p>
                  <p><strong>Produits:</strong> {selectedCommande.produits?.length || 0} article(s)</p>
                </div>
              )}
            </div>

            <div className="modal-buttons">
              <button className="btn-secondary" onClick={handleCloseModal} disabled={loading}>
                Annuler
              </button>
              <button 
                className="btn-primary" 
                onClick={createLivraison} 
                disabled={loading || !selectedCommande || commandesDisponibles.length === 0}
              >
                {loading ? '⏳ Création...' : '✅ Créer la livraison'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Assignation Transporteur */}
      {canAssignTransporteur && showAssignModal && selectedLivraison && (
        <div className="modal-overlay" onClick={handleCloseAssignModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✍️ Signer un livreur</h3>
              <button className="modal-close" onClick={handleCloseAssignModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Sélectionner un transporteur *</label>
                <select id="transporteurSelect" defaultValue="">
                  <option value="">-- Sélectionner un transporteur --</option>
                  {transporteurs && transporteurs.length > 0 ? (
                    transporteurs.map((t) => {
                      let transporteurNom = t.raisonSociale || t.nom || t.email || 'Transporteur';
                      return (
                        <option key={t._id || t.id} value={t._id || t.id}>
                          {transporteurNom}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>Aucun transporteur disponible</option>
                  )}
                </select>
              </div>

              <div className="info-box">
                <p><strong>Livraison:</strong> {selectedLivraison.numeroLivraison || 'N/A'}</p>
                <p><strong>Commande:</strong> {selectedLivraison.commande?.numeroCommande || 'N/A'}</p>
                <p><strong>Statut actuel:</strong> {selectedLivraison.etat || 'N/A'}</p>
                <p><strong>Client:</strong> {getPartenaireNom(selectedLivraison.commande)}</p>
              </div>
            </div>

            <div className="modal-buttons">
              <button className="btn-secondary" onClick={handleCloseAssignModal} disabled={loading}>
                Annuler
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const select = document.getElementById('transporteurSelect');
                  const transporteurId = select?.value;
                  if (transporteurId && transporteurId !== '') {
                    assignTransporteur(selectedLivraison._id, transporteurId);
                  } else {
                    toast.error('⚠️ Veuillez sélectionner un transporteur');
                  }
                }}
                disabled={loading || !transporteurs || transporteurs.length === 0}
              >
                {loading ? '⏳ Assignation...' : '✅ Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Livraisons;