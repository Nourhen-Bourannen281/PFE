// pages/admin/referentiel/TypesFacture.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import '../../../css/TypesFacture.css';

const TypesFacture = () => {
  // Clé pour localStorage
  const STORAGE_KEY = 'types_facture_data';
  
  // État pour le rôle de l'utilisateur
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [typesFacture, setTypesFacture] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    description: '',
    typeClient: 'STEG',
    tva: '',
    devise: 'TND',
    actif: true
  });

  // Liste des types de facture prédéfinis
  const defaultTypesFacture = [
    { id: '1', code: 'FACT-STEG-001', libelle: 'Facture Gaz Naturel', description: 'Facturation du gaz naturel pour usage domestique et industriel', typeClient: 'STEG', tva: 19, devise: 'TND', actif: true },
    { id: '2', code: 'FACT-STEG-002', libelle: 'Facture Électricité', description: 'Facturation de l\'électricité haute et basse tension', typeClient: 'STEG', tva: 19, devise: 'TND', actif: true },
    { id: '3', code: 'FACT-STIR-001', libelle: 'Facture Pétrole Brut', description: 'Facturation du pétrole brut importé et raffiné', typeClient: 'STIR', tva: 19, devise: 'USD', actif: true },
    { id: '4', code: 'FACT-STIR-002', libelle: 'Facture Carburants', description: 'Facturation de l\'essence, gasoil et autres carburants', typeClient: 'STIR', tva: 19, devise: 'TND', actif: true },
    { id: '5', code: 'FACT-STIR-003', libelle: 'Facture Fuel Industriel', description: 'Facturation du fuel pour chauffage industriel', typeClient: 'STIR', tva: 19, devise: 'TND', actif: true },
    { id: '6', code: 'FACT-BOTH-001', libelle: 'Facture Énergie Mixte', description: 'Facturation combinée gaz et électricité', typeClient: 'BOTH', tva: 19, devise: 'TND', actif: true },
    { id: '7', code: 'FACT-EXP-001', libelle: 'Facture Exportation', description: 'Facturation pour l\'exportation de produits énergétiques', typeClient: 'BOTH', tva: 0, devise: 'USD', actif: true }
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
    loadData();
  }, []);

  // Charger les données depuis localStorage
  const loadData = () => {
    setLoading(true);
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      console.log('Données types facture chargées:', savedData);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setTypesFacture(parsedData);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTypesFacture));
        setTypesFacture(defaultTypesFacture);
        toast.info(`${defaultTypesFacture.length} types de facture chargés par défaut`);
      }
    } catch (error) {
      console.error('Erreur chargement types facture:', error);
      toast.error('Erreur lors du chargement des types de facture');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder dans localStorage
  const saveToLocalStorage = (newData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      console.log('✅ Types facture sauvegardés:', newData.length);
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
      code: '',
      libelle: '',
      description: '',
      typeClient: 'STEG',
      tva: '',
      devise: 'TND',
      actif: true
    });
    setEditingType(null);
  };

  // Ouvrir modal pour créer
  const handleCreate = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut ajouter des types de facture.');
      return;
    }
    resetForm();
    setShowModal(true);
  };

  // Ouvrir modal pour modifier
  const handleEdit = (type) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut modifier des types de facture.');
      return;
    }
    setEditingType(type);
    setFormData({
      code: type.code || '',
      libelle: type.libelle || '',
      description: type.description || '',
      typeClient: type.typeClient || 'STEG',
      tva: type.tva || '',
      devise: type.devise || 'TND',
      actif: type.actif !== false
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
    if (!formData.code.trim()) {
      toast.error('Le code est requis');
      return;
    }
    if (!formData.libelle.trim()) {
      toast.error('Le libellé est requis');
      return;
    }

    const newType = {
      id: editingType?.id || Date.now().toString(),
      code: formData.code.trim().toUpperCase(),
      libelle: formData.libelle.trim(),
      description: formData.description || '',
      typeClient: formData.typeClient,
      tva: parseFloat(formData.tva) || 19,
      devise: formData.devise,
      actif: formData.actif
    };

    let newData;
    if (editingType) {
      // MODIFICATION
      newData = typesFacture.map(item => item.id === editingType.id ? newType : item);
      toast.success('Type de facture modifié avec succès!');
    } else {
      // Vérifier doublon de code
      const exists = typesFacture.some(item => item.code === newType.code);
      if (exists) {
        toast.error('Ce code existe déjà!');
        return;
      }
      newData = [...typesFacture, newType];
      toast.success('Type de facture créé avec succès!');
    }

    setTypesFacture(newData);
    saveToLocalStorage(newData);
    setShowModal(false);
    resetForm();
  };

  // Supprimer un type de facture
  const handleDelete = (id, libelle) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut supprimer des types de facture.');
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${libelle}" ?`)) {
      const newData = typesFacture.filter(item => item.id !== id);
      setTypesFacture(newData);
      saveToLocalStorage(newData);
      toast.success('Type de facture supprimé avec succès!');
    }
  };

  // Réinitialiser toutes les données
  const handleReset = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut réinitialiser les données.');
      return;
    }
    
    if (window.confirm('⚠️ Réinitialiser tous les types de facture ? Cette action est irréversible.')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTypesFacture));
      setTypesFacture(defaultTypesFacture);
      toast.success('Types de facture réinitialisés avec succès!');
    }
  };

  // Obtenir le libellé du type client
  const getClientLabel = (typeClient) => {
    switch (typeClient) {
      case 'STEG': return '🏭 STEG';
      case 'STIR': return '⛴️ STIR';
      case 'BOTH': return '🔄 STEG & STIR';
      default: return typeClient;
    }
  };

  // Obtenir l'icône de la devise
  const getDeviseIcon = (devise) => {
    switch (devise) {
      case 'TND': return '💰';
      case 'USD': return '💵';
      case 'EUR': return '💶';
      default: return '💳';
    }
  };

  // Obtenir la couleur du badge de type client
  const getClientBadgeColor = (typeClient) => {
    switch (typeClient) {
      case 'STEG': return '#10b981';
      case 'STIR': return '#f59e0b';
      case 'BOTH': return '#8b5cf6';
      default: return '#6b7280';
    }
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

  // Statistiques calculées dynamiquement
  const stats = useMemo(() => {
    return {
      total: typesFacture.length,
      actifs: typesFacture.filter(t => t.actif !== false).length,
      steg: typesFacture.filter(t => t.typeClient === 'STEG').length,
      stir: typesFacture.filter(t => t.typeClient === 'STIR').length,
      both: typesFacture.filter(t => t.typeClient === 'BOTH').length
    };
  }, [typesFacture]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des types de facture...</p>
      </div>
    );
  }

  return (
    <div className="referentiel-types-facture">
      <div className="page-header">
        <div className="page-header-content">
          <h1>📄 Types de Facture</h1>
          <p className="page-subtitle">Référentiel des types de facturation pour les clients STEG et STIR</p>
          
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
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <h3>Total Types</h3>
            <p>{stats.total}</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Types Actifs</h3>
            <p>{stats.actifs}</p>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">🏭</div>
          <div className="stat-info">
            <h3>STEG</h3>
            <p>{stats.steg}</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⛴️</div>
          <div className="stat-info">
            <h3>STIR</h3>
            <p>{stats.stir}</p>
          </div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <h3>STEG & STIR</h3>
            <p>{stats.both}</p>
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
            + Nouveau Type
          </button>
        ) : (
          <div className="readonly-message">
            <span className="lock-icon">🔒</span>
            <span>Mode consultation seule - Contactez l'administrateur pour modifier</span>
          </div>
        )}
      </div>

      {typesFacture.length === 0 ? (
        <div className="empty-state-full">
          <div className="empty-icon">📄</div>
          <h3>Aucun type de facture</h3>
          <p>Cliquez sur "Nouveau Type" pour ajouter votre premier type de facture</p>
          {isAdmin && (
            <button className="btn-primary" onClick={handleCreate}>
              + Créer un type de facture
            </button>
          )}
        </div>
      ) : (
        <div className="types-grid">
          {typesFacture.map(type => (
            <div key={type.id} className="type-card">
              <div className="type-header">
                <div className="type-icon">📄</div>
                <div className="type-status">
                  <span className={`status-badge ${type.actif ? 'active' : 'inactive'}`}>
                    {type.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              <div className="type-body">
                <div className="type-code">
                  <span className="code-label">Code:</span>
                  <span className="code-value">{type.code}</span>
                </div>
                <h3 className="type-libelle">{type.libelle}</h3>
                {type.description && <p className="type-description">{type.description}</p>}
                <div className="type-details">
                  <div 
                    className="detail-badge" 
                    style={{ backgroundColor: getClientBadgeColor(type.typeClient), color: 'white' }}
                  >
                    {getClientLabel(type.typeClient)}
                  </div>
                  {type.tva !== undefined && (
                    <div className="detail-badge tva">TVA: {type.tva}%</div>
                  )}
                  {type.devise && (
                    <div className="detail-badge devise">
                      {getDeviseIcon(type.devise)} {type.devise}
                    </div>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="type-actions">
                  <button className="btn-edit" onClick={() => handleEdit(type)}>✏️ Modifier</button>
                  <button className="btn-delete" onClick={() => handleDelete(type.id, type.libelle)}>🗑️ Supprimer</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal - uniquement accessible si admin */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingType ? '✏️ Modifier Type de Facture' : '➕ Nouveau Type de Facture'}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Code *</label>
                  <input 
                    type="text" 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                    required 
                    placeholder="Ex: FACT-STEG-001" 
                  />
                </div>
                <div className="form-group">
                  <label>Libellé *</label>
                  <input 
                    type="text" 
                    value={formData.libelle} 
                    onChange={(e) => setFormData({...formData, libelle: e.target.value})} 
                    required 
                    placeholder="Ex: Facture Gaz Naturel" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  rows="3" 
                  placeholder="Description détaillée du type de facture..." 
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Client Concerné *</label>
                  <select 
                    value={formData.typeClient} 
                    onChange={(e) => setFormData({...formData, typeClient: e.target.value})}
                  >
                    <option value="STEG">🏭 STEG - Gaz Naturel et Électricité</option>
                    <option value="STIR">⛴️ STIR - Pétrole Brut et Produits Raffinés</option>
                    <option value="BOTH">🔄 Les deux (STEG & STIR)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Devise *</label>
                  <select 
                    value={formData.devise} 
                    onChange={(e) => setFormData({...formData, devise: e.target.value})}
                  >
                    <option value="TND">💰 Dinar Tunisien (TND)</option>
                    <option value="USD">💵 Dollar Américain (USD)</option>
                    <option value="EUR">💶 Euro (EUR)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>TVA (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formData.tva} 
                    onChange={(e) => setFormData({...formData, tva: e.target.value})} 
                    placeholder="19" 
                    min="0" 
                    max="30" 
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={formData.actif} 
                      onChange={(e) => setFormData({...formData, actif: e.target.checked})} 
                    />
                    Type de facture actif
                  </label>
                </div>
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? '⏳ Enregistrement...' : (editingType ? 'Modifier' : 'Créer')}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
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

export default TypesFacture;