// pages/admin/referentiel/Ports.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import '../../../css/Ports.css';

const Ports = () => {
  // Clé pour localStorage
  const STORAGE_KEY = 'ports_data';
  
  // État pour le rôle de l'utilisateur
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [ports, setPorts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPort, setEditingPort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    ville: '',
    pays: 'Tunisie',
    type: 'commerce',
    capacite: '',
    latitude: '',
    longitude: '',
    description: '',
    actif: true
  });

  // Liste des ports prédéfinis
  const defaultPorts = [
    { id: '1', nom: 'Port de Rades', code: 'TNRAD', ville: 'Rades', pays: 'Tunisie', type: 'commerce', capacite: 15000000, latitude: 36.7681, longitude: 10.2753, description: 'Principal port de commerce de Tunisie, situé près de Tunis', actif: true },
    { id: '2', nom: 'Port de Sfax', code: 'TNSFA', ville: 'Sfax', pays: 'Tunisie', type: 'commerce', capacite: 8000000, latitude: 34.7333, longitude: 10.7667, description: 'Deuxième port de commerce du pays, important pour l\'exportation de phosphates et d\'huile d\'olive', actif: true },
    { id: '3', nom: 'Port de Sousse', code: 'TNSUS', ville: 'Sousse', pays: 'Tunisie', type: 'commerce', capacite: 4000000, latitude: 35.8333, longitude: 10.6333, description: 'Port majeur pour le commerce et le tourisme dans la région du Sahel', actif: true },
    { id: '4', nom: 'Port de Bizerte', code: 'TNBIZ', ville: 'Bizerte', pays: 'Tunisie', type: 'commerce', capacite: 3000000, latitude: 37.2667, longitude: 9.8667, description: 'Port historique au nord de la Tunisie, important pour le commerce avec l\'Europe', actif: true },
    { id: '5', nom: 'Port de Gabès', code: 'TNGAB', ville: 'Gabès', pays: 'Tunisie', type: 'commerce', capacite: 5000000, latitude: 33.8833, longitude: 10.1000, description: 'Port stratégique pour le sud tunisien, important pour l\'industrie chimique', actif: true },
    { id: '6', nom: 'Port pétrolier de Skhira', code: 'TNSKH', ville: 'Skhira', pays: 'Tunisie', type: 'petrolier', capacite: 25000000, latitude: 34.2833, longitude: 10.0833, description: 'Principal port pétrolier pour l\'exportation de pétrole brut et de produits raffinés', actif: true },
    { id: '7', nom: 'Port pétrolier de Bizerte', code: 'TNBIZP', ville: 'Bizerte', pays: 'Tunisie', type: 'petrolier', capacite: 10000000, latitude: 37.2667, longitude: 9.8667, description: 'Terminal pétrolier stratégique pour le ravitaillement en carburant', actif: true },
    { id: '8', nom: 'Port de La Goulette', code: 'TNLGO', ville: 'La Goulette', pays: 'Tunisie', type: 'petrolier', capacite: 8000000, latitude: 36.8167, longitude: 10.3000, description: 'Port proche de Tunis spécialisé dans le transport de pétrole et de marchandises', actif: true },
    { id: '9', nom: 'Port de Zarzis', code: 'TNZAR', ville: 'Zarzis', pays: 'Tunisie', type: 'industriel', capacite: 2000000, latitude: 33.5000, longitude: 11.1167, description: 'Port industriel pour le commerce régional et l\'exportation de produits locaux', actif: true }
  ];

  // Vérifier le rôle de l'utilisateur
  useEffect(() => {
    const checkUserRole = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token) {
        setUserRole(null);
        setIsAdmin(false);
        return;
      }
      
      try {
        const user = userStr ? JSON.parse(userStr) : null;
        const role = user?.role || localStorage.getItem('role') || '';
        setUserRole(role);
        setIsAdmin(role?.toLowerCase() === 'admin');
      } catch (error) {
        console.error('Erreur lors de la lecture du rôle:', error);
        setUserRole(null);
        setIsAdmin(false);
      }
    };
    
    checkUserRole();
    loadPorts();
  }, []);

  // Charger les ports depuis localStorage
  const loadPorts = () => {
    setLoading(true);
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      console.log('Données ports chargées:', savedData);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setPorts(parsedData);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPorts));
        setPorts(defaultPorts);
        toast.info(`${defaultPorts.length} ports chargés par défaut`);
      }
    } catch (error) {
      console.error('Erreur chargement ports:', error);
      toast.error('Erreur lors du chargement des ports');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder dans localStorage
  const saveToLocalStorage = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('✅ Ports sauvegardés:', data.length);
      return true;
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
      return false;
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      nom: '',
      code: '',
      ville: '',
      pays: 'Tunisie',
      type: 'commerce',
      capacite: '',
      latitude: '',
      longitude: '',
      description: '',
      actif: true
    });
    setEditingPort(null);
  };

  // Générer un code de port automatiquement
  const generatePortCode = (nom) => {
    const prefix = 'PORT';
    const code = nom.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${code}-${random}`;
  };

  // Ouvrir modal pour créer
  const handleCreate = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut ajouter des ports.');
      return;
    }
    resetForm();
    setShowModal(true);
  };

  // Ouvrir modal pour modifier
  const handleEdit = (port) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut modifier des ports.');
      return;
    }
    setEditingPort(port);
    setFormData({
      nom: port.nom || '',
      code: port.code || '',
      ville: port.ville || '',
      pays: port.pays || 'Tunisie',
      type: port.type || 'commerce',
      capacite: port.capacite || '',
      latitude: port.latitude || '',
      longitude: port.longitude || '',
      description: port.description || '',
      actif: port.actif !== undefined ? port.actif : true
    });
    setShowModal(true);
  };

  // Soumettre le formulaire (créer ou modifier)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut effectuer cette action.');
      setShowModal(false);
      return;
    }

    // Validation
    if (!formData.nom.trim()) {
      toast.error('Le nom du port est requis');
      return;
    }
    if (!formData.ville.trim()) {
      toast.error('La ville est requise');
      return;
    }

    const newPort = {
      id: editingPort?.id || Date.now().toString(),
      nom: formData.nom.trim(),
      code: formData.code.trim() || generatePortCode(formData.nom),
      ville: formData.ville.trim(),
      pays: formData.pays || 'Tunisie',
      type: formData.type,
      capacite: formData.capacite ? parseFloat(formData.capacite) : null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      description: formData.description || '',
      actif: formData.actif
    };

    let newData;
    if (editingPort) {
      // MODIFICATION
      newData = ports.map(item => item.id === editingPort.id ? newPort : item);
      toast.success('Port modifié avec succès!');
    } else {
      // Vérifier doublon de nom
      const exists = ports.some(item => item.nom === newPort.nom);
      if (exists) {
        toast.error('Ce port existe déjà!');
        return;
      }
      newData = [...ports, newPort];
      toast.success('Port créé avec succès!');
    }

    setPorts(newData);
    saveToLocalStorage(newData);
    setShowModal(false);
    resetForm();
  };

  // Supprimer un port
  const handleDelete = (id, nom) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut supprimer des ports.');
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?`)) {
      const newData = ports.filter(item => item.id !== id);
      setPorts(newData);
      saveToLocalStorage(newData);
      toast.success('Port supprimé avec succès!');
    }
  };

  // Réinitialiser toutes les données
  const handleReset = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut réinitialiser les données.');
      return;
    }
    
    if (window.confirm('⚠️ Réinitialiser tous les ports ? Cette action est irréversible.')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPorts));
      setPorts(defaultPorts);
      toast.success('Ports réinitialisés avec succès!');
    }
  };

  // Obtenir l'icône du type de port
  const getPortIcon = (type) => {
    const icons = {
      commerce: '🚢',
      industriel: '🏭',
      peche: '🎣',
      touristique: '⛵',
      petrolier: '🛢️'
    };
    return icons[type] || '⚓';
  };

  // Obtenir le label du type de port
  const getPortTypeLabel = (type) => {
    const types = {
      commerce: 'Commerce',
      industriel: 'Industriel',
      peche: 'Pêche',
      touristique: 'Touristique',
      petrolier: 'Pétrolier'
    };
    return types[type] || type;
  };

  // Obtenir la couleur du badge de type
  const getTypeBadgeColor = (type) => {
    const colors = {
      commerce: '#1a3c5e',
      industriel: '#059669',
      peche: '#0784c7',
      touristique: '#7c3aed',
      petrolier: '#ea580c'
    };
    return colors[type] || '#64748b';
  };

  // Obtenir le libellé du rôle
  const getRoleLabel = () => {
    if (!userRole) return 'Non authentifié';
    switch(userRole.toLowerCase()) {
      case 'admin': return 'Administrateur';
      case 'commercial': return 'Commercial';
      case 'client': return 'Client';
      case 'transporteur': return 'Transporteur';
      default: return userRole;
    }
  };

  // Obtenir la couleur du badge de rôle
  const getRoleBadgeColor = () => {
    if (!userRole) return '#ef4444';
    switch(userRole.toLowerCase()) {
      case 'admin': return '#10b981';
      case 'commercial': return '#3b82f6';
      case 'client': return '#f59e0b';
      case 'transporteur': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  // Statistiques
  const portsCommerce = ports.filter(p => p?.type === 'commerce');
  const portsIndustriel = ports.filter(p => p?.type === 'industriel');
  const portsPetrolier = ports.filter(p => p?.type === 'petrolier');
  const portsPeche = ports.filter(p => p?.type === 'peche');
  const portsTouristique = ports.filter(p => p?.type === 'touristique');

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des ports...</p>
      </div>
    );
  }

  return (
    <div className="referentiel-ports">
      <div className="page-header">
        <div className="page-header-content">
          <h1>⚓ Gestion des Ports Maritimes</h1>
          <p className="page-subtitle">Gestion des infrastructures portuaires tunisiennes pour l'export de produits pétroliers et énergétiques</p>
          
          {/* Badge de rôle utilisateur */}
          <div className="user-role-badge">
            <span className="role-label" style={{ backgroundColor: getRoleBadgeColor() }}>
              👤 {getRoleLabel()}
            </span>
          </div>
          
          {isAdmin && (
            <div className="mode-badge">
              <button className="btn-reset" onClick={handleReset}>
                🔄 Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-cards">
        <div className="stat-card commerce">
          <div className="stat-icon">🚢</div>
          <div className="stat-info">
            <h3>Ports de Commerce</h3>
            <p>{portsCommerce.length}</p>
          </div>
        </div>
        <div className="stat-card industriel">
          <div className="stat-icon">🏭</div>
          <div className="stat-info">
            <h3>Ports Industriels</h3>
            <p>{portsIndustriel.length}</p>
          </div>
        </div>
        <div className="stat-card petrolier">
          <div className="stat-icon">🛢️</div>
          <div className="stat-info">
            <h3>Ports Pétroliers</h3>
            <p>{portsPetrolier.length}</p>
          </div>
        </div>
        <div className="stat-card peche">
          <div className="stat-icon">🎣</div>
          <div className="stat-info">
            <h3>Ports de Pêche</h3>
            <p>{portsPeche.length}</p>
          </div>
        </div>
        <div className="stat-card touristique">
          <div className="stat-icon">⛵</div>
          <div className="stat-info">
            <h3>Ports Touristiques</h3>
            <p>{portsTouristique.length}</p>
          </div>
        </div>
        <div className="stat-card total">
          <div className="stat-icon">⚓</div>
          <div className="stat-info">
            <h3>Total Ports</h3>
            <p>{ports.length}</p>
          </div>
        </div>
        {!isAdmin && (
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}>
            <div className="stat-icon">🔒</div>
            <div className="stat-info">
              <h3>Mode Lecture Seule</h3>
              <p>Consultation uniquement</p>
            </div>
          </div>
        )}
      </div>

      {/* Bouton Nouveau - visible uniquement pour l'admin */}
      <div className="page-actions">
        {isAdmin ? (
          <button className="btn-primary" onClick={handleCreate}>
            + Nouveau Port
          </button>
        ) : (
          <div className="readonly-message">
            <span className="lock-icon">🔒</span>
            <span>Mode consultation seule - Contactez l'administrateur pour modifier</span>
          </div>
        )}
      </div>

      {/* Liste des ports */}
      {ports.length === 0 ? (
        <div className="empty-state-full">
          <div className="empty-icon">⚓</div>
          <h3>Aucun port</h3>
          <p>Commencez par ajouter un port</p>
          {isAdmin && (
            <button className="btn-primary" onClick={handleCreate}>
              + Ajouter un port
            </button>
          )}
        </div>
      ) : (
        <div className="ports-grid">
          {ports.map(port => (
            <div key={port.id} className="port-card">
              <div className="port-header" style={{ backgroundColor: getTypeBadgeColor(port.type) }}>
                <div className="port-icon">{getPortIcon(port.type)}</div>
                <div className="port-status">
                  <span className={`status-badge ${port.actif ? 'active' : 'inactive'}`}>
                    {port.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              <div className="port-body">
                <h3 className="port-name">{port.nom}</h3>
                <p className="port-location">
                  📍 {port.ville}, {port.pays}
                </p>
                <div className="port-details">
                  <span className="detail-badge type-badge">
                    {getPortTypeLabel(port.type)}
                  </span>
                  {port.capacite && (
                    <span className="detail-badge capacity-badge">
                      📊 Capacité: {(port.capacite / 1000000).toFixed(1)} M t/an
                    </span>
                  )}
                  {port.code && (
                    <span className="detail-badge code-badge">
                      🏷️ Code: {port.code}
                    </span>
                  )}
                </div>
                {port.description && (
                  <p className="port-description">{port.description}</p>
                )}
                {port.latitude && port.longitude && (
                  <div className="port-coordinates">
                    🗺️ Coordonnées: {port.latitude}°, {port.longitude}°
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="port-actions">
                  <button className="btn-edit" onClick={() => handleEdit(port)}>
                    ✏️ Modifier
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(port.id, port.nom)}>
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de création/modification - uniquement accessible si admin */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          resetForm();
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPort ? '✏️ Modifier le Port' : '➕ Nouveau Port Maritime'}</h2>
              <button className="modal-close" onClick={() => {
                setShowModal(false);
                resetForm();
              }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom du port *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    required
                    placeholder="Ex: Port de Rades, Port de Sfax..."
                  />
                </div>

                <div className="form-group">
                  <label>Code du port</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="Généré automatiquement si vide"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ville *</label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({...formData, ville: e.target.value})}
                    required
                    placeholder="Ex: Tunis, Sfax, Sousse..."
                  />
                </div>

                <div className="form-group">
                  <label>Pays</label>
                  <input
                    type="text"
                    value={formData.pays}
                    onChange={(e) => setFormData({...formData, pays: e.target.value})}
                    placeholder="Tunisie"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type de port *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="commerce">🚢 Commerce</option>
                    <option value="industriel">🏭 Industriel</option>
                    <option value="peche">🎣 Pêche</option>
                    <option value="touristique">⛵ Touristique</option>
                    <option value="petrolier">🛢️ Pétrolier</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Capacité (tonnes/an)</label>
                  <input
                    type="number"
                    value={formData.capacite}
                    onChange={(e) => setFormData({...formData, capacite: e.target.value})}
                    min="0"
                    placeholder="Capacité annuelle en tonnes"
                  />
                  <small className="input-hint">Ex: 15000000 pour 15 millions de tonnes</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    placeholder="Ex: 36.8000"
                  />
                  <small className="input-hint">Coordonnées géographiques (degré décimal)</small>
                </div>

                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    placeholder="Ex: 10.2000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                  placeholder="Description du port, infrastructures, activités principales..."
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.actif}
                    onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                  />
                  Port actif
                </label>
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? '⏳ Enregistrement...' : (editingPort ? '💾 Modifier' : '✅ Créer')}
                </button>
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>
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

export default Ports;