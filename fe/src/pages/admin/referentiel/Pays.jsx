// pages/admin/referentiel/Pays.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import '../../../css/Ref.css';

function Pays() {
  // Clé pour localStorage
  const STORAGE_KEY = 'pays_data';
  
  // État pour le rôle de l'utilisateur
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ code: '', nom: '' });
  const [loading, setLoading] = useState(true);

  // Données initiales
  const getInitialData = () => {
    return [
      { id: '1', code: 'TN', nom: 'Tunisie' },
      { id: '2', code: 'FR', nom: 'France' },
      { id: '3', code: 'DZ', nom: 'Algérie' },
      { id: '4', code: 'MA', nom: 'Maroc' },
    ];
  };

  // Vérifier le rôle de l'utilisateur au chargement
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
      console.log('Données chargées depuis localStorage:', savedData);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
        console.log('Données parsées:', parsedData);
      } else {
        const initialData = getInitialData();
        setData(initialData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
        console.log('Données initiales sauvegardées:', initialData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les données dans localStorage
  const saveToLocalStorage = (newData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      console.log('✅ Données sauvegardées avec succès:', newData);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
      return false;
    }
  };

  // Ouvrir le modal pour créer (seulement si admin)
  const handleCreate = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut ajouter des pays.');
      return;
    }
    setEditingId(null);
    setForm({ code: '', nom: '' });
    setShowModal(true);
  };

  // Ouvrir le modal pour modifier (seulement si admin)
  const handleEdit = (item) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut modifier des pays.');
      return;
    }
    setEditingId(item.id);
    setForm({ code: item.code, nom: item.nom });
    setShowModal(true);
  };

  // Sauvegarder (créer ou modifier) - seulement admin
  const handleSave = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut effectuer cette action.');
      setShowModal(false);
      return;
    }

    // Validation
    if (!form.code.trim()) {
      toast.error('Le code ISO est requis');
      return;
    }
    if (!form.nom.trim()) {
      toast.error('Le nom du pays est requis');
      return;
    }
    if (form.code.length < 2 || form.code.length > 3) {
      toast.error('Le code ISO doit comporter 2 ou 3 lettres');
      return;
    }

    const codeUpper = form.code.toUpperCase().trim();
    const nomTrim = form.nom.trim();

    // Vérifier les doublons
    if (!editingId) {
      const exists = data.some(item => item.code === codeUpper || item.nom === nomTrim);
      if (exists) {
        toast.error('Ce pays existe déjà!');
        return;
      }
    } else {
      const exists = data.some(item => 
        (item.code === codeUpper || item.nom === nomTrim) && item.id !== editingId
      );
      if (exists) {
        toast.error('Ce code ou nom existe déjà!');
        return;
      }
    }

    let newData;
    
    if (editingId) {
      // MODIFICATION
      newData = data.map(item =>
        item.id === editingId
          ? { ...item, code: codeUpper, nom: nomTrim }
          : item
      );
    } else {
      // CRÉATION
      const newId = Date.now().toString();
      newData = [...data, { id: newId, code: codeUpper, nom: nomTrim }];
    }

    // Sauvegarder d'abord dans localStorage
    const saved = saveToLocalStorage(newData);
    
    if (saved) {
      // Mettre à jour l'état
      setData(newData);
      
      // Afficher le message de succès
      if (editingId) {
        toast.success('Pays modifié avec succès!');
      } else {
        toast.success('Pays créé avec succès!');
      }
      
      // Fermer le modal
      setShowModal(false);
      setEditingId(null);
      setForm({ code: '', nom: '' });
      
      // Recharger les données pour confirmer
      setTimeout(() => {
        loadData();
      }, 100);
    }
  };

  // Supprimer un pays - seulement admin
  const handleDelete = (id, nom) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut supprimer des pays.');
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?`)) {
      const newData = data.filter(item => item.id !== id);
      const saved = saveToLocalStorage(newData);
      
      if (saved) {
        setData(newData);
        toast.success('Pays supprimé avec succès!');
        setTimeout(() => {
          loadData();
        }, 100);
      }
    }
  };

  // Réinitialiser toutes les données - seulement admin
  const handleReset = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut réinitialiser les données.');
      return;
    }
    
    if (window.confirm('⚠️ Réinitialiser toutes les données ? Cette action est irréversible.')) {
      const initialData = getInitialData();
      const saved = saveToLocalStorage(initialData);
      
      if (saved) {
        setData(initialData);
        toast.success('Données réinitialisées avec succès!');
        setTimeout(() => {
          loadData();
        }, 100);
      }
    }
  };

  // Vérifier les données dans localStorage (debug)
  const checkLocalStorage = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    console.log('🔍 Vérification localStorage:');
    console.log('Clé:', STORAGE_KEY);
    console.log('Données:', savedData);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log('Nombre de pays:', parsed.length);
      console.log('Liste des pays:', parsed);
    } else {
      console.log('Aucune donnée trouvée dans localStorage');
    }
    toast.info(`LocalStorage contient ${savedData ? JSON.parse(savedData).length : 0} pays`);
  };

  // Fonction pour l'emoji du drapeau
  const getFlagEmoji = (countryCode) => {
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🏳️';
    }
  };

  // Couleur du badge
  const getBadgeColor = (code) => {
    const colors = ['#1a3c5e', '#2c4c6e', '#3d5e7e', '#4e6e8e', '#5f7e9e'];
    const index = code.charCodeAt(0) % colors.length;
    return colors[index];
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des pays...</p>
      </div>
    );
  }

  return (
    <main className="page-pays">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>🌍 Gestion des Pays</h1>
          <p className="page-subtitle">Référentiel des pays disponibles pour les opérations commerciales</p>
          
          {/* Badge de rôle utilisateur */}
          <div className="user-role-badge">
            <span className="role-label" style={{ backgroundColor: getRoleBadgeColor() }}>
              👤 {getRoleLabel()}
            </span>
          </div>
          
          <div className="mode-badge">
            
            {isAdmin && (
              <>
                <button className="btn-reset" onClick={handleReset}>
                  🔄 Réinitialiser
                </button>
                <button className="btn-debug" onClick={checkLocalStorage} title="Vérifier localStorage">
                  🐛 Debug
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">🌍</div>
          <div className="stat-info">
            <h3>Total Pays</h3>
            <p>{data.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-info">
            <h3>Codes ISO</h3>
            <p>{data.length} référencés</p>
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
            + Nouveau Pays
          </button>
        ) : (
          <div className="readonly-message">
            <span className="lock-icon">🔒</span>
            <span>Mode consultation seule - Contactez l'administrateur pour modifier</span>
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="table-container">
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Drapeau</th>
                <th>Code ISO</th>
                <th>Nom du Pays</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="empty-state">
                      <div className="empty-icon">🌍</div>
                      <p>Aucun pays enregistré</p>
                      {isAdmin && (
                        <button className="btn-primary btn-sm" onClick={handleCreate}>
                          + Ajouter un pays
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.map(item => (
                  <tr key={item.id}>
                    <td className="cell-flag">
                      <span className="flag-emoji">{getFlagEmoji(item.code)}</span>
                    </td>
                    <td>
                      <span 
                        className="code-badge" 
                        style={{ backgroundColor: getBadgeColor(item.code) }}
                      >
                        {item.code}
                      </span>
                    </td>
                    <td>
                      <strong>{item.nom}</strong>
                    </td>
                    <td className="cell-actions">
                      {isAdmin ? (
                        <>
                          <button 
                            className="btn-edit"
                            onClick={() => handleEdit(item)}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDelete(item.id, item.nom)}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </>
                      ) : (
                        <span className="readonly-icon" title="Action non autorisée">🔒</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - uniquement accessible si admin */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? '✏️ Modifier le Pays' : '➕ Nouveau Pays'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Code ISO *</label>
                <input
                  type="text"
                  placeholder="Ex: TN, FR, DZ"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  maxLength={3}
                  autoFocus
                />
                <small>Code à 2 ou 3 lettres</small>
              </div>

              <div className="form-group">
                <label>Nom du pays *</label>
                <input
                  type="text"
                  placeholder="Ex: Tunisie, France"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                />
                <small>Nom officiel du pays</small>
              </div>
            </div>

            <div className="modal-actions">
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
    </main>
  );
}

export default Pays;