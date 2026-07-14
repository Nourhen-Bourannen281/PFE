// pages/admin/referentiel/Products.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import '../../../css/Products.css';

const Products = () => {
  // ==================== ÉTATS ====================
  const [produits, setProduits] = useState([]);
  const [contrats, setContrats] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  // Supprimer selectedCategorie car plus utilisé
  // const [selectedCategorie, setSelectedCategorie] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showContratModal, setShowContratModal] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [selectedContrat, setSelectedContrat] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [useMockData, setUseMockData] = useState(false);
  const [productForm, setProductForm] = useState({
    nom: '',
    type: 'STEG',
    description: '',
    unite: 'm³',
    prixUnitaire: '',
    stockInitial: 0,
    category: 'Autre'
  });

  // Clé pour localStorage (mode démo)
  const STORAGE_KEY_PRODUCTS = 'products_data';
  const STORAGE_KEY_CONTRATS = 'contrats_data';
  const STORAGE_KEY_CLIENTS = 'clients_data';

  // ==================== DONNÉES MOCKÉES ====================
  const getInitialProducts = () => {
    return [
      { _id: '1', nom: 'Gaz Naturel', type: 'STEG', description: 'Gaz naturel pour usage domestique et industriel', unite: 'm³', prixUnitaire: 2.5, stockInitial: 10000, category: 'Gaz Naturel', codeProduit: 'GAZ001' },
      { _id: '2', nom: 'Électricité', type: 'STEG', description: 'Électricité haute tension', unite: 'kWh', prixUnitaire: 0.25, stockInitial: 500000, category: 'Électricité', codeProduit: 'ELEC001' },
      { _id: '3', nom: 'Pétrole Brut', type: 'STIR', description: 'Pétrole brut raffiné', unite: 'Bbl', prixUnitaire: 75, stockInitial: 5000, category: 'Pétrole Brut', codeProduit: 'PET001' },
      { _id: '4', nom: 'Essence Sans Plomb', type: 'STIR', description: 'Carburant pour véhicules', unite: 'L', prixUnitaire: 2.8, stockInitial: 25000, category: 'Carburants', codeProduit: 'ESS001' },
      { _id: '5', nom: 'Fuel Industriel', type: 'STIR', description: 'Fuel pour chauffage industriel', unite: 'L', prixUnitaire: 1.8, stockInitial: 15000, category: 'Fuel', codeProduit: 'FUE001' }
    ];
  };

  const getInitialContrats = () => {
    return [
      { _id: '1', numeroContrat: 'CTV-STEG-20241201-001', produit: '1', client: '1', quantite: 1000, prixUnitaire: 2.5, montantTotal: 2500, dateDebut: '2024-01-01', dateFin: '2024-12-31', conditionsPaiement: 'Paiement à 30 jours', statut: 'En Cours', createdAt: '2024-01-01' },
      { _id: '2', numeroContrat: 'CTV-STIR-20241201-001', produit: '3', client: '2', quantite: 500, prixUnitaire: 75, montantTotal: 37500, dateDebut: '2024-01-01', dateFin: '2024-12-31', conditionsPaiement: 'Paiement à 45 jours', statut: 'En Cours', createdAt: '2024-01-01' }
    ];
  };

  const getInitialClients = () => {
    return [
      { _id: '1', nom: 'Société Tunisienne de Gaz', type: 'Client', role: 'Client', email: 'contact@stg.com', raisonSociale: 'STG - Société Tunisienne de Gaz' },
      { _id: '2', nom: 'Société de Raffinage', type: 'Client', role: 'Client', email: 'contact@stir.com', raisonSociale: 'STIR - Société Tunisienne de Raffinage' }
    ];
  };

  // ==================== CHARGEMENT DONNÉES LOCALSTORAGE ====================
  const loadMockData = (key, initialData) => {
    const savedData = localStorage.getItem(key);
    if (savedData) {
      return JSON.parse(savedData);
    }
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  };

  const saveMockData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // ==================== CONFIGURATION API ====================
  const getApiConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUseMockData(true);
      return null;
    }
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }, []);

  // Vérifier si l'utilisateur est admin
  const checkAdminRole = useCallback(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user?.role || localStorage.getItem('role');
    setIsAdmin(role === 'Admin' || role === 'admin');
  }, []);

  // ==================== RÉCUPÉRATION API AVEC FALLBACK MOCK ====================
  const fetchProduits = useCallback(async () => {
    try {
      const config = getApiConfig();
      if (!config || useMockData) {
        const mockData = loadMockData(STORAGE_KEY_PRODUCTS, getInitialProducts());
        setProduits(mockData);
        return;
      }
      
      const response = await axios.get('http://localhost:5001/api/products', config);
      const produitsData = response.data.data || response.data.products || response.data || [];
      setProduits(produitsData);
      saveMockData(STORAGE_KEY_PRODUCTS, produitsData);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      const mockData = loadMockData(STORAGE_KEY_PRODUCTS, getInitialProducts());
      setProduits(mockData);
      setUseMockData(true);
      toast.warning('Mode démo activé pour les produits');
    }
  }, [getApiConfig, useMockData]);

  const fetchContrats = useCallback(async () => {
    try {
      const config = getApiConfig();
      if (!config || useMockData) {
        const mockData = loadMockData(STORAGE_KEY_CONTRATS, getInitialContrats());
        setContrats(mockData);
        return;
      }
      
      const response = await axios.get('http://localhost:5001/api/contrats-vente', config);
      const contratsData = response.data.data || response.data || [];
      setContrats(contratsData);
      saveMockData(STORAGE_KEY_CONTRATS, contratsData);
    } catch (error) {
      console.error('Erreur chargement contrats:', error);
      const mockData = loadMockData(STORAGE_KEY_CONTRATS, getInitialContrats());
      setContrats(mockData);
    }
  }, [getApiConfig, useMockData]);

  const fetchClients = useCallback(async () => {
    try {
      const config = getApiConfig();
      if (!config || useMockData) {
        const mockData = loadMockData(STORAGE_KEY_CLIENTS, getInitialClients());
        const filteredClients = mockData.filter(u => u.role === 'Client');
        setClients(filteredClients);
        setLoading(false);
        return;
      }
      
      // Essayer /api/users d'abord, fallback sur /api/debug/users
      let clientsData = [];
      try {
        const response = await axios.get('http://localhost:5001/api/users', config);
        clientsData = response.data.data || response.data?.users || response.data || [];
        console.log('📥 /api/users data:', clientsData);
      } catch (e1) {
        console.warn('⚠️ /api/users a échoué, essai /api/debug/users');
        const response2 = await axios.get('http://localhost:5001/api/debug/users');
        clientsData = response2.data?.users || [];
        console.log('📥 /api/debug/users data:', clientsData);
      }

      // Filtre permissif: role "Client" (case-insensitive), _id ou id présent
      const filteredClients = clientsData
        .filter(u => {
          const role = String(u.role || '').toLowerCase();
          return role === 'client' && (u._id || u.id);
        })
        .map(u => ({
          ...u,
          _id: u._id || u.id  // ✅ Normaliser sur _id
        }));

      console.log('✅ Clients filtrés:', filteredClients.length);
      console.log('📋 Liste:', filteredClients.map(c => ({
        _id: c._id,
        email: c.email,
        role: c.role
      })));

      setClients(filteredClients);
      saveMockData(STORAGE_KEY_CLIENTS, clientsData);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      const mockData = loadMockData(STORAGE_KEY_CLIENTS, getInitialClients());
      const filteredClients = mockData.filter(u => u.role === 'Client');
      setClients(filteredClients);
    } finally {
      setLoading(false);
    }
  }, [getApiConfig, useMockData]);

  useEffect(() => {
    checkAdminRole();
    Promise.all([fetchProduits(), fetchContrats(), fetchClients()]);
  }, [fetchProduits, fetchContrats, fetchClients, checkAdminRole]);

  // ==================== FONCTIONS UTILITAIRES ====================
  const getContratsForProduit = (produitId) => {
    return contrats.filter(c => c.produit === produitId || c.produit?._id === produitId || c.produitId === produitId);
  };

  const getClientForContrat = (clientId) => {
    return clients.find(c => c._id === clientId);
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getProduitType = (produit) => {
    return produit.type === 'STEG' ? 'STEG - Énergie' : 'STIR - Raffinage';
  };

  const getProductIcon = (productName) => {
    if (!productName) return '📦';
    const name = productName.toLowerCase();
    if (name.includes('gaz')) return '🔥';
    if (name.includes('pétrole') || name.includes('petrole')) return '🛢️';
    if (name.includes('essence')) return '⛽';
    if (name.includes('fuel')) return '🏭';
    if (name.includes('électricité') || name.includes('electricite')) return '⚡';
    return '📦';
  };

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Gaz Naturel': '🔥',
      'Électricité': '⚡',
      'Pétrole Brut': '🛢️',
      'Carburants': '⛽',
      'Fuel': '🏭',
      'Lubrifiants': '🔧',
      'Autre': '📦'
    };
    return icons[categoryName] || '📦';
  };

  const getCategoryColor = (categoryName) => {
    const colors = {
      'Gaz Naturel': '#10b981',
      'Électricité': '#f59e0b',
      'Pétrole Brut': '#6366f1',
      'Carburants': '#ef4444',
      'Fuel': '#8b5cf6',
      'Lubrifiants': '#06b6d4',
      'Autre': '#6b7280'
    };
    return colors[categoryName] || '#6b7280';
  };

  // ==================== FILTRES ====================
  // Supprimer le filtre par catégorie, garder seulement type et recherche
  const filteredProduits = produits.filter(produit => {
    const matchType = selectedType === 'all' || produit.type === selectedType;
    const matchSearch = produit.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       produit.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       produit.codeProduit?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const produitsAvecContrats = filteredProduits.filter(p => getContratsForProduit(p._id).length > 0);
  const produitsSansContrats = filteredProduits.filter(p => getContratsForProduit(p._id).length === 0);

  // ==================== CRUD PRODUITS ====================
  const resetProductForm = () => {
    setProductForm({
      nom: '',
      type: 'STEG',
      description: '',
      unite: 'm³',
      prixUnitaire: '',
      stockInitial: 0,
      category: 'Autre'
    });
    setEditingProduct(null);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    const prix = parseFloat(productForm.prixUnitaire);
    if (!productForm.nom.trim()) {
      toast.error('Le nom du produit est obligatoire');
      return;
    }
    if (!productForm.prixUnitaire || isNaN(prix) || prix <= 0) {
      toast.error('Le prix unitaire doit être un nombre positif');
      return;
    }

    setLoading(true);
    try {
      const config = getApiConfig();
      
      // Mode démo
      if (!config || useMockData) {
        const productToSend = {
          _id: editingProduct?._id || Date.now().toString(),
          nom: productForm.nom.trim(),
          type: productForm.type,
          description: productForm.description || '',
          unite: productForm.unite,
          prixUnitaire: parseFloat(productForm.prixUnitaire),
          stockInitial: parseInt(productForm.stockInitial) || 0,
          category: productForm.category || 'Autre',
          codeProduit: editingProduct?.codeProduit || `PRD${Date.now()}`
        };

        let updatedProducts;
        if (editingProduct) {
          updatedProducts = produits.map(p => p._id === editingProduct._id ? productToSend : p);
          toast.success('Produit modifié avec succès (mode démo)');
        } else {
          updatedProducts = [...produits, productToSend];
          toast.success('Produit créé avec succès (mode démo)');
        }
        
        setProduits(updatedProducts);
        saveMockData(STORAGE_KEY_PRODUCTS, updatedProducts);
        setShowProductModal(false);
        resetProductForm();
        setLoading(false);
        return;
      }

      // Mode API
      // Mapper l'unité vers l'enum backend ['Litres', 'Barils', 'm³', 'Tonnes']
      const mapUniteMesure = (unite) => {
        const u = String(unite || '').toLowerCase();
        if (u.includes('l') || u === 'litre' || u === 'litres') return 'Litres';
        if (u.includes('bbl') || u.includes('baril')) return 'Barils';
        if (u.includes('m³') || u.includes('m3')) return 'm³';
        if (u.includes('t') || u.includes('tonne') || u === 'kg') return 'Tonnes';
        return 'Litres'; // Par défaut
      };

      // Générer un codeProduit GARANTI unique avec UUID-like
      const generateUniqueCode = (nom, type) => {
        const prefix = type === 'STEG' ? 'STEG' : 'STIR';
        const cleanNom = nom.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase() || 'PROD';
        // UUID-like: timestamp microseconde + 2 randoms = 13+6+6 caractères
        const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 10).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        return `${prefix}-${cleanNom}-${uniqueId}`;
      };

      const productToSend = {
        nom: productForm.nom.trim(),
        type: productForm.type || 'STEG',
        description: productForm.description || '',
        unite: productForm.unite || 'm³',
        uniteMesure: mapUniteMesure(productForm.unite),
        prixUnitaire: prix,
        stockInitial: parseInt(productForm.stockInitial) || 0,
        category: productForm.category || 'Autre',
      };

      console.log('📤 Produit envoyé:', JSON.stringify(productToSend, null, 2));

      if (editingProduct) {
        const response = await axios.put(`http://localhost:5001/api/products/${editingProduct._id}`, productToSend, config);
        console.log('✅ Produit modifié:', response.data);
        toast.success('Produit modifié avec succès');
      } else {
        const response = await axios.post('http://localhost:5001/api/products', productToSend, config);
        console.log('✅ Produit créé:', response.data);
        toast.success('Produit créé avec succès');
      }

      setShowProductModal(false);
      resetProductForm();
      await fetchProduits();

    } catch (error) {
      console.error('❌ Erreur création produit:', error.message);
      console.error('❌ Réponse backend:', JSON.stringify(error.response?.data, null, 2));

      let errorMessage = 'Erreur lors de la sauvegarde';
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    
    try {
      const config = getApiConfig();
      
      if (!config || useMockData) {
        const updatedProducts = produits.filter(p => p._id !== id);
        setProduits(updatedProducts);
        saveMockData(STORAGE_KEY_PRODUCTS, updatedProducts);
        toast.success('Produit supprimé (mode démo)');
        return;
      }
      
      await axios.delete(`http://localhost:5001/api/products/${id}`, config);
      toast.success('Produit supprimé');
      await fetchProduits();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // ==================== CRÉATION CONTRAT ====================
  const handleCreateContrat = async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const clientId = form.client.value;
    const quantite = parseFloat(form.quantite.value);
    const dateDebut = form.dateDebut.value;
    const dateFin = form.dateFin.value;
    const conditionsPaiement = form.conditionsPaiement.value;
    
    if (!clientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }
    
    if (!quantite || quantite <= 0) {
      toast.error('Veuillez saisir une quantité valide');
      return;
    }
    
    // Vérifier le stock seulement si stockInitial > 0
    if (selectedProduit.stockInitial > 0 && quantite > selectedProduit.stockInitial) {
      toast.error(`Quantité disponible: ${selectedProduit.stockInitial} ${selectedProduit.unite}`);
      return;
    }
    
    if (!dateDebut || !dateFin) {
      toast.error('Veuillez saisir les dates de début et fin');
      return;
    }
    
    if (new Date(dateFin) <= new Date(dateDebut)) {
      toast.error('La date de fin doit être postérieure à la date de début');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const config = getApiConfig();
      
      const montantTotal = quantite * selectedProduit.prixUnitaire;
      const date = new Date();
      const numeroContrat = `CTV-${selectedProduit.type}-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${Math.floor(Math.random() * 1000)}`;
      
      const contratData = {
        numeroContrat: numeroContrat,
        produit: selectedProduit._id,
        client: clientId,
        quantite: quantite,
        prixUnitaire: selectedProduit.prixUnitaire,
        montantTotal: montantTotal,
        dateDebut: new Date(dateDebut).toISOString(),
        dateFin: new Date(dateFin).toISOString(),
        conditionsPaiement: conditionsPaiement || 'Paiement à 30 jours',
        statut: 'En Cours'
      };

      if (!config || useMockData) {
        const newContrat = {
          ...contratData,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        const updatedContrats = [...contrats, newContrat];
        setContrats(updatedContrats);
        saveMockData(STORAGE_KEY_CONTRATS, updatedContrats);
        
        const updatedProducts = produits.map(p => 
          p._id === selectedProduit._id 
            ? { ...p, stockInitial: p.stockInitial - quantite }
            : p
        );
        setProduits(updatedProducts);
        saveMockData(STORAGE_KEY_PRODUCTS, updatedProducts);
        
        toast.success('Contrat créé avec succès (mode démo)');
        setShowContratModal(false);
        setSelectedProduit(null);
        setIsCreating(false);
        return;
      }

      console.log('📤 Payload envoyé:', contratData);
      const response = await axios.post('http://localhost:5001/api/contrats-vente', contratData, config);
      console.log('✅ Contrat créé:', response.data);

      toast.success('✅ Contrat créé avec succès');
      setShowContratModal(false);
      setSelectedProduit(null);
      await Promise.all([fetchProduits(), fetchContrats()]);

    } catch (error) {
      console.error('❌ Erreur création contrat:', error);
      console.error('❌ Réponse backend:', error.response?.data);

      let errorMessage = 'Erreur lors de la création du contrat';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        // Détails des erreurs de validation Mongoose
        const errors = error.response?.data?.errors;
        if (errors) {
          errorMessage = Object.values(errors).map(e => e.message || e).join(', ');
        } else {
          errorMessage = 'Données invalides. Vérifiez les champs.';
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement du catalogue...</p>
      </div>
    );
  }

  return (
    <div className="catalogue-container">
      {/* Header */}
      <div className="catalogue-header">
        <h1>📋 Catalogue des Produits</h1>
        <p className="subtitle">Consultez les produits pétroliers et leurs contrats de vente associés</p>
        <div className="mode-badge">
          {useMockData}
          {isAdmin && (
            <button 
              className="btn-add-product"
              onClick={() => {
                resetProductForm();
                setShowProductModal(true);
              }}
            >
              + Ajouter un produit
            </button>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{produits.length}</h3>
            <p>Total Produits</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <h3>{contrats.length}</h3>
            <p>Contrats Associés</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{produitsAvecContrats.length}</h3>
            <p>Produits sous contrat</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{produitsSansContrats.length}</h3>
            <p>Produits sans contrat</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="all">Tous les types</option>
            <option value="STEG">STEG - Énergie</option>
            <option value="STIR">STIR - Raffinage</option>
          </select>
        </div>
      </div>

      {/* Grille produits */}
      <div className="catalogue-grid">
        {filteredProduits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Aucun produit trouvé</h3>
            <p>Modifiez vos critères de recherche ou créez un nouveau produit</p>
          </div>
        ) : (
          filteredProduits.map(produit => {
            const produitContrats = getContratsForProduit(produit._id);
            return (
              <div key={produit._id} className={`catalogue-card ${produitContrats.length === 0 ? 'no-contrat' : ''}`}>
                <div className="card-header" style={{ background: `linear-gradient(135deg, ${getCategoryColor(produit.category)} 0%, ${getCategoryColor(produit.category)}cc 100%)` }}>
                  <div className="product-icon">{getProductIcon(produit.nom)}</div>
                  <div className="product-type-badge">{getProduitType(produit)}</div>
                  {isAdmin && (
                    <div className="product-actions-admin">
                      <button 
                        className="btn-edit-product"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(produit);
                          setProductForm({
                            nom: produit.nom,
                            type: produit.type,
                            description: produit.description || '',
                            unite: produit.unite,
                            prixUnitaire: produit.prixUnitaire,
                            stockInitial: produit.stockInitial,
                            category: produit.category || 'Autre'
                          });
                          setShowProductModal(true);
                        }}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete-product"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(produit._id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                <div className="card-body">
                  <div className="product-category-tag" style={{ backgroundColor: `${getCategoryColor(produit.category)}15`, color: getCategoryColor(produit.category) }}>
                    {getCategoryIcon(produit.category)} {produit.category || 'Non catégorisé'}
                  </div>
                  <h3 className="product-name">{produit.nom}</h3>
                  <p className="product-description">{produit.description || 'Aucune description disponible'}</p>
                  
                  <div className="product-details">
                    <div className="detail-item">
                      <span className="detail-label">Code:</span>
                      <span className="detail-value">{produit.codeProduit || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Unité:</span>
                      <span className="detail-value">{produit.unite}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Prix unitaire:</span>
                      <span className="detail-value highlight">{produit.prixUnitaire} DT</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Stock:</span>
                      <span className="detail-value">{produit.stockInitial} {produit.unite}</span>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="contrats-header">
                    <h4>📄 Contrats de vente</h4>
                    <span className="contrats-count">{produitContrats.length} contrat(s)</span>
                  </div>
                  
                  {produitContrats.length > 0 ? (
                    <div className="contrats-list">
                      {produitContrats.map(contrat => {
                        const client = getClientForContrat(contrat.client || contrat.clientId);
                        return (
                          <div 
                            key={contrat._id} 
                            className="contrat-item"
                            onClick={() => {
                              setSelectedContrat(contrat);
                              setSelectedProduit(produit);
                              setShowDetailsModal(true);
                            }}
                          >
                            <div className="contrat-number">{contrat.numeroContrat}</div>
                            <div className="contrat-client">
                              {client?.nom || client?.raisonSociale || 'Client inconnu'}
                            </div>
                            <div className="contrat-stats">
                              <span>{contrat.quantite} {produit.unite}</span>
                              <span>•</span>
                              <span>{contrat.montantTotal?.toLocaleString()} DT</span>
                            </div>
                            {getStatutBadge(contrat.statut)}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-contrat-message">
                      <p>Aucun contrat associé</p>
                      <button 
                        className="btn-create-contrat"
                        onClick={() => {
                          setSelectedProduit(produit);
                          setShowContratModal(true);
                        }}
                      >
                        + Créer un contrat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Produit */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => { setShowProductModal(false); resetProductForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? '✏️ Modifier le produit' : '➕ Ajouter un produit'}</h2>
              <button className="modal-close" onClick={() => { setShowProductModal(false); resetProductForm(); }}>&times;</button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Nom du produit *</label>
                <input type="text" value={productForm.nom} onChange={e => setProductForm({...productForm, nom: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select value={productForm.type} onChange={e => setProductForm({...productForm, type: e.target.value})}>
                    <option value="STEG">STEG</option>
                    <option value="STIR">STIR</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Catégorie</label>
                  <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                    <option value="Gaz Naturel">Gaz Naturel</option>
                    <option value="Électricité">Électricité</option>
                    <option value="Pétrole Brut">Pétrole Brut</option>
                    <option value="Carburants">Carburants</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Lubrifiants">Lubrifiants</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} rows="2" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Unité</label>
                  <select value={productForm.unite} onChange={e => setProductForm({...productForm, unite: e.target.value})}>
                    <option value="m³">m³</option>
                    <option value="L">L</option>
                    <option value="T">T</option>
                    <option value="Bbl">Bbl</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Prix unitaire (DT) *</label>
                  <input type="number" step="0.01" value={productForm.prixUnitaire} onChange={e => setProductForm({...productForm, prixUnitaire: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Stock initial</label>
                  <input type="number" value={productForm.stockInitial} onChange={e => setProductForm({...productForm, stockInitial: e.target.value})} />
                </div>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? '⏳...' : (editingProduct ? 'Modifier' : 'Créer')}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowProductModal(false); resetProductForm(); }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Contrat */}
      {showContratModal && selectedProduit && (
        <div className="modal-overlay" onClick={() => { setShowContratModal(false); setSelectedProduit(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 Créer un contrat de vente</h2>
              <h3 style={{ fontSize: '14px', color: '#666' }}>Pour le produit: {selectedProduit.nom}</h3>
              <button className="modal-close" onClick={() => { setShowContratModal(false); setSelectedProduit(null); }}>&times;</button>
            </div>
            
            <div className="contrat-form-preview">
              <div className="preview-item"><strong>Produit:</strong> {selectedProduit.nom}</div>
              <div className="preview-item"><strong>Prix unitaire:</strong> {selectedProduit.prixUnitaire} DT/{selectedProduit.unite}</div>
              <div className="preview-item"><strong>Stock disponible:</strong> {selectedProduit.stockInitial} {selectedProduit.unite}</div>
            </div>

            <form onSubmit={handleCreateContrat}>
              <div className="form-group">
                <label>Client *</label>
                <select name="client" required defaultValue="">
                  <option value="" disabled>Sélectionner un client</option>
                  {clients.length === 0 ? (
                    <option value="" disabled>⚠️ Aucun client disponible</option>
                  ) : (
                    clients.map((c, i) => (
                      <option key={c._id || `client-${i}`} value={c._id || ''}>
                        {c.raisonSociale || c.nom || c.email} {c.email && `(${c.email})`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantité *</label>
                  <input
                    type="number"
                    name="quantite"
                    step="0.01"
                    required
                    placeholder={`Stock dispo: ${selectedProduit.stockInitial || 'illimité'}`}
                    min="0.01"
                    max={selectedProduit.stockInitial > 0 ? selectedProduit.stockInitial : undefined}
                  />
                  {selectedProduit.stockInitial === 0 && (
                    <small style={{ color: '#dc2626', display: 'block', marginTop: '4px' }}>
                      ⚠️ Stock épuisé - veuillez d'abord réapprovisionner ce produit
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Date début *</label>
                  <input type="date" name="dateDebut" required />
                </div>
                <div className="form-group">
                  <label>Date fin *</label>
                  <input type="date" name="dateFin" required />
                </div>
              </div>

              <div className="form-group">
                <label>Conditions de paiement</label>
                <input type="text" name="conditionsPaiement" placeholder="Ex: Paiement à 30 jours" defaultValue="Paiement à 30 jours" />
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn-primary" disabled={isCreating}>
                  {isCreating ? '⏳ Création...' : '📄 Créer le contrat'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowContratModal(false); setSelectedProduit(null); }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détails Contrat */}
      {showDetailsModal && selectedContrat && selectedProduit && (
        <div className="modal-overlay" onClick={() => { setShowDetailsModal(false); setSelectedContrat(null); setSelectedProduit(null); }}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 Détails du contrat</h2>
              <button className="modal-close" onClick={() => { setShowDetailsModal(false); setSelectedContrat(null); setSelectedProduit(null); }}>&times;</button>
            </div>

            <div className="contrat-details">
              <div className="details-section">
                <h3>Informations générales</h3>
                <div className="details-grid">
                  <div className="detail-row"><span className="label">Numéro contrat:</span><span className="value">{selectedContrat.numeroContrat}</span></div>
                  <div className="detail-row"><span className="label">Statut:</span><span className="value">{getStatutBadge(selectedContrat.statut)}</span></div>
                  <div className="detail-row"><span className="label">Date création:</span><span className="value">{formatDate(selectedContrat.createdAt)}</span></div>
                </div>
              </div>

              <div className="details-section">
                <h3>Produit</h3>
                <div className="details-grid">
                  <div className="detail-row"><span className="label">Nom:</span><span className="value">{selectedProduit.nom}</span></div>
                  <div className="detail-row"><span className="label">Type:</span><span className="value">{selectedProduit.type}</span></div>
                  <div className="detail-row"><span className="label">Catégorie:</span><span className="value">{selectedProduit.category || 'Autre'}</span></div>
                </div>
              </div>

              <div className="details-section">
                <h3>Client</h3>
                <div className="details-grid">
                  <div className="detail-row"><span className="label">Nom:</span><span className="value">{getClientForContrat(selectedContrat.client || selectedContrat.clientId)?.nom || getClientForContrat(selectedContrat.client || selectedContrat.clientId)?.raisonSociale || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Email:</span><span className="value">{getClientForContrat(selectedContrat.client || selectedContrat.clientId)?.email || 'N/A'}</span></div>
                </div>
              </div>

              <div className="details-section">
                <h3>Détails financiers</h3>
                <div className="details-grid">
                  <div className="detail-row"><span className="label">Quantité:</span><span className="value">{selectedContrat.quantite} {selectedProduit.unite}</span></div>
                  <div className="detail-row"><span className="label">Prix unitaire:</span><span className="value">{selectedContrat.prixUnitaire} DT/{selectedProduit.unite}</span></div>
                  <div className="detail-row"><span className="label">Montant total:</span><span className="value highlight">{selectedContrat.montantTotal?.toLocaleString()} DT</span></div>
                </div>
              </div>

              <div className="details-section">
                <h3>Période</h3>
                <div className="details-grid">
                  <div className="detail-row"><span className="label">Date début:</span><span className="value">{formatDate(selectedContrat.dateDebut)}</span></div>
                  <div className="detail-row"><span className="label">Date fin:</span><span className="value">{formatDate(selectedContrat.dateFin)}</span></div>
                  <div className="detail-row"><span className="label">Conditions:</span><span className="value">{selectedContrat.conditionsPaiement || 'Non spécifiées'}</span></div>
                </div>
              </div>
            </div>

            <div className="modal-buttons">
              <button className="btn-secondary" onClick={() => { setShowDetailsModal(false); setSelectedContrat(null); setSelectedProduit(null); }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;