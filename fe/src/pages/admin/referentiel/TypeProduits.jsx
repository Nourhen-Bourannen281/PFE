import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import '../../../css/Ref.css';

function TypeProduits() {
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nom: '', description: '' });

  // Configuration API avec token
  const getApiConfig = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expirée, veuillez vous reconnecter');
      return null;
    }
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }, []);

  // Récupérer les données
  const fetchData = useCallback(async () => {
    try {
      const config = getApiConfig();
      if (!config) return;
      
      const response = await axios.get('http://localhost:5001/api/type-produits', config);
      // Gérer différents formats de réponse
      const typesData = response.data.data || response.data || [];
      setData(typesData);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Erreur lors du chargement des types de produits');
    }
  }, [getApiConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Supprimer un type
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce type de produit ?')) {
      return;
    }
    
    try {
      const config = getApiConfig();
      if (!config) return;
      
      await axios.delete(`http://localhost:5001/api/type-produits/${id}`, config);
      toast.success('Type de produit supprimé avec succès');
      fetchData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Sauvegarder (création ou modification)
  const handleSave = async () => {
    // Validation
    if (!form.nom || !form.nom.trim()) {
      toast.error('Le nom du type de produit est requis');
      return;
    }

    setLoading(true);
    try {
      const config = getApiConfig();
      if (!config) return;

      const dataToSend = {
        nom: form.nom.trim(),
        description: form.description || ''
      };

      if (editingId) {
        await axios.put(`http://localhost:5001/api/type-produits/${editingId}`, dataToSend, config);
        toast.success('Type de produit modifié avec succès');
      } else {
        await axios.post('http://localhost:5001/api/type-produits', dataToSend, config);
        toast.success('Type de produit créé avec succès');
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ nom: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir modal pour modification
  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      nom: item.nom || '',
      description: item.description || ''
    });
    setShowModal(true);
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setForm({ nom: '', description: '' });
    setEditingId(null);
  };

  return (
    <div className="page-pays">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Types Produits</h1>
          <p className="page-subtitle">Gestion des catégories produits</p>
        </div>
      </div>

      <div className="page-actions">
        <button 
          className="btn-primary" 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Nouveau type
        </button>
      </div>

      <div className="table-container">
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '40px' }}>
                    Aucun type de produit trouvé
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item._id}>
                    <td className="cell-text">{item.nom}</td>
                    <td>{item.description || '-'}</td>
                    <td className="cell-actions">
                      <button 
                        className="btn-edit" 
                        onClick={() => handleEdit(item)}
                      >
                        Modifier
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(item._id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Modifier le type de produit' : 'Ajouter un type de produit'}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Nom *</label>
                <input 
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Carburant, Gaz, Lubrifiants"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du type de produit"
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => { setShowModal(false); resetForm(); }}
              >
                Annuler
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? '⏳ Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TypeProduits;