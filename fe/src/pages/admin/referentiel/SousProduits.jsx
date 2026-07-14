import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../css/Banques.css';
function SousProduits() {
  const [data, setData] = useState([]);
  const [typeProduits, setTypeProduits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nom: '',
    typeProduit: '',
    prixUnitaire: '',
    uniteMesure: 'Litre',
    seuilMin: 100
  });

  const token = localStorage.getItem('token');

  const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/sous-produits');
      setData(res.data);
    } catch (error) {
      console.error('Erreur chargement sous-produits:', error);
    }
  };

  const fetchTypeProduits = async () => {
    try {
      const res = await api.get('/type-produits');
      setTypeProduits(res.data);
    } catch (error) {
      console.error('Erreur chargement types produits:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTypeProduits();
  }, []);

  const handleSave = async () => {
    try {
      if (!form.nom.trim() || !form.typeProduit) {
        alert('Nom et Type de produit sont obligatoires');
        return;
      }

      if (editingId) {
        await api.put(`/sous-produits/${editingId}`, form);
      } else {
        await api.post('/sous-produits', form);
      }

      setShowModal(false);
      setEditingId(null);
      setForm({ nom: '', typeProduit: '', prixUnitaire: '', uniteMesure: 'Litre', seuilMin: 100 });
      fetchData();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      nom: item.nom,
      typeProduit: item.typeProduit?._id || item.typeProduit,
      prixUnitaire: item.prixUnitaire || '',
      uniteMesure: item.uniteMesure,
      seuilMin: item.seuilMin || 100
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce sous-produit ?')) {
      try {
        await api.delete(`/sous-produits/${id}`);
        fetchData();
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="page-contrats">
      <div className="header-contrats">
        <h2>Sous-Produits</h2>
      </div>

      <button 
        className="btn-nouveau"
        onClick={() => {
          setEditingId(null);
          setForm({ nom: '', typeProduit: '', prixUnitaire: '', uniteMesure: 'Litre', seuilMin: 100 });
          setShowModal(true);
        }}
      >
        + Nouveau Sous-Produit
      </button>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type Produit</th>
            <th>Prix Unitaire</th>
            <th>Unité</th>
            <th>Seuil Min</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item._id}>
              <td className="font-medium">{item.nom}</td>
              <td>{item.typeProduit?.nom || '-'}</td>
              <td>{item.prixUnitaire ? `${item.prixUnitaire} TND` : '-'}</td>
              <td>{item.uniteMesure}</td>
              <td>{item.seuilMin}</td>
              <td className="actions">
                <button onClick={() => handleEdit(item)} className="btn-edit">Modifier</button>
                <button onClick={() => handleDelete(item._id)} className="btn-delete">Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingId ? 'Modifier Sous-Produit' : 'Nouveau Sous-Produit'}</h3>

            <div className="form-group">
              <label>Nom du sous-produit *</label>
              <input
                placeholder="Nom"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type de produit *</label>
                <select
                  value={form.typeProduit}
                  onChange={e => setForm({ ...form, typeProduit: e.target.value })}
                >
                  <option value="">Sélectionner un type</option>
                  {typeProduits.map(tp => (
                    <option key={tp._id} value={tp._id}>{tp.nom}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Prix Unitaire (TND)</label>
                <input
                  type="number"
                  placeholder="Prix unitaire"
                  value={form.prixUnitaire}
                  onChange={e => setForm({ ...form, prixUnitaire: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Unité de mesure</label>
                <select
                  value={form.uniteMesure}
                  onChange={e => setForm({ ...form, uniteMesure: e.target.value })}
                >
                  <option value="Litre">Litre</option>
                  <option value="KG">KG</option>
                  <option value="Tonne">Tonne</option>
                  <option value="Unité">Unité</option>
                </select>
              </div>

              <div className="form-group">
                <label>Seuil Minimum Stock</label>
                <input
                  type="number"
                  placeholder="Seuil minimum"
                  value={form.seuilMin}
                  onChange={e => setForm({ ...form, seuilMin: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-save" onClick={handleSave}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SousProduits;