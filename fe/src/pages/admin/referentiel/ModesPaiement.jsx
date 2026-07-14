// pages/admin/referentiel/ModesPaiement.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import '../../../css/ModesPaiement.css';

const ModesPaiement = () => {
  // Clé pour localStorage
  const STORAGE_KEY = 'modes_paiement_data';
  
  // État pour le rôle de l'utilisateur
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ 
    nom: '', 
    code: '', 
    description: '',
    delai: '',
    penalite: '',
    penaliteType: 'pourcentage',
    emailRappel: true,
    joursRappel: 3,
    actif: true 
  });

  // Liste des modes de paiement prédéfinis
  const defaultModesPaiement = [
    { id: '1', nom: 'Virement Bancaire', code: 'VIREMENT', description: 'Transfert électronique de fonds entre comptes bancaires', delai: 2, penalite: 5, penaliteType: 'pourcentage', emailRappel: true, joursRappel: 2, actif: true },
    { id: '2', nom: 'Chèque Bancaire', code: 'CHEQUE', description: 'Ordre de paiement écrit tiré sur un compte bancaire', delai: 3, penalite: 5, penaliteType: 'pourcentage', emailRappel: true, joursRappel: 2, actif: true },
    { id: '3', nom: 'Chèque Certifié', code: 'CHEQUE_CERT', description: 'Chèque garanti par la banque émettrice', delai: 1, penalite: 3, penaliteType: 'pourcentage', emailRappel: true, joursRappel: 1, actif: true },
    { id: '4', nom: 'Lettre de Crédit (LC)', code: 'LC', description: 'Engagement de paiement d\'une banque pour le compte d\'un acheteur', delai: 15, penalite: 10, penaliteType: 'pourcentage', emailRappel: true, joursRappel: 5, actif: true },
    { id: '5', nom: 'Espèces', code: 'ESPECES', description: 'Paiement en espèces', delai: 0, penalite: 0, penaliteType: 'pourcentage', emailRappel: false, joursRappel: 0, actif: true },
    { id: '6', nom: 'Carte Bancaire', code: 'CB', description: 'Paiement par carte bancaire (Visa, Mastercard)', delai: 1, penalite: 2, penaliteType: 'pourcentage', emailRappel: true, joursRappel: 1, actif: true },
    { id: '7', nom: 'Prélèvement Automatique', code: 'PRELEVEMENT', description: 'Prélèvement automatique autorisé par le client', delai: 30, penalite: 10, penaliteType: 'pourcentage', emailRappel: true, joursRappel: 5, actif: true }
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
      console.log('Données modes paiement chargées:', savedData);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultModesPaiement));
        setData(defaultModesPaiement);
        toast.info(`${defaultModesPaiement.length} modes de paiement chargés par défaut`);
      }
    } catch (error) {
      console.error('Erreur chargement modes:', error);
      toast.error('Erreur lors du chargement des modes de paiement');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder dans localStorage
  const saveToLocalStorage = (newData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      console.log('✅ Modes paiement sauvegardés:', newData.length);
      return true;
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
      return false;
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setForm({ 
      nom: '', 
      code: '', 
      description: '',
      delai: '',
      penalite: '',
      penaliteType: 'pourcentage',
      emailRappel: true,
      joursRappel: 3,
      actif: true 
    });
    setEditingId(null);
  };

  // Ouvrir modal pour créer
  const handleCreate = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut ajouter des modes de paiement.');
      return;
    }
    resetForm();
    setShowModal(true);
  };

  // Ouvrir modal pour modifier
  const handleEdit = (item) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut modifier des modes de paiement.');
      return;
    }
    setEditingId(item.id);
    setForm({
      nom: item.nom || '',
      code: item.code || '',
      description: item.description || '',
      delai: item.delai || '',
      penalite: item.penalite || '',
      penaliteType: item.penaliteType || 'pourcentage',
      emailRappel: item.emailRappel !== undefined ? item.emailRappel : true,
      joursRappel: item.joursRappel || 3,
      actif: item.actif !== undefined ? item.actif : true
    });
    setShowModal(true);
  };

  // Sauvegarder (créer ou modifier)
  const handleSave = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut effectuer cette action.');
      setShowModal(false);
      return;
    }

    // Validation
    if (!form.nom.trim()) {
      toast.error('Le nom du mode de paiement est requis');
      return;
    }

    const newMode = {
      id: editingId || Date.now().toString(),
      nom: form.nom.trim(),
      code: form.code.trim() || form.nom.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, ''),
      description: form.description || '',
      delai: parseInt(form.delai) || 0,
      penalite: parseFloat(form.penalite) || 0,
      penaliteType: form.penaliteType,
      emailRappel: form.emailRappel,
      joursRappel: parseInt(form.joursRappel) || 0,
      actif: form.actif
    };

    let newData;
    if (editingId) {
      // MODIFICATION
      newData = data.map(item => item.id === editingId ? newMode : item);
      toast.success('Mode de paiement modifié avec succès!');
    } else {
      // Vérifier doublon de nom
      const exists = data.some(item => item.nom === newMode.nom);
      if (exists) {
        toast.error('Ce mode de paiement existe déjà!');
        return;
      }
      newData = [...data, newMode];
      toast.success('Mode de paiement créé avec succès!');
    }

    setData(newData);
    saveToLocalStorage(newData);
    setShowModal(false);
    resetForm();
  };

  // Supprimer un mode de paiement
  const handleDelete = (id, nom) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut supprimer des modes de paiement.');
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?`)) {
      const newData = data.filter(item => item.id !== id);
      setData(newData);
      saveToLocalStorage(newData);
      toast.success('Mode de paiement supprimé avec succès!');
    }
  };

  // Réinitialiser toutes les données
  const handleReset = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut réinitialiser les données.');
      return;
    }
    
    if (window.confirm('⚠️ Réinitialiser tous les modes de paiement ? Cette action est irréversible.')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultModesPaiement));
      setData(defaultModesPaiement);
      toast.success('Modes de paiement réinitialisés avec succès!');
    }
  };

  // Obtenir l'icône du mode de paiement
  const getPaymentIcon = (nom) => {
    if (nom.includes('Virement')) return '🏦';
    if (nom.includes('Chèque')) return '📝';
    if (nom.includes('Espèces')) return '💵';
    if (nom.includes('Carte')) return '💳';
    if (nom.includes('Crédit')) return '📜';
    if (nom.includes('Prélèvement')) return '🔄';
    return '💳';
  };

  // Afficher la pénalité
  const getPenaltyDisplay = (penalite, penaliteType) => {
    if (!penalite || penalite === 0) return 'Sans pénalité';
    return penaliteType === 'pourcentage' ? `${penalite}% du montant` : `${penalite} DT`;
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

  const modesActifs = data.filter(m => m.actif !== false).length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des modes de paiement...</p>
      </div>
    );
  }

  return (
    <div className="page-modes-paiement">
      <div className="page-header">
        <div className="page-header-content">
          <h1>💳 Gestion des Modes de Paiement</h1>
          <p className="page-subtitle">Référentiel des modes de paiement avec gestion des pénalités de retard</p>
          
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
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <h3>Total Modes</h3>
            <p>{data.length}</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Modes Actifs</h3>
            <p>{modesActifs}</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>Avec Pénalité</h3>
            <p>{data.filter(m => m.penalite > 0).length}</p>
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
            + Nouveau Mode de Paiement
          </button>
        ) : (
          <div className="readonly-message">
            <span className="lock-icon">🔒</span>
            <span>Mode consultation seule - Contactez l'administrateur pour modifier</span>
          </div>
        )}
      </div>

      {/* Grille des modes de paiement */}
      {data.length === 0 ? (
        <div className="empty-state-full">
          <div className="empty-icon">💳</div>
          <h3>Aucun mode de paiement</h3>
          <p>Commencez par ajouter un mode de paiement</p>
          {isAdmin && (
            <button className="btn-primary" onClick={handleCreate}>
              + Ajouter un mode
            </button>
          )}
        </div>
      ) : (
        <div className="modes-grid">
          {data.map(item => (
            <div key={item.id} className="mode-card">
              <div className="mode-header">
                <div className="mode-icon">{getPaymentIcon(item.nom)}</div>
                <div className="mode-status">
                  <span className={`status-badge ${item.actif !== false ? 'active' : 'inactive'}`}>
                    {item.actif !== false ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              <div className="mode-body">
                <h3 className="mode-nom">{item.nom}</h3>
                {item.code && (
                  <div className="mode-code">
                    <span className="code-label">Code:</span>
                    <span className="code-value">{item.code}</span>
                  </div>
                )}
                {item.description && (
                  <p className="mode-description">{item.description}</p>
                )}
                <div className="mode-details">
                  <div className="detail-item">
                    <span className="detail-label">⏱️ Délai:</span>
                    <span className="detail-value">{item.delai} jours</span>
                  </div>
                  {item.penalite > 0 && (
                    <div className="detail-item penalty">
                      <span className="detail-label">⚠️ Pénalité:</span>
                      <span className="detail-value">{getPenaltyDisplay(item.penalite, item.penaliteType)}</span>
                    </div>
                  )}
                  {item.emailRappel && (
                    <div className="detail-item">
                      <span className="detail-label">📧 Rappel:</span>
                      <span className="detail-value">{item.joursRappel} jours avant</span>
                    </div>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="mode-actions">
                  <button className="btn-edit" onClick={() => handleEdit(item)}>
                    ✏️ Modifier
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(item.id, item.nom)}>
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal - uniquement accessible si admin */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? '✏️ Modifier Mode de Paiement' : '➕ Nouveau Mode de Paiement'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nom du mode *</label>
                <input
                  placeholder="Ex: Virement bancaire, Chèque, Espèces..."
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Code</label>
                  <input
                    placeholder="Code unique (ex: VIREMENT)"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="form-group">
                  <label>Délai (jours) *</label>
                  <input
                    type="number"
                    placeholder="Délai de paiement"
                    value={form.delai}
                    onChange={e => setForm({ ...form, delai: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Description détaillée..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows="2"
                />
              </div>

              <div className="section-title">
                <h4>⚠️ Pénalités de retard</h4>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type de pénalité</label>
                  <select
                    value={form.penaliteType}
                    onChange={e => setForm({ ...form, penaliteType: e.target.value })}
                  >
                    <option value="pourcentage">Pourcentage du montant (%)</option>
                    <option value="montant_fixe">Montant fixe (DT)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Pénalité {form.penaliteType === 'pourcentage' ? '(%)' : '(DT)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={form.penaliteType === 'pourcentage' ? "Ex: 10%" : "Ex: 50 DT"}
                    value={form.penalite}
                    onChange={e => setForm({ ...form, penalite: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div className="section-title">
                <h4>📧 Rappels automatiques</h4>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.emailRappel}
                      onChange={e => setForm({ ...form, emailRappel: e.target.checked })}
                    />
                    Envoyer des rappels par email
                  </label>
                </div>
                <div className="form-group">
                  <label>Jours avant échéance</label>
                  <input
                    type="number"
                    placeholder="3"
                    value={form.joursRappel}
                    onChange={e => setForm({ ...form, joursRappel: e.target.value })}
                    min="0"
                    disabled={!form.emailRappel}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.actif}
                    onChange={e => setForm({ ...form, actif: e.target.checked })}
                  />
                  Mode de paiement actif
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {editingId ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModesPaiement;