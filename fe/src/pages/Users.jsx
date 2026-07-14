import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import '../css/Users.css';

// Wrapper pour préfixer toutes les routes avec /api
const api = {
  get:    (path, cfg) => apiService.get(`/api${path}`, cfg),
  post:   (path, data, cfg) => apiService.post(`/api${path}`, data, cfg),
  put:    (path, data, cfg) => apiService.put(`/api${path}`, data, cfg),
  patch:  (path, data, cfg) => apiService.patch(`/api${path}`, data, cfg),
  delete: (path, cfg) => apiService.delete(`/api${path}`, cfg),
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    role: 'Client',
    motDePasse: '',
    code: '',
    adresse: '',
    telephone: ''
  });
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, userId: null, action: null });
  const [loading, setLoading] = useState(true);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      console.log('📥 Réponse API:', res.data);
      
      let usersData = [];
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        usersData = res.data.data;
      } else if (res.data && Array.isArray(res.data)) {
        usersData = res.data;
      } else if (res.data && res.data.users && Array.isArray(res.data.users)) {
        usersData = res.data.users;
      } else {
        usersData = [];
      }
      
      setUsers(usersData);
    } catch (error) {
      console.error('Erreur fetchUsers:', error);
      addToast('Erreur lors du chargement des utilisateurs', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async () => {
    try {
      if (editUser) {
        const updateData = {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          role: form.role,
          code: form.code,
          adresse: form.adresse,
          telephone: form.telephone
        };
        if (form.motDePasse && form.motDePasse.trim()) {
          updateData.motDePasse = form.motDePasse;
        }
        await api.put(`/users/${editUser.id}`, updateData);
        addToast('✅ Utilisateur modifié avec succès', 'success');
      } else {
        if (!form.motDePasse) {
          addToast('❌ Le mot de passe est requis', 'error');
          return;
        }
        if (form.motDePasse.length < 6) {
          addToast('❌ Le mot de passe doit contenir au moins 6 caractères', 'error');
          return;
        }
        await api.post('/users', {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          role: form.role,
          motDePasse: form.motDePasse,
          code: form.code,
          adresse: form.adresse,
          telephone: form.telephone
        });
        addToast('✅ Utilisateur créé avec succès', 'success');
      }
      setShowModal(false);
      setForm({ nom: '', prenom: '', email: '', role: 'Client', motDePasse: '', code: '', adresse: '', telephone: '' });
      fetchUsers();
    } catch (error) {
      console.error('❌ Erreur save:', error);
      console.error('❌ Réponse backend:', error.response?.data);

      let errorMessage = '❌ Une erreur est survenue';
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).map(e => e.message || e).join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = '❌ Données invalides. Vérifiez tous les champs.';
      } else if (error.response?.status === 409) {
        errorMessage = '❌ Cet email existe déjà.';
      }
      addToast(errorMessage, 'error');
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      const action = isActive ? 'deactivate' : 'activate';
      await api.patch(`/users/${id}/${action}`);
      addToast('ℹ️ Statut utilisateur modifié', 'info');
      fetchUsers();
    } catch {
      addToast('❌ Erreur lors du changement de statut', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      addToast('✅ Utilisateur supprimé avec succès', 'success');
      fetchUsers();
    } catch {
      addToast('❌ Erreur lors de la suppression', 'error');
    }
    setConfirmDialog({ show: false, userId: null, action: null });
  };

  const getInitials = (nom, prenom) => {
    return `${nom?.charAt(0) || ''}${prenom?.charAt(0) || ''}`.toUpperCase();
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin': return 'badge-admin';
      case 'Commercial': return 'badge-commercial';
      case 'Client': return 'badge-client';
      case 'Transporteur': return 'badge-transporteur';
      case 'Fournisseur': return 'badge-fournisseur';
      default: return '';
    }
  };

  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    const matchesSearch = 
      `${user.nom || ''} ${user.prenom || ''}`.toLowerCase().includes(search.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }) : [];

  const statsByRole = {
    total: Array.isArray(users) ? users.length : 0,
    Admin: Array.isArray(users) ? users.filter(u => u.role === 'Admin').length : 0,
    Commercial: Array.isArray(users) ? users.filter(u => u.role === 'Commercial').length : 0,
    Client: Array.isArray(users) ? users.filter(u => u.role === 'Client').length : 0,
    Transporteur: Array.isArray(users) ? users.filter(u => u.role === 'Transporteur').length : 0,
    Fournisseur: Array.isArray(users) ? users.filter(u => u.role === 'Fournisseur').length : 0,
  };

  const activeUsers = Array.isArray(users) ? users.filter(user => user.actif).length : 0;
  const inactiveUsers = Array.isArray(users) ? users.filter(user => !user.actif).length : 0;

  if (loading) {
    return (
      <div className="users-page">
        <div className="users-container">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div className="spinner"></div>
            <p>Chargement des utilisateurs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      {/* Toast Notifications - Version Corrigée */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="users-container">
        {/* Header */}
        <div className="users-header">
          <div className="users-header-left">
            <h2>👥 Gestion des Utilisateurs</h2>
            <p>Gérez les comptes et les permissions</p>
          </div>
          <div className="users-stats">
            <div className="stat-card">
              <div className="stat-number">{statsByRole.total}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{activeUsers}</div>
              <div className="stat-label">Actifs</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{inactiveUsers}</div>
              <div className="stat-label">Inactifs</div>
            </div>
          </div>
          <button className="btn-add-user" onClick={() => { 
            setEditUser(null); 
            setForm({ nom: '', prenom: '', email: '', role: 'Client', motDePasse: '', code: '', adresse: '', telephone: '' }); 
            setShowModal(true); 
          }}>
            <span>+</span> Nouvel utilisateur
          </button>
        </div>

        {/* Filtres par rôle */}
        <div className="role-filters">
          <button 
            className={`role-filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            Tous ({statsByRole.total})
          </button>
          <button 
            className={`role-filter-btn admin ${roleFilter === 'Admin' ? 'active' : ''}`}
            onClick={() => setRoleFilter('Admin')}
          >
            👑 Admin ({statsByRole.Admin})
          </button>
          <button 
            className={`role-filter-btn commercial ${roleFilter === 'Commercial' ? 'active' : ''}`}
            onClick={() => setRoleFilter('Commercial')}
          >
            📊 Commercial ({statsByRole.Commercial})
          </button>
          <button 
            className={`role-filter-btn client ${roleFilter === 'Client' ? 'active' : ''}`}
            onClick={() => setRoleFilter('Client')}
          >
            👤 Client ({statsByRole.Client})
          </button>
          <button 
            className={`role-filter-btn transporteur ${roleFilter === 'Transporteur' ? 'active' : ''}`}
            onClick={() => setRoleFilter('Transporteur')}
          >
            🚚 Transporteur ({statsByRole.Transporteur})
          </button>
          <button 
            className={`role-filter-btn fournisseur ${roleFilter === 'Fournisseur' ? 'active' : ''}`}
            onClick={() => setRoleFilter('Fournisseur')}
          >
            🏭 Fournisseur ({statsByRole.Fournisseur})
          </button>
        </div>

        {/* Table */}
        <div className="users-table-wrapper">
          <div className="users-table-toolbar">
            <input
              type="text"
              placeholder="🔍 Rechercher par nom, prénom ou email..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {roleFilter !== 'all' && (
              <button 
                className="clear-filter-btn"
                onClick={() => setRoleFilter('all')}
              >
                ✕ Effacer le filtre
              </button>
            )}
            <span className="filter-info">
              {filteredUsers.length} / {users.length} utilisateur(s)
            </span>
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    {search || roleFilter !== 'all' ? 'Aucun résultat' : 'Aucun utilisateur trouvé'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id || user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar-sm">
                          {getInitials(user.nom, user.prenom)}
                        </div>
                        <div>
                          <div className="user-name">{user.nom} {user.prenom || ''}</div>
                          {user.code && <div className="user-code">Code: {user.code}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role === 'Admin' && '👑 '}
                        {user.role === 'Commercial' && '📊 '}
                        {user.role === 'Client' && '👤 '}
                        {user.role === 'Transporteur' && '🚚 '}
                        {user.role === 'Fournisseur' && '🏭 '}
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-dot ${user.actif ? 'active' : 'inactive'}`}>
                        {user.actif ? '✅ Actif' : '⛔ Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action toggle-active"
                          onClick={() => handleToggle(user.id, user.actif)}
                          title={user.actif ? 'Désactiver' : 'Activer'}
                        >
                          {user.actif ? '🔴' : '🟢'}
                        </button>
                        <button
                          className="btn-action"
                          onClick={() => { 
                            setEditUser(user); 
                            setForm({ 
                              nom: user.nom || '', 
                              prenom: user.prenom || '', 
                              email: user.email || '', 
                              role: user.role || 'Client', 
                              motDePasse: '',
                              code: user.code || '',
                              adresse: user.adresse || '',
                              telephone: user.telephone || ''
                            }); 
                            setShowModal(true); 
                          }}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-action danger"
                          onClick={() => setConfirmDialog({ show: true, userId: user.id, action: 'delete' })}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editUser ? '✏️ Modifier l\'utilisateur' : '➕ Créer un utilisateur'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom *</label>
                <input
                  placeholder="Nom"
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Prénom</label>
                <input
                  placeholder="Prénom"
                  value={form.prenom}
                  onChange={e => setForm({ ...form, prenom: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  placeholder="Téléphone"
                  value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Code</label>
                <input
                  placeholder="Code unique"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Adresse</label>
                <textarea
                  placeholder="Adresse"
                  value={form.adresse}
                  onChange={e => setForm({ ...form, adresse: e.target.value })}
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label>Rôle *</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="Admin">👑 Admin</option>
                  <option value="Commercial">📊 Commercial</option>
                  <option value="Client">👤 Client</option>
                  <option value="Transporteur">🚚 Transporteur</option>
                  <option value="Fournisseur">🏭 Fournisseur</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mot de passe {editUser && '(laisser vide pour ne pas modifier)'}</label>
                <input
                  type="password"
                  placeholder={editUser ? "Nouveau mot de passe" : "Mot de passe requis (min 6 caractères)"}
                  value={form.motDePasse}
                  onChange={e => setForm({ ...form, motDePasse: e.target.value })}
                />
                {!editUser && <small>Le mot de passe doit contenir au moins 6 caractères</small>}
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-save" onClick={handleSave}>
                {editUser ? '💾 Modifier' : '✅ Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <div className="confirm-overlay" onClick={() => setConfirmDialog({ show: false, userId: null, action: null })}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon danger">⚠️</div>
            <h4>Confirmer la suppression</h4>
            <p>Cette action est irréversible. Voulez-vous vraiment supprimer cet utilisateur ?</p>
            <div className="confirm-actions">
              <button className="btn-danger" onClick={() => handleDelete(confirmDialog.userId)}>
                🗑️ Supprimer
              </button>
              <button className="btn-cancel" onClick={() => setConfirmDialog({ show: false, userId: null, action: null })}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}