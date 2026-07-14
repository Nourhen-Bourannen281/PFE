// pages/admin/referentiel/Navires.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import '../../../css/Navires.css';

const Navires = () => {
  // Clé pour localStorage
  const STORAGE_KEY = 'navires_data';
  
  // État pour le rôle de l'utilisateur
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [navires, setNavires] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNavire, setEditingNavire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nom: '', 
    immatriculation: '',
    capacite: '',
    type: 'PETROLIER',
    longueur: '',
    largeur: '',
    tirantEau: '',
    armateur: '',
    paysOrigine: '',
    anneeConstruction: '',
    actif: true
  });

  // Liste des navires prédéfinis
  const defaultNavires = [
    { id: '1', nom: "MT. TANIT", immatriculation: "TN-001", capacite: "50000", type: "PETROLIER", longueur: "228", largeur: "32", tirantEau: "12", armateur: "COTUNAV", paysOrigine: "Tunisie", anneeConstruction: "2010", actif: true },
    { id: '2', nom: "MT. KERKENNAH", immatriculation: "TN-002", capacite: "45000", type: "PETROLIER", longueur: "220", largeur: "32", tirantEau: "11.5", armateur: "COTUNAV", paysOrigine: "Tunisie", anneeConstruction: "2012", actif: true },
    { id: '3', nom: "MT. DJERBA", immatriculation: "TN-003", capacite: "55000", type: "PETROLIER", longueur: "235", largeur: "34", tirantEau: "12.5", armateur: "COTUNAV", paysOrigine: "Tunisie", anneeConstruction: "2015", actif: true },
    { id: '4', nom: "MT. TABARKA", immatriculation: "TN-004", capacite: "40000", type: "PETROLIER", longueur: "210", largeur: "30", tirantEau: "11", armateur: "COTUNAV", paysOrigine: "Tunisie", anneeConstruction: "2018", actif: true },
    { id: '5', nom: "MT. ZARZIS", immatriculation: "TN-005", capacite: "60000", type: "PETROLIER", longueur: "245", largeur: "35", tirantEau: "13", armateur: "COTUNAV", paysOrigine: "Tunisie", anneeConstruction: "2020", actif: true },
    { id: '6', nom: "MT. LA GOULE", immatriculation: "TN-006", capacite: "35000", type: "PETROLIER", longueur: "200", largeur: "28", tirantEau: "10.5", armateur: "STIR", paysOrigine: "Tunisie", anneeConstruction: "2008", actif: true },
    { id: '7', nom: "GNV. HANNIBAL", immatriculation: "TN-007", capacite: "30000", type: "GAZIER", longueur: "195", largeur: "28", tirantEau: "10", armateur: "STEG", paysOrigine: "Tunisie", anneeConstruction: "2019", actif: true },
    { id: '8', nom: "CHE. UTICA", immatriculation: "TN-008", capacite: "25000", type: "CHIMIQUE", longueur: "180", largeur: "26", tirantEau: "9.5", armateur: "TUNIP", paysOrigine: "Tunisie", anneeConstruction: "2021", actif: true }
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
    loadNavires();
  }, []);

  // Charger les navires depuis localStorage
  const loadNavires = () => {
    setLoading(true);
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      console.log('Données navires chargées:', savedData);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setNavires(parsedData);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultNavires));
        setNavires(defaultNavires);
        toast.info(`${defaultNavires.length} navires chargés par défaut`);
      }
    } catch (error) {
      console.error('Erreur chargement navires:', error);
      toast.error('Erreur lors du chargement des navires');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder dans localStorage
  const saveToLocalStorage = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('✅ Navires sauvegardés:', data.length);
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
      immatriculation: '',
      capacite: '',
      type: 'PETROLIER',
      longueur: '',
      largeur: '',
      tirantEau: '',
      armateur: '',
      paysOrigine: '',
      anneeConstruction: '',
      actif: true
    });
    setEditingNavire(null);
  };

  // Ouvrir modal pour créer
  const handleCreate = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut ajouter des navires.');
      return;
    }
    resetForm();
    setShowModal(true);
  };

  // Ouvrir modal pour modifier
  const handleEdit = (navire) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut modifier des navires.');
      return;
    }
    setEditingNavire(navire);
    setFormData({
      nom: navire.nom || '',
      immatriculation: navire.immatriculation || '',
      capacite: navire.capacite || '',
      type: navire.type || 'PETROLIER',
      longueur: navire.longueur || '',
      largeur: navire.largeur || '',
      tirantEau: navire.tirantEau || '',
      armateur: navire.armateur || '',
      paysOrigine: navire.paysOrigine || '',
      anneeConstruction: navire.anneeConstruction || '',
      actif: navire.actif !== undefined ? navire.actif : true
    });
    setShowModal(true);
  };

  // Sauvegarder (créer ou modifier)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut effectuer cette action.');
      setShowModal(false);
      return;
    }

    // Validation
    if (!formData.nom.trim()) {
      toast.error('Le nom du navire est requis');
      return;
    }
    if (!formData.immatriculation.trim()) {
      toast.error("L'immatriculation est requise");
      return;
    }
    if (!formData.capacite || parseFloat(formData.capacite) <= 0) {
      toast.error('La capacité est requise et doit être supérieure à 0');
      return;
    }

    const newNavire = {
      id: editingNavire?.id || Date.now().toString(),
      nom: formData.nom.trim(),
      immatriculation: formData.immatriculation.trim().toUpperCase(),
      capacite: parseFloat(formData.capacite),
      type: formData.type,
      longueur: formData.longueur ? parseFloat(formData.longueur) : null,
      largeur: formData.largeur ? parseFloat(formData.largeur) : null,
      tirantEau: formData.tirantEau ? parseFloat(formData.tirantEau) : null,
      armateur: formData.armateur || '',
      paysOrigine: formData.paysOrigine || '',
      anneeConstruction: formData.anneeConstruction ? parseInt(formData.anneeConstruction) : null,
      actif: formData.actif
    };

    let newData;
    if (editingNavire) {
      // MODIFICATION
      newData = navires.map(item => item.id === editingNavire.id ? newNavire : item);
      toast.success('Navire modifié avec succès!');
    } else {
      // Vérifier doublon immatriculation
      const exists = navires.some(item => item.immatriculation === newNavire.immatriculation);
      if (exists) {
        toast.error('Cette immatriculation existe déjà!');
        return;
      }
      newData = [...navires, newNavire];
      toast.success('Navire ajouté avec succès!');
    }

    setNavires(newData);
    saveToLocalStorage(newData);
    setShowModal(false);
    resetForm();
  };

  // Supprimer un navire
  const handleDelete = (id, nom) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut supprimer des navires.');
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?`)) {
      const newData = navires.filter(item => item.id !== id);
      setNavires(newData);
      saveToLocalStorage(newData);
      toast.success('Navire supprimé avec succès!');
    }
  };

  // Réinitialiser toutes les données
  const handleReset = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut réinitialiser les données.');
      return;
    }
    
    if (window.confirm('⚠️ Réinitialiser tous les navires ? Cette action est irréversible.')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultNavires));
      setNavires(defaultNavires);
      toast.success('Navires réinitialisés avec succès!');
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      'PETROLIER': 'Pétrolier',
      'GAZIER': 'Gazier (LNG/LPG)',
      'CHIMIQUE': 'Chimique',
      'VRAC': 'Vrac'
    };
    return types[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      'PETROLIER': '🛢️',
      'GAZIER': '🔥',
      'CHIMIQUE': '🧪',
      'VRAC': '📦'
    };
    return icons[type] || '⚓';
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

  // Calcul des statistiques
  const totalCapacite = navires.reduce((sum, n) => sum + (n.capacite || 0), 0);
  const naviresPetroliers = navires.filter(n => n.type === 'PETROLIER').length;
  const naviresGaziers = navires.filter(n => n.type === 'GAZIER').length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des navires...</p>
      </div>
    );
  }

  return (
    <div className="referentiel-navires">
      <div className="page-header">
        <div className="page-header-content">
          <h1>⚓ Gestion des Navires Pétroliers</h1>
          <p className="page-subtitle">Flotte navale pour le transport de produits pétroliers et énergétiques</p>
          
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
        <div className="stat-card blue">
          <div className="stat-icon">🚢</div>
          <div className="stat-info">
            <h3>Total Navires</h3>
            <p>{navires.length}</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🛢️</div>
          <div className="stat-info">
            <h3>Navires Pétroliers</h3>
            <p>{naviresPetroliers}</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <h3>Navires Gaziers</h3>
            <p>{naviresGaziers}</p>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Capacité Totale</h3>
            <p>{totalCapacite.toLocaleString()} m³</p>
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
            + Nouveau Navire
          </button>
        ) : (
          <div className="readonly-message">
            <span className="lock-icon">🔒</span>
            <span>Mode consultation seule - Contactez l'administrateur pour modifier</span>
          </div>
        )}
      </div>

      {/* Grille des navires */}
      <div className="navires-grid">
        {navires.length === 0 ? (
          <div className="empty-state-full">
            <div className="empty-icon">⚓</div>
            <h3>Aucun navire</h3>
            <p>Commencez par ajouter un navire</p>
            {isAdmin && (
              <button className="btn-primary" onClick={handleCreate}>
                + Ajouter un navire
              </button>
            )}
          </div>
        ) : (
          navires.map(navire => (
            <div key={navire.id} className="navire-card">
              <div className="navire-header">
                <div className="navire-icon">{getTypeIcon(navire.type)}</div>
                <div className="navire-status">
                  <span className={`status-badge ${navire.actif !== false ? 'active' : 'inactive'}`}>
                    {navire.actif !== false ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              <div className="navire-body">
                <h3 className="navire-nom">{navire.nom}</h3>
                <div className="navire-immatriculation">
                  <span className="label">Immatriculation:</span>
                  <span className="value">{navire.immatriculation}</span>
                </div>
                <div className="navire-details">
                  <div className="detail-item">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{getTypeLabel(navire.type)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Capacité:</span>
                    <span className="detail-value">{navire.capacite?.toLocaleString()} m³</span>
                  </div>
                  {navire.longueur && (
                    <div className="detail-item">
                      <span className="detail-label">Longueur:</span>
                      <span className="detail-value">{navire.longueur} m</span>
                    </div>
                  )}
                  {navire.largeur && (
                    <div className="detail-item">
                      <span className="detail-label">Largeur:</span>
                      <span className="detail-value">{navire.largeur} m</span>
                    </div>
                  )}
                  {navire.anneeConstruction && (
                    <div className="detail-item">
                      <span className="detail-label">Année:</span>
                      <span className="detail-value">{navire.anneeConstruction}</span>
                    </div>
                  )}
                  {navire.armateur && (
                    <div className="detail-item">
                      <span className="detail-label">Armateur:</span>
                      <span className="detail-value">{navire.armateur}</span>
                    </div>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="navire-actions">
                  <button className="btn-edit" onClick={() => handleEdit(navire)}>✏️ Modifier</button>
                  <button className="btn-delete" onClick={() => handleDelete(navire.id, navire.nom)}>🗑️ Supprimer</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Ajout/Modification - uniquement accessible si admin */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          resetForm();
        }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingNavire ? '✏️ Modifier le Navire' : '➕ Ajouter un Navire'}</h2>
              <button className="modal-close" onClick={() => {
                setShowModal(false);
                resetForm();
              }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom du Navire *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    required
                    placeholder="Ex: MT. TANIT"
                  />
                </div>
                <div className="form-group">
                  <label>Immatriculation *</label>
                  <input
                    type="text"
                    value={formData.immatriculation}
                    onChange={(e) => setFormData({...formData, immatriculation: e.target.value.toUpperCase()})}
                    required
                    placeholder="Ex: TN-001"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Capacité (m³) *</label>
                  <input
                    type="number"
                    value={formData.capacite}
                    onChange={(e) => setFormData({...formData, capacite: e.target.value})}
                    required
                    min="0"
                    step="1000"
                    placeholder="Ex: 50000"
                  />
                </div>
                <div className="form-group">
                  <label>Type de Navire *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="PETROLIER">Pétrolier</option>
                    <option value="GAZIER">Gazier (LNG/LPG)</option>
                    <option value="CHIMIQUE">Chimique</option>
                    <option value="VRAC">Vrac</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Longueur (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.longueur}
                    onChange={(e) => setFormData({...formData, longueur: e.target.value})}
                    placeholder="Ex: 228"
                  />
                </div>
                <div className="form-group">
                  <label>Largeur (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.largeur}
                    onChange={(e) => setFormData({...formData, largeur: e.target.value})}
                    placeholder="Ex: 32"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tirant d'Eau (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.tirantEau}
                    onChange={(e) => setFormData({...formData, tirantEau: e.target.value})}
                    placeholder="Ex: 12"
                  />
                </div>
                <div className="form-group">
                  <label>Année Construction</label>
                  <input
                    type="number"
                    value={formData.anneeConstruction}
                    onChange={(e) => setFormData({...formData, anneeConstruction: e.target.value})}
                    min="1900"
                    max="2024"
                    placeholder="Ex: 2010"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Armateur</label>
                  <input
                    type="text"
                    value={formData.armateur}
                    onChange={(e) => setFormData({...formData, armateur: e.target.value})}
                    placeholder="Ex: COTUNAV, STIR, STEG"
                  />
                </div>
                <div className="form-group">
                  <label>Pays d'Origine</label>
                  <input
                    type="text"
                    value={formData.paysOrigine}
                    onChange={(e) => setFormData({...formData, paysOrigine: e.target.value})}
                    placeholder="Ex: Tunisie"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.actif}
                    onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                  />
                  Navire actif
                </label>
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn-primary">
                  {editingNavire ? 'Modifier' : 'Ajouter'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navires;