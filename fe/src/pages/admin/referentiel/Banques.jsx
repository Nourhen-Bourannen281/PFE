// pages/admin/referentiel/Banques.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import '../../../css/Banques.css';

function Banques() {
  // Clé pour localStorage
  const STORAGE_KEY = 'banques_data';
  const PAYS_STORAGE_KEY = 'pays_data';
  
  // État pour le rôle de l'utilisateur
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [data, setData] = useState([]);
  const [pays, setPays] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nom: '',
    codeSwift: '',
    adresse: '',
    pays: '',
    telephone: '',
    email: '',
    siteWeb: '',
    actif: true
  });

  // Liste des banques tunisiennes prédéfinies
  const defaultBanques = [
    { id: '1', nom: 'Banque Internationale Arabe de Tunisie (BIAT)', codeSwift: 'BIATTNTT', adresse: 'Immeuble BIAT - Centre Urbain Nord - 1082 Tunis', telephone: '+216 71 144 000', email: 'contact@biat.com.tn', siteWeb: 'www.biat.com.tn', actif: true, paysId: '1' },
    { id: '2', nom: 'Amen Bank', codeSwift: 'AMTNTTTT', adresse: 'Avenue Mohamed V - 1002 Tunis', telephone: '+216 71 340 100', email: 'contact@amenbank.com.tn', siteWeb: 'www.amenbank.com.tn', actif: true, paysId: '1' },
    { id: '3', nom: 'Banque de Tunisie', codeSwift: 'BTBKTNTT', adresse: '2 Rue de Turquie - 1000 Tunis', telephone: '+216 71 259 000', email: 'contact@banquetunisie.com.tn', siteWeb: 'www.banquetunisie.com.tn', actif: true, paysId: '1' },
    { id: '4', nom: 'Société Générale Tunisie (UIB)', codeSwift: 'UIBTTNTT', adresse: 'Rue de la Bourse - 1000 Tunis', telephone: '+216 71 255 000', email: 'contact@uib.com.tn', siteWeb: 'www.uib.com.tn', actif: true, paysId: '1' },
    { id: '5', nom: 'Attijari Bank Tunisie', codeSwift: 'ATTJTNTT', adresse: 'Centre Urbain Nord - 1082 Tunis', telephone: '+216 71 148 000', email: 'contact@attijaribank.com.tn', siteWeb: 'www.attijaribank.com.tn', actif: true, paysId: '1' },
    { id: '6', nom: 'Banque Nationale Agricole (BNA)', codeSwift: 'BNABTNTT', adresse: 'Rue de la Commune - 1000 Tunis', telephone: '+216 71 831 000', email: 'contact@bna.com.tn', siteWeb: 'www.bna.com.tn', actif: true, paysId: '1' },
    { id: '7', nom: 'Zitouna Bank', codeSwift: 'ZITOTNTT', adresse: 'Les Berges du Lac - 1053 Tunis', telephone: '+216 71 961 000', email: 'contact@zitounabank.com.tn', siteWeb: 'www.zitounabank.com.tn', actif: true, paysId: '1' }
  ];

  // Données initiales des pays
  const getInitialPays = () => {
    return [
      { id: '1', code: 'TN', nom: 'Tunisie' },
      { id: '2', code: 'FR', nom: 'France' },
      { id: '3', code: 'DZ', nom: 'Algérie' },
      { id: '4', code: 'MA', nom: 'Maroc' }
    ];
  };

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
    loadPays();
    loadBanques();
  }, []);

  // Charger les pays depuis localStorage
  const loadPays = () => {
    const savedPays = localStorage.getItem(PAYS_STORAGE_KEY);
    if (savedPays) {
      setPays(JSON.parse(savedPays));
    } else {
      const initialPays = getInitialPays();
      localStorage.setItem(PAYS_STORAGE_KEY, JSON.stringify(initialPays));
      setPays(initialPays);
    }
  };

  // Charger les banques depuis localStorage
  const loadBanques = () => {
    setLoading(true);
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      console.log('Données banques chargées:', savedData);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setData(parsedData);
      } else {
        // Initialiser avec les banques par défaut
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBanques));
        setData(defaultBanques);
        toast.info(`${defaultBanques.length} banques chargées par défaut`);
      }
    } catch (error) {
      console.error('Erreur chargement banques:', error);
      toast.error('Erreur lors du chargement des banques');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les banques dans localStorage
  const saveToLocalStorage = (newData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      console.log('✅ Banques sauvegardées:', newData.length);
      return true;
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
      return false;
    }
  };

  // Obtenir le nom du pays par ID
  const getPaysName = (paysId) => {
    const paysItem = pays.find(p => p.id === paysId);
    return paysItem ? paysItem.nom : '';
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setForm({
      nom: '',
      codeSwift: '',
      adresse: '',
      pays: '',
      telephone: '',
      email: '',
      siteWeb: '',
      actif: true
    });
  };

  // Ouvrir modal pour créer
  const handleCreate = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut ajouter des banques.');
      return;
    }
    setEditingId(null);
    resetForm();
    setShowModal(true);
  };

  // Ouvrir modal pour modifier
  const handleEdit = (item) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut modifier des banques.');
      return;
    }
    setEditingId(item.id);
    setForm({
      nom: item.nom,
      codeSwift: item.codeSwift || '',
      adresse: item.adresse || '',
      pays: item.paysId || '',
      telephone: item.telephone || '',
      email: item.email || '',
      siteWeb: item.siteWeb || '',
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
      toast.error('Le nom de la banque est requis');
      return;
    }

    const newBanque = {
      id: editingId || Date.now().toString(),
      nom: form.nom.trim(),
      codeSwift: form.codeSwift?.trim().toUpperCase() || '',
      adresse: form.adresse?.trim() || '',
      paysId: form.pays || '',
      telephone: form.telephone?.trim() || '',
      email: form.email?.trim() || '',
      siteWeb: form.siteWeb?.trim() || '',
      actif: form.actif
    };

    let newData;
    if (editingId) {
      // MODIFICATION
      newData = data.map(item => item.id === editingId ? newBanque : item);
      toast.success('Banque modifiée avec succès!');
    } else {
      // CRÉATION
      // Vérifier doublon
      const exists = data.some(item => item.nom === newBanque.nom);
      if (exists) {
        toast.error('Cette banque existe déjà!');
        return;
      }
      newData = [...data, newBanque];
      toast.success('Banque créée avec succès!');
    }

    // Sauvegarder
    setData(newData);
    saveToLocalStorage(newData);
    
    // Fermer le modal
    setShowModal(false);
    setEditingId(null);
    resetForm();
  };

  // Supprimer une banque
  const handleDelete = (id, nom) => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut supprimer des banques.');
      return;
    }
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?`)) {
      const newData = data.filter(item => item.id !== id);
      setData(newData);
      saveToLocalStorage(newData);
      toast.success('Banque supprimée avec succès!');
    }
  };

  // Réinitialiser toutes les données
  const handleReset = () => {
    if (!isAdmin) {
      toast.error('Accès refusé. Seul l\'administrateur peut réinitialiser les données.');
      return;
    }
    
    if (window.confirm('⚠️ Réinitialiser toutes les banques ? Cette action est irréversible.')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBanques));
      setData(defaultBanques);
      toast.success('Banques réinitialisées avec succès!');
    }
  };

  // Obtenir le logo de la banque
  const getBankLogo = (nom) => {
    const logos = {
      'BIAT': '🏦',
      'Amen Bank': '🏛️',
      'Banque de Tunisie': '💳',
      'Société Générale': '🏦',
      'UIB': '🌍',
      'Attijari': '⭐',
      'BNA': '🌾',
      'Zitouna Bank': '🕌'
    };
    for (const key in logos) {
      if (nom.includes(key)) return logos[key];
    }
    return '🏦';
  };

  // Obtenir les initiales
  const getBankInitials = (nom) => {
    if (nom.includes('BIAT')) return 'BIAT';
    if (nom.includes('Amen')) return 'AB';
    if (nom.includes('Banque de Tunisie')) return 'BT';
    if (nom.includes('UIB')) return 'UIB';
    return nom.substring(0, 2).toUpperCase();
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
        <p>Chargement des banques...</p>
      </div>
    );
  }

  return (
    <div className="page-banques">
      <div className="page-header">
        <div className="page-header-content">
          <h1>🏦 Gestion des Banques</h1>
          <p className="page-subtitle">Référentiel des banques partenaires et institutions financières</p>
          
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
          <div className="stat-icon">🏦</div>
          <div className="stat-info">
            <h3>Total Banques</h3>
            <p>{data.length}</p>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🌍</div>
          <div className="stat-info">
            <h3>Pays concernés</h3>
            <p>{new Set(data.map(b => b.paysId).filter(id => id)).size}</p>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <h3>Codes Swift</h3>
            <p>{data.filter(b => b.codeSwift).length} référencés</p>
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
            + Nouvelle Banque
          </button>
        ) : (
          <div className="readonly-message">
            <span className="lock-icon">🔒</span>
            <span>Mode consultation seule - Contactez l'administrateur pour modifier</span>
          </div>
        )}
      </div>

      {/* Grille des banques */}
      <div className="banques-grid">
        {data.length === 0 ? (
          <div className="empty-state-full">
            <div className="empty-icon">🏦</div>
            <h3>Aucune banque</h3>
            <p>Commencez par ajouter une banque</p>
            {isAdmin && (
              <button className="btn-primary" onClick={handleCreate}>
                + Ajouter une banque
              </button>
            )}
          </div>
        ) : (
          data.map(banque => (
            <div key={banque.id} className="banque-card">
              <div className="banque-header">
                <div className="bank-icon">{getBankLogo(banque.nom)}</div>
                <div className="bank-initials">{getBankInitials(banque.nom)}</div>
                <div className="banque-status">
                  <span className={`status-badge ${banque.actif !== false ? 'active' : 'inactive'}`}>
                    {banque.actif !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="banque-body">
                <h3 className="banque-nom">{banque.nom}</h3>
                {banque.codeSwift && (
                  <div className="banque-swift">
                    <span className="swift-label">Swift:</span>
                    <span className="swift-value">{banque.codeSwift}</span>
                  </div>
                )}
                {banque.paysId && getPaysName(banque.paysId) && (
                  <div className="banque-pays">
                    🌍 {getPaysName(banque.paysId)}
                  </div>
                )}
                {banque.adresse && (
                  <div className="banque-adresse">
                    📍 {banque.adresse}
                  </div>
                )}
                {banque.telephone && (
                  <div className="banque-telephone">
                    📞 {banque.telephone}
                  </div>
                )}
                {banque.email && (
                  <div className="banque-email">
                    📧 {banque.email}
                  </div>
                )}
                {banque.siteWeb && (
                  <div className="banque-site">
                    🌐 {banque.siteWeb}
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="banque-actions">
                  <button className="btn-edit" onClick={() => handleEdit(banque)}>
                    ✏️ Modifier
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(banque.id, banque.nom)}>
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal - uniquement accessible si admin */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? '✏️ Modifier la Banque' : '➕ Nouvelle Banque'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Nom de la banque *</label>
                <input
                  placeholder="Ex: Banque Internationale Arabe de Tunisie (BIAT)"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Code Swift</label>
                  <input
                    placeholder="Ex: BIATTNTT"
                    value={form.codeSwift}
                    onChange={e => setForm({ ...form, codeSwift: e.target.value.toUpperCase() })}
                    maxLength={11}
                  />
                  <small className="input-hint">Code SWIFT/BIC à 8 ou 11 caractères</small>
                </div>

                <div className="form-group">
                  <label>Pays</label>
                  <select
                    value={form.pays}
                    onChange={e => setForm({ ...form, pays: e.target.value })}
                  >
                    <option value="">Sélectionner un pays</option>
                    {pays.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Adresse</label>
                <input
                  placeholder="Adresse complète de la banque"
                  value={form.adresse}
                  onChange={e => setForm({ ...form, adresse: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    placeholder="Ex: +216 71 144 000"
                    value={form.telephone}
                    onChange={e => setForm({ ...form, telephone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="contact@banque.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Site Web</label>
                <input
                  placeholder="www.banque.com"
                  value={form.siteWeb}
                  onChange={e => setForm({ ...form, siteWeb: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.actif}
                    onChange={e => setForm({ ...form, actif: e.target.checked })}
                  />
                  Banque active
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
}

export default Banques;