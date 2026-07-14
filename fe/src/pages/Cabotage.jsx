// pages/Cabotage.jsx - Version avec données mockées
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import '../css/Cabotage.css';

// ============================================
// DONNÉES MOCKÉES (mode démo)
// ============================================
const MOCK_NAVIRES = [
  { _id: '1', nom: 'TANIT' },
  { _id: '2', nom: 'KERKENNAH' },
  { _id: '3', nom: 'DJERBA' },
  { _id: '4', nom: 'TABARKA' },
  { _id: '5', nom: 'ZARZIS' }
];

const MOCK_PRODUITS = [
  { _id: '1', nom: 'Gasoil Premium' },
  { _id: '2', nom: 'Gasoil Standard' },
  { _id: '3', nom: 'Essence Sans Plomb' },
  { _id: '4', nom: 'Fuel Lourd' },
  { _id: '5', nom: 'Gaz Naturel' }
];

const MOCK_CABOTAGES = [
  {
    _id: '1',
    numeroCabotage: 'CAB-2024-001',
    dateChargement: '2024-06-01T10:00:00Z',
    client: 'STIR',
    produit: { _id: '1', nom: 'Gasoil Premium' },
    quantite: 25000,
    uniteMesure: 'm³',
    origine: 'Port de Sfax',
    destination: 'Port de Rades',
    navireId: { _id: '1', nom: 'TANIT' },
    statut: 'termine'
  },
  {
    _id: '2',
    numeroCabotage: 'CAB-2024-002',
    dateChargement: '2024-06-05T10:00:00Z',
    client: 'STIR',
    produit: { _id: '2', nom: 'Gasoil Standard' },
    quantite: 18000,
    uniteMesure: 'm³',
    origine: 'Port de Gabès',
    destination: 'Port de Sousse',
    navireId: { _id: '2', nom: 'KERKENNAH' },
    statut: 'en_cours'
  },
  {
    _id: '3',
    numeroCabotage: 'CAB-2024-003',
    dateChargement: '2024-06-10T10:00:00Z',
    client: 'STIR',
    produit: { _id: '3', nom: 'Essence Sans Plomb' },
    quantite: 15000,
    uniteMesure: 'm³',
    origine: 'Port de Bizerte',
    destination: 'Port de Tunis',
    navireId: { _id: '3', nom: 'DJERBA' },
    statut: 'planifie'
  },
  {
    _id: '4',
    numeroCabotage: 'CAB-2024-004',
    dateChargement: '2024-06-12T10:00:00Z',
    client: 'STIR',
    produit: { _id: '4', nom: 'Fuel Lourd' },
    quantite: 30000,
    uniteMesure: 'm³',
    origine: 'Port de Zarzis',
    destination: 'Port de Gabès',
    navireId: { _id: '4', nom: 'TABARKA' },
    statut: 'planifie'
  },
  {
    _id: '5',
    numeroCabotage: 'CAB-2024-005',
    dateChargement: '2024-06-08T10:00:00Z',
    client: 'STIR',
    produit: { _id: '5', nom: 'Gaz Naturel' },
    quantite: 22000,
    uniteMesure: 'm³',
    origine: 'Port de Sousse',
    destination: 'Port de Sfax',
    navireId: { _id: '5', nom: 'ZARZIS' },
    statut: 'en_attente'
  }
];

const Cabotage = () => {
  const [cabotages, setCabotages] = useState([]);
  const [navires, setNavires] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [useMockData, setUseMockData] = useState(true);
  const [formData, setFormData] = useState({
    numeroCabotage: '',
    produit: '',
    client: 'STIR',
    quantite: '',
    origine: '',
    destination: '',
    navireId: '',
    dateChargement: '',
    dateDechargement: ''
  });

  // Configuration API avec token
  const getApiConfig = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fonction pour extraire un tableau depuis la réponse API
  const extractArray = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray(responseData.data)) return responseData.data;
    if (responseData && typeof responseData === 'object') {
      for (const key in responseData) {
        if (Array.isArray(responseData[key])) return responseData[key];
      }
    }
    return [];
  };

  // Charger les données mockées
  const loadMockData = () => {
    setCabotages(MOCK_CABOTAGES);
    setNavires(MOCK_NAVIRES);
    setProducts(MOCK_PRODUITS);
    setLoading(false);
  };

  const fetchCabotages = async () => {
    const config = getApiConfig();
    if (!config) {
      loadMockData();
      return;
    }
    
    try {
      const response = await axios.get('http://localhost:5001/api/cabotage', config);
      const data = extractArray(response.data);
      if (data && data.length > 0) {
        setCabotages(data);
        setUseMockData(false);
      } else {
        setCabotages(MOCK_CABOTAGES);
        setUseMockData(true);
      }
    } catch (err) {
      console.error('Erreur chargement cabotages:', err);
      setCabotages(MOCK_CABOTAGES);
      setUseMockData(true);
    }
  };

  const fetchNavires = async () => {
    const config = getApiConfig();
    if (!config) {
      setNavires(MOCK_NAVIRES);
      return;
    }
    
    try {
      const response = await axios.get('http://localhost:5001/api/navires', config);
      const data = extractArray(response.data);
      if (data && data.length > 0) {
        setNavires(data);
      } else {
        setNavires(MOCK_NAVIRES);
      }
    } catch (err) {
      console.error('Erreur chargement navires:', err);
      setNavires(MOCK_NAVIRES);
    }
  };

  const fetchProducts = async () => {
    const config = getApiConfig();
    if (!config) {
      setProducts(MOCK_PRODUITS);
      return;
    }
    
    try {
      const response = await axios.get('http://localhost:5001/api/products', config);
      const data = extractArray(response.data);
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts(MOCK_PRODUITS);
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      setProducts(MOCK_PRODUITS);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCabotages(), fetchNavires(), fetchProducts()]);
      } catch (error) {
        console.error('Erreur chargement données:', error);
        loadMockData();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Génération automatique du numéro de cabotage
  const generateNumeroCabotage = () => {
    const year = new Date().getFullYear();
    const count = cabotages.length + 1;
    return `CAB-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.produit) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }
    if (!formData.quantite || parseFloat(formData.quantite) <= 0) {
      toast.error('Veuillez entrer une quantité valide');
      return;
    }
    if (!formData.origine) {
      toast.error('Veuillez entrer le port d\'origine');
      return;
    }
    if (!formData.destination) {
      toast.error('Veuillez entrer le port de destination');
      return;
    }
    if (!formData.navireId) {
      toast.error('Veuillez sélectionner un navire');
      return;
    }

    const numeroCabotage = formData.numeroCabotage.trim() || generateNumeroCabotage();

    if (useMockData) {
      // Mode démo - ajout local
      const newCabotage = {
        _id: Date.now().toString(),
        numeroCabotage: numeroCabotage,
        dateChargement: new Date().toISOString(),
        client: formData.client || 'STIR',
        produit: products.find(p => p._id === formData.produit),
        quantite: parseFloat(formData.quantite),
        uniteMesure: 'm³',
        origine: formData.origine,
        destination: formData.destination,
        navireId: navires.find(n => n._id === formData.navireId),
        statut: 'planifie'
      };
      setCabotages([newCabotage, ...cabotages]);
      toast.success('Opération créée avec succès (mode démo)');
      setShowModal(false);
      resetForm();
      return;
    }

    // Mode API réel
    const payload = {
      numeroCabotage: numeroCabotage,
      produit: formData.produit,
      client: formData.client || 'STIR',
      navire:      formData.navireId,
      portDepart:  formData.origine,
      portArrivee: formData.destination,
      dateDepart:  formData.dateChargement || new Date().toISOString().split('T')[0],
      dateArrivee: formData.dateDechargement || undefined,
      statut:      'Planifié'
    };

    try {
      setSubmitting(true);
      const config = getApiConfig();
      if (!config) return;
      
      await axios.post('http://localhost:5001/api/cabotage', payload, config);
      toast.success('Opération créée avec succès');
      setShowModal(false);
      resetForm();
      await fetchCabotages();
    } catch (err) {
      console.error('Erreur création:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numeroCabotage: '',
      produit: '',
      client: 'STIR',
      quantite: '',
      origine: '',
      destination: '',
      navireId: '',
      dateChargement: new Date().toISOString().split('T')[0],
      dateDechargement: ''
    });
  };

  const getStatusLabel = (statut) => {
    const map = { 
      planifie: 'Planifié', 
      en_cours: 'En cours', 
      termine: 'Terminé', 
      annule: 'Annulé',
      en_attente: 'En attente'
    };
    return map[statut] || statut || 'En attente';
  };

  const getStatusClass = (statut) => {
    const map = {
      planifie: 'warning',
      en_cours: 'info',
      termine: 'success',
      annule: 'danger',
      en_attente: 'warning'
    };
    return map[statut] || 'secondary';
  };

  const formatVolume = (value) => {
    return new Intl.NumberFormat('fr-TN').format(value || 0) + ' m³';
  };

  const getClientName = (client) => {
    if (!client) return '-';
    if (typeof client === 'string') return client;
    if (typeof client === 'object' && client.nom) return client.nom;
    return '-';
  };

  const getProductName = (product) => {
    if (!product) return '-';
    if (typeof product === 'string') {
      const found = products.find(p => p._id === product);
      return found ? found.nom : '-';
    }
    if (typeof product === 'object' && product.nom) return product.nom;
    return '-';
  };

  const getNavireName = (navire) => {
    if (!navire) return '-';
    if (typeof navire === 'string') {
      const found = navires.find(n => n._id === navire);
      return found ? found.nom : '-';
    }
    if (typeof navire === 'object' && navire.nom) return navire.nom;
    return '-';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des opérations...</p>
      </div>
    );
  }

  return (
    <div className="cabotage-container">
      {/* Bannière mode démo */}
      {useMockData }

      <div className="page-header">
        <div className="header-info">
          <h1>🚢 Cabotage - Production Nationale Brute (STIR)</h1>
          <p>Gestion des opérations de cabotage maritime</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Nouvelle Opération
        </button>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Total Opérations</h3>
            <p>{cabotages.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⛴️</div>
          <div className="stat-info">
            <h3>Volume Total</h3>
            <p>{formatVolume(cabotages.reduce((sum, c) => sum + (c.quantite || 0), 0))}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Moyenne par Opération</h3>
            <p>{cabotages.length > 0 ? formatVolume(cabotages.reduce((sum, c) => sum + (c.quantite || 0), 0) / cabotages.length) : '0 m³'}</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Opération</th>
              <th>Date</th>
              <th>Client</th>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Origine → Destination</th>
              <th>Navire</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {cabotages.length > 0 ? (
              cabotages.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.numeroCabotage || 'N/A'}</strong></td>
                  <td>{formatDate(c.dateChargement || c.createdAt)}</td>
                  <td>{getClientName(c.client)}</td>
                  <td>{getProductName(c.produit)}</td>
                  <td>{formatVolume(c.quantite)}</td>
                  <td>{c.origine || '-'} → {c.destination || '-'}</td>
                  <td>{getNavireName(c.navireId || c.navire)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(c.statut)}`}>
                      {getStatusLabel(c.statut)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="no-data-row">
                <td colSpan="8">
                  <div className="no-data">
                    📭 Aucune opération de cabotage trouvée
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Nouvelle Opération de Cabotage</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Numéro d'opération</label>
                  <input 
                    type="text" 
                    placeholder="Ex: CAB-2024-001 (laissez vide pour auto-génération)" 
                    value={formData.numeroCabotage} 
                    onChange={(e) => setFormData({...formData, numeroCabotage: e.target.value})} 
                  />
                  <small className="form-hint">Laissez vide pour génération automatique</small>
                </div>
                <div className="form-group">
                  <label>Produit *</label>
                  <select 
                    value={formData.produit} 
                    onChange={(e) => setFormData({...formData, produit: e.target.value})} 
                    required
                  >
                    <option value="">Sélectionner un produit</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.nom}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantité (m³) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Quantité en m³" 
                    value={formData.quantite} 
                    onChange={(e) => setFormData({...formData, quantite: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Navire *</label>
                  <select 
                    value={formData.navireId} 
                    onChange={(e) => setFormData({...formData, navireId: e.target.value})} 
                    required
                  >
                    <option value="">Sélectionner un navire</option>
                    {navires.map(n => <option key={n._id} value={n._id}>{n.nom}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Origine *</label>
                  <input 
                    type="text" 
                    placeholder="Port d'origine" 
                    value={formData.origine} 
                    onChange={(e) => setFormData({...formData, origine: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Destination *</label>
                  <input 
                    type="text" 
                    placeholder="Port de destination" 
                    value={formData.destination} 
                    onChange={(e) => setFormData({...formData, destination: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date de chargement</label>
                  <input 
                    type="date" 
                    value={formData.dateChargement} 
                    onChange={(e) => setFormData({...formData, dateChargement: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Date de déchargement</label>
                  <input 
                    type="date" 
                    value={formData.dateDechargement} 
                    onChange={(e) => setFormData({...formData, dateDechargement: e.target.value})} 
                  />
                </div>
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? '⏳ Enregistrement...' : '✅ Enregistrer'}
                </button>
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)} disabled={submitting}>
                  ❌ Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cabotage;