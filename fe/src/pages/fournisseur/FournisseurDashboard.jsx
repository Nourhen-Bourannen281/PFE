import React, { useState, useCallback, useMemo } from 'react';
import '../../css/clientDashboared.css';

// Produits proposés par le fournisseur (catalogue)
const mockProducts = [
  {
    _id: '1',
    nom: 'Essence Sans Plomb',
    code: 'ESP-001',
    description: 'Essence sans plomb 95 octanes, qualité supérieure',
    prixUnitaire: 2.850,
    uniteMesure: 'Litre',
    typeProduit: 'Carburant',
    categorie: 'Essence',
    stockDisponible: 50000,
    imageIcon: '⛽'
  },
  {
    _id: '2',
    nom: 'Gas-oil (Diesel)',
    code: 'GOD-002',
    description: 'Gas-oil pour moteurs diesel, haute performance',
    prixUnitaire: 2.650,
    uniteMesure: 'Litre',
    typeProduit: 'Carburant',
    categorie: 'Diesel',
    stockDisponible: 75000,
    imageIcon: '🛢️'
  },
  {
    _id: '3',
    nom: 'Kérosène',
    code: 'KER-003',
    description: 'Kérosène pour aviation et chauffage',
    prixUnitaire: 3.200,
    uniteMesure: 'Litre',
    typeProduit: 'Carburant',
    categorie: 'Aviation',
    stockDisponible: 30000,
    imageIcon: '✈️'
  },
  {
    _id: '4',
    nom: 'Pétrole Brut',
    code: 'BRU-004',
    description: 'Pétrole brut non raffiné, qualité export',
    prixUnitaire: 2.400,
    uniteMesure: 'Litre',
    typeProduit: 'Matière première',
    categorie: 'Brut',
    stockDisponible: 100000,
    imageIcon: '🛢️'
  },
  {
    _id: '5',
    nom: 'Gaz Naturel',
    code: 'GAZ-005',
    description: 'Gaz naturel pour usage domestique et industriel',
    prixUnitaire: 1.950,
    uniteMesure: 'm³',
    typeProduit: 'Gaz',
    categorie: 'Naturel',
    stockDisponible: 200000,
    imageIcon: '🔥'
  },
  {
    _id: '6',
    nom: 'GPL (Gaz de Pétrole Liquéfié)',
    code: 'GPL-006',
    description: 'Gaz de pétrole liquéfié pour véhicules',
    prixUnitaire: 1.750,
    uniteMesure: 'kg',
    typeProduit: 'Gaz',
    categorie: 'Liquéfié',
    stockDisponible: 40000,
    imageIcon: '🫙'
  }
];

// Commandes reçues par le fournisseur (de l'ETAP)
const mockCommandes = [
  {
    _id: 'CMD001',
    numeroCommande: 'CMD-2024-0001',
    dateCreation: '2024-12-15T10:30:00.000Z',
    statut: 'Livrée',
    montantTotal: 2850,
    typeLivraison: 'depot',
    client: 'SMART-TRADE 360°',
    produits: [{ nom: 'Essence Sans Plomb', quantite: 1000, prixUnitaire: 2.850, uniteMesure: 'Litre' }]
  },
  {
    _id: 'CMD002',
    numeroCommande: 'CMD-2024-0002',
    dateCreation: '2024-12-20T14:15:00.000Z',
    statut: 'Validée',
    montantTotal: 5300,
    typeLivraison: 'depot',
    client: 'SMART-TRADE 360°',
    produits: [{ nom: 'Gas-oil (Diesel)', quantite: 2000, prixUnitaire: 2.650, uniteMesure: 'Litre' }]
  },
  {
    _id: 'CMD003',
    numeroCommande: 'CMD-2024-0003',
    dateCreation: '2024-12-25T09:45:00.000Z',
    statut: 'En attente',
    montantTotal: 1950,
    typeLivraison: 'export',
    client: 'STEG',
    produits: [{ nom: 'Gaz Naturel', quantite: 1000, prixUnitaire: 1.950, uniteMesure: 'm³' }]
  }
];

// Devis pré-rempli avec des produits proposés
const initialCart = [
  {
    _id: '1',
    nom: 'Essence Sans Plomb',
    prixUnitaire: 2.850,
    quantite: 100,
    uniteMesure: 'Litre',
    imageIcon: '⛽',
    stockDisponible: 50000
  },
  {
    _id: '2',
    nom: 'Gas-oil (Diesel)',
    prixUnitaire: 2.650,
    quantite: 50,
    uniteMesure: 'Litre',
    imageIcon: '🛢️',
    stockDisponible: 75000
  }
];

// Compteur pour les IDs uniques
let toastIdCounter = 0;
let commandeIdCounter = 100;

// Fonction utilitaire pour calculer la date de référence (7 jours avant)
const getDateLimiteRetard = () => {
  const now = new Date();
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
};

function FournisseurDashboard() {
  // État
  const [products] = useState(mockProducts);
  const [cart, setCart] = useState(initialCart); // Devis pré-rempli
  const [commandes, setCommandes] = useState(mockCommandes);
  const [showStats, setShowStats] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showCommandes, setShowCommandes] = useState(false);
  const [showFactures, setShowFactures] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [selectedTypeLivraison, setSelectedTypeLivraison] = useState('depot');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Fonction pour ajouter un toast
  const addToast = useCallback((message, type = 'success') => {
    toastIdCounter += 1;
    const id = toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  // Ouvrir le modal de quantité
  const openQuantityModal = (product) => {
    setSelectedProduct(product);
    setSelectedQuantity(1);
    setShowQuantityModal(true);
  };

  // Ajouter au devis
  const addToCart = () => {
    if (!selectedProduct) return;

    const existingItem = cart.find(item => item._id === selectedProduct._id);

    if (existingItem) {
      setCart(cart.map(item =>
        item._id === selectedProduct._id
          ? { ...item, quantite: item.quantite + selectedQuantity }
          : item
      ));
    } else {
      setCart([...cart, { ...selectedProduct, quantite: selectedQuantity }]);
    }

    addToast(`${selectedQuantity} ${selectedProduct.uniteMesure} de ${selectedProduct.nom} ajouté au devis`, 'success');
    setShowQuantityModal(false);
    setSelectedProduct(null);
    setSelectedQuantity(1);
  };

  // Mettre à jour la quantité dans le devis
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item._id !== productId));
      addToast('Produit retiré du devis', 'info');
    } else {
      setCart(cart.map(item =>
        item._id === productId ? { ...item, quantite: newQuantity } : item
      ));
    }
  };

  // Supprimer du devis
  const removeFromCart = (productId) => {
    const product = cart.find(item => item._id === productId);
    setCart(cart.filter(item => item._id !== productId));
    if (product) {
      addToast(`${product.nom} retiré du devis`, 'info');
    }
  };

  // Vider le devis
  const clearCart = () => {
    setCart([]);
    addToast('Devis vidé', 'info');
  };

  // Générer des factures à partir des commandes reçues
  const factures = useMemo(() => {
    return commandes
      .filter(cmd => cmd.statut !== 'Refusée')
      .map((cmd, index) => ({
        id: `FACT-FRN-${String(index + 1).padStart(4, '0')}`,
        commandeId: cmd._id,
        numeroCommande: cmd.numeroCommande,
        client: cmd.client || 'SMART-TRADE 360°',
        dateEmission: cmd.dateCreation,
        dateEcheance: new Date(new Date(cmd.dateCreation).setDate(new Date(cmd.dateCreation).getDate() + 30)).toISOString(),
        montant: cmd.montantTotal,
        statutPaiement: cmd.statut === 'Livrée' ? 'Encaissée' : (cmd.statut === 'Validée' ? 'En attente' : 'Impayée'),
        modePaiement: cmd.statut === 'Livrée' ? 'Virement bancaire' : 'Non renseigné'
      }));
  }, [commandes]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const commandesStats = {
      total: commandes.length,
      enAttente: commandes.filter(c => c.statut === 'En attente').length,
      validees: commandes.filter(c => c.statut === 'Validée').length,
      livrees: commandes.filter(c => c.statut === 'Livrée').length,
      refusees: commandes.filter(c => c.statut === 'Refusée').length,
      montantTotal: commandes.reduce((sum, c) => sum + c.montantTotal, 0),
      montantMoyen: commandes.length > 0 ? commandes.reduce((sum, c) => sum + c.montantTotal, 0) / commandes.length : 0
    };

    const facturesStats = {
      total: factures.length,
      encaissees: factures.filter(f => f.statutPaiement === 'Encaissée').length,
      impayees: factures.filter(f => f.statutPaiement === 'Impayée' || f.statutPaiement === 'En attente').length,
      montantTotal: factures.reduce((sum, f) => sum + f.montant, 0),
      montantEncaisse: factures.filter(f => f.statutPaiement === 'Encaissée').reduce((sum, f) => sum + f.montant, 0)
    };

    const dateLimite = getDateLimiteRetard();

    const livraisonsStats = {
      total: commandes.filter(c => c.statut !== 'Refusée').length,
      depot: commandes.filter(c => c.typeLivraison === 'depot' && c.statut !== 'Refusée').length,
      export: commandes.filter(c => c.typeLivraison === 'export' && c.statut !== 'Refusée').length,
      enCours: commandes.filter(c => c.statut === 'Validée').length,
      terminees: commandes.filter(c => c.statut === 'Livrée').length,
      retard: commandes.filter(c => c.statut === 'En attente' &&
        new Date(c.dateCreation) < dateLimite).length
    };

    return { commandes: commandesStats, factures: facturesStats, livraisons: livraisonsStats };
  }, [commandes, factures]);

  const formatPrix = useCallback((prix) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(prix);
  }, []);

  // Proposer un devis / Créer une offre
  const passerCommande = useCallback(() => {
    if (cart.length === 0) {
      addToast('Votre devis est vide', 'error');
      return;
    }

    commandeIdCounter += 1;
    const now = new Date();

    const nouvelleCommande = {
      _id: `CMD${commandeIdCounter}`,
      numeroCommande: `OFR-${now.getFullYear()}-${String(commandes.length + 1).padStart(4, '0')}`,
      dateCreation: now.toISOString(),
      statut: 'En attente',
      montantTotal: cart.reduce((total, item) => total + (item.prixUnitaire * item.quantite), 0),
      typeLivraison: selectedTypeLivraison,
      client: 'SMART-TRADE 360°',
      produits: cart.map(item => ({
        nom: item.nom,
        quantite: item.quantite,
        prixUnitaire: item.prixUnitaire,
        uniteMesure: item.uniteMesure
      }))
    };

    setCommandes([nouvelleCommande, ...commandes]);
    addToast('Offre envoyée avec succès !', 'success');
    setCart([]);
    setShowCart(false);
  }, [cart, commandes, selectedTypeLivraison, addToast]);

  const totalCartItems = useMemo(() => {
    return cart.reduce((t, i) => t + i.quantite, 0);
  }, [cart]);

  const totalCartAmount = useMemo(() => {
    return cart.reduce((t, i) => t + (i.prixUnitaire * i.quantite), 0);
  }, [cart]);

  // Filtrage des produits
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return product.nom?.toLowerCase().includes(searchLower) ||
           product.description?.toLowerCase().includes(searchLower) ||
           product.typeProduit?.toLowerCase().includes(searchLower) ||
           product.categorie?.toLowerCase().includes(searchLower);
  });

  // Regrouper les produits par catégorie
  const groupedProducts = filteredProducts.reduce((groups, product) => {
    const category = product.categorie || 'Autres';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
    return groups;
  }, {});

  return (
    <div className="client-dashboard petroleum-dashboard">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Modal Quantité */}
      {showQuantityModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowQuantityModal(false)}>
          <div className="quantity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ajouter au devis</h3>
              <button className="modal-close" onClick={() => setShowQuantityModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="product-info-modal">
                <div className="product-icon-large">{selectedProduct.imageIcon || '⛽'}</div>
                <div className="product-name-modal">{selectedProduct.nom}</div>
                <div className="product-price-modal">
                  {formatPrix(selectedProduct.prixUnitaire)} / {selectedProduct.uniteMesure}
                </div>
              </div>
              <div className="quantity-selector">
                <label>Quantité ({selectedProduct.uniteMesure}) :</label>
                <div className="quantity-controls">
                  <button className="qty-btn" onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 10))}>-10</button>
                  <button className="qty-btn" onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}>-</button>
                  <input
                    type="number"
                    value={selectedQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) {
                        setSelectedQuantity(val);
                      }
                    }}
                    min="1"
                    className="quantity-input-modal"
                  />
                  <button className="qty-btn" onClick={() => setSelectedQuantity(selectedQuantity + 1)}>+</button>
                  <button className="qty-btn" onClick={() => setSelectedQuantity(selectedQuantity + 10)}>+10</button>
                </div>
                <div className="total-price-modal">
                  Total: <strong>{formatPrix(selectedProduct.prixUnitaire * selectedQuantity)}</strong>
                </div>
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowQuantityModal(false)}>Annuler</button>
              <button className="btn-confirm" onClick={addToCart}>Ajouter au devis</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header petroleum-header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-icon">🏭</span>
            <h1>Fournisseur Pétrolier</h1>
          </div>
          <p>Bienvenue, {user.nom || user.raisonSociale || 'Fournisseur'} ! Tableau de bord fournisseur</p>
        </div>
        <div className="cart-mini-badge" onClick={() => setShowCart(true)}>
          <span className="cart-icon">📝</span>
          {cart.length > 0 && <span className="cart-count">{totalCartItems}</span>}
        </div>
      </div>

      {/* Navigation */}
      <div className="dashboard-nav petroleum-nav">
        <button
          className={`nav-btn ${!showCart && !showCommandes && !showFactures && !showStats ? 'active' : ''}`}
          onClick={() => { setShowStats(false); setShowCart(false); setShowCommandes(false); setShowFactures(false); }}
        >
          <span className="nav-icon">⛽</span> Mon Catalogue
        </button>
        <button
          className={`nav-btn ${showStats ? 'active' : ''}`}
          onClick={() => { setShowStats(true); setShowCart(false); setShowCommandes(false); setShowFactures(false); }}
        >
          <span className="nav-icon">📊</span> Statistiques
        </button>
        <button
          className={`nav-btn ${showCart ? 'active' : ''}`}
          onClick={() => { setShowCart(true); setShowStats(false); setShowCommandes(false); setShowFactures(false); }}
        >
          <span className="nav-icon">📝</span> Devis
          {cart.length > 0 && <span className="badge">{totalCartItems}</span>}
        </button>
        <button
          className={`nav-btn ${showCommandes ? 'active' : ''}`}
          onClick={() => { setShowCommandes(true); setShowStats(false); setShowCart(false); setShowFactures(false); }}
        >
          <span className="nav-icon">📋</span> Commandes Reçues
        </button>
        <button
          className={`nav-btn ${showFactures ? 'active' : ''}`}
          onClick={() => { setShowFactures(true); setShowStats(false); setShowCart(false); setShowCommandes(false); }}
        >
          <span className="nav-icon">📄</span> Factures Émises
        </button>
      </div>

      {/* Catalogue */}
      {!showStats && !showCart && !showCommandes && !showFactures && (
        <div className="catalogue-section">
          <div className="products-grid">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category} className="category-section">
                <h2 className="category-title">{category}</h2>
                <div className="category-products">
                  {categoryProducts.map(product => (
                    <div key={product._id} className="product-card">
                      <div className="product-icon">{product.imageIcon || '⛽'}</div>
                      <div className="product-info">
                        <h3>{product.nom}</h3>
                        <p className="product-description">{product.description}</p>
                        <div className="product-price">{formatPrix(product.prixUnitaire)} / {product.uniteMesure}</div>
                        <button className="add-to-cart-btn" onClick={() => openQuantityModal(product)}>
                          📝 Ajouter au devis
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Statistiques */}
      {showStats && (
        <div className="stats-section">
          <h2 className="section-title">📊 Tableau de bord fournisseur</h2>

          <div className="stats-summary-cards">
            <div className="stat-card commandes-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <h3>Commandes Reçues</h3>
                <div className="stat-number">{stats.commandes.total}</div>
                <div className="stat-details">
                  <span>En attente: {stats.commandes.enAttente}</span>
                  <span>Validées: {stats.commandes.validees}</span>
                  <span>Livrées: {stats.commandes.livrees}</span>
                </div>
                <div className="stat-amount">{formatPrix(stats.commandes.montantTotal)}</div>
              </div>
            </div>

            <div className="stat-card factures-card">
              <div className="stat-icon">📄</div>
              <div className="stat-content">
                <h3>Factures Émises</h3>
                <div className="stat-number">{stats.factures.total}</div>
                <div className="stat-details">
                  <span>Encaissées: {stats.factures.encaissees}</span>
                  <span>Impayées: {stats.factures.impayees}</span>
                </div>
                <div className="stat-amount">Encaissé: {formatPrix(stats.factures.montantEncaisse)}</div>
              </div>
            </div>

            <div className="stat-card livraisons-card">
              <div className="stat-icon">🚚</div>
              <div className="stat-content">
                <h3>Livraisons</h3>
                <div className="stat-number">{stats.livraisons.total}</div>
                <div className="stat-details">
                  <span>Dépôt: {stats.livraisons.depot}</span>
                  <span>Export: {stats.livraisons.export}</span>
                </div>
                <div className="stat-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${(stats.livraisons.terminees / Math.max(1, stats.livraisons.total)) * 100}%`}}></div>
                  </div>
                  <span>{stats.livraisons.terminees} terminées</span>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-charts">
            <div className="chart-card">
              <h3>Répartition des commandes</h3>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color pending"></span>
                  <span>En attente ({stats.commandes.enAttente})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color validated"></span>
                  <span>Validées ({stats.commandes.validees})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color delivered"></span>
                  <span>Livrées ({stats.commandes.livrees})</span>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <h3>Situation financière</h3>
              <div className="financial-stats">
                <div className="financial-item">
                  <span>Chiffre d'affaires total</span>
                  <strong>{formatPrix(stats.commandes.montantTotal)}</strong>
                </div>
                <div className="financial-item">
                  <span>Montant encaissé</span>
                  <strong className="positive">{formatPrix(stats.factures.montantEncaisse)}</strong>
                </div>
                <div className="financial-item">
                  <span>Commande moyenne</span>
                  <strong>{formatPrix(stats.commandes.montantMoyen)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Devis */}
      {showCart && (
        <div className="cart-section petroleum-cart">
          <div className="cart-header">
            <h2>📝 Mon Devis</h2>
            <button className="close-cart" onClick={() => setShowCart(false)}>×</button>
          </div>
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🏭</div>
              <h4>Votre devis est vide</h4>
              <button className="browse-btn" onClick={() => setShowCart(false)}>Voir les produits</button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item._id} className="cart-item">
                    <div className="item-info">
                      <div className="item-icon">{item.imageIcon || '⛽'}</div>
                      <div className="item-details">
                        <div className="item-name">{item.nom}</div>
                        <div className="item-price">{formatPrix(item.prixUnitaire)} / {item.uniteMesure}</div>
                      </div>
                    </div>
                    <div className="item-quantity">
                      <button onClick={() => updateQuantity(item._id, item.quantite - 10)}>-10</button>
                      <button onClick={() => updateQuantity(item._id, item.quantite - 1)}>-</button>
                      <input
                        type="number"
                        value={item.quantite}
                        onChange={(e) => updateQuantity(item._id, parseInt(e.target.value, 10) || 0)}
                        min="1"
                      />
                      <button onClick={() => updateQuantity(item._id, item.quantite + 1)}>+</button>
                      <button onClick={() => updateQuantity(item._id, item.quantite + 10)}>+10</button>
                    </div>
                    <div className="item-total">
                      <div className="total-amount">{formatPrix(item.prixUnitaire * item.quantite)}</div>
                      <button onClick={() => removeFromCart(item._id)} className="remove-item">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-footer">
                <div className="delivery-options">
                  <h4>Mode de livraison :</h4>
                  <label className="delivery-option">
                    <input
                      type="radio"
                      value="depot"
                      checked={selectedTypeLivraison === 'depot'}
                      onChange={(e) => setSelectedTypeLivraison(e.target.value)}
                    />
                    🏭 Livraison au dépôt SMART-TRADE 360°
                  </label>
                  <label className="delivery-option">
                    <input
                      type="radio"
                      value="export"
                      checked={selectedTypeLivraison === 'export'}
                      onChange={(e) => setSelectedTypeLivraison(e.target.value)}
                    />
                    🚢 Export international
                  </label>
                </div>
                <div className="cart-total">
                  <div className="total-label">Montant total :</div>
                  <div className="total-amount-large">{formatPrix(totalCartAmount)}</div>
                  <div className="total-detail">{totalCartItems} unités</div>
                </div>
                <div className="cart-actions">
                  <button className="continue-shopping" onClick={() => setShowCart(false)}>🔄 Continuer</button>
                  <button className="clear-cart" onClick={clearCart}>🗑️ Vider</button>
                  <button className="validate-order petroleum-validate" onClick={passerCommande}>
                    ✅ Envoyer l'offre
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Section Commandes Reçues */}
      {showCommandes && (
        <div className="commandes-section">
          <h2>📋 Commandes Reçues</h2>
          <div className="commandes-list">
            {commandes.map(cmd => (
              <div key={cmd._id} className="commande-card">
                <div className="commande-header">
                  <div className="commande-number">{cmd.numeroCommande}</div>
                  <div className={`commande-status status-${cmd.statut.toLowerCase().replace(' ', '-')}`}>
                    {cmd.statut}
                  </div>
                </div>
                <div className="commande-date">
                  📅 {new Date(cmd.dateCreation).toLocaleDateString('fr-FR')}
                  {cmd.client && <span style={{ marginLeft: 12 }}>👤 Client: <strong>{cmd.client}</strong></span>}
                </div>
                <div className="commande-produits">
                  {cmd.produits?.map((p, idx) => (
                    <div key={idx} className="produit-ligne">
                      <span>{p.nom}</span>
                      <span>{p.quantite} {p.uniteMesure}</span>
                      <span>{formatPrix(p.prixUnitaire * p.quantite)}</span>
                    </div>
                  ))}
                </div>
                <div className="commande-footer">
                  <div className="commande-total">
                    Total: <strong>{formatPrix(cmd.montantTotal)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Factures Émises */}
      {showFactures && (
        <div className="factures-section">
          <h2>📄 Factures Émises</h2>
          <div className="factures-list">
            {factures.map(facture => (
              <div key={facture.id} className="facture-card">
                <div className="facture-header">
                  <div className="facture-number">{facture.id}</div>
                  <div className={`facture-status ${facture.statutPaiement === 'Encaissée' ? 'status-paid' : 'status-unpaid'}`}>
                    {facture.statutPaiement}
                  </div>
                </div>
                <div className="facture-info">
                  <p>Commande: {facture.numeroCommande}</p>
                  <p>Client: {facture.client}</p>
                  <p>Date: {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}</p>
                  <p>Échéance: {new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="facture-total">
                  Montant: <strong>{formatPrix(facture.montant)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FournisseurDashboard;
