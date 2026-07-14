import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../../css/GestionStock.css';

const API = 'http://localhost:5001/api';

function GestionStock() {
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [form, setForm] = useState({
    product: '',
    quantity: '',
    seuilMin: 1000,
    alerteActive: true
  });

  const [alertes, setAlertes] = useState([]);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role?.toLowerCase() === 'admin';
  const isCommercial = user.role?.toLowerCase() === 'commercial';
  const canManageStock = isAdmin || isCommercial;

  const getHeaders = () => ({ Authorization: `Bearer ${token}` });

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const extractArray = (res) => {
    if (Array.isArray(res)) return res;
    if (res?.data && Array.isArray(res.data)) return res.data;
    if (res && typeof res === 'object') {
      for (const k of Object.keys(res)) { if (Array.isArray(res[k])) return res[k]; }
    }
    return [];
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const h = { headers: getHeaders() };
      const [stockRes, prodRes] = await Promise.allSettled([
        axios.get(`${API}/stock`, h),
        axios.get(`${API}/products`, h)
      ]);

      const stockData = stockRes.status === 'fulfilled' ? extractArray(stockRes.value.data) : [];
      const prodData = prodRes.status === 'fulfilled' ? extractArray(prodRes.value.data) : [];

      setData(stockData);
      setProducts(prodData);
      setAlertes(stockData.filter(item => item.quantity < item.seuilMin && item.alerteActive));

      if (stockRes.status === 'rejected') addToast('Erreur chargement stock', 'error');
      if (prodRes.status === 'rejected') addToast('Erreur chargement produits', 'error');
    } catch (err) {
      console.error('fetchData error', err);
      addToast('Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setForm({ product: '', quantity: '', seuilMin: 1000, alerteActive: true });
  };

  const hasStock = (productId) =>
    data.some(item => (item.product?._id || item.product) === productId);

  const filteredProducts = products.filter(p =>
    p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.typeProduit?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredData = data.filter(item =>
    item.product?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.typeProduit?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!canManageStock) { addToast('Accès refusé', 'error'); return; }
    if (!editingId && !form.product) { addToast('Veuillez sélectionner un produit', 'error'); return; }
    if (!form.quantity || Number(form.quantity) < 0) { addToast('Quantité invalide', 'error'); return; }

    setLoading(true);
    try {
      const h = { headers: getHeaders() };
      const payload = {
        quantity: parseInt(form.quantity),
        seuilMin: parseInt(form.seuilMin),
        alerteActive: form.alerteActive
      };

      if (editingId) {
        await axios.put(`${API}/stock/${editingId}`, payload, h);
        addToast('Stock modifié avec succès');
      } else {
        await axios.post(`${API}/stock`, { ...payload, product: form.product }, h);
        addToast('Stock ajouté avec succès');
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    if (!canManageStock) { addToast('Accès refusé', 'error'); return; }
    setEditingId(item._id);
    setForm({
      product: item.product?._id || item.product,
      quantity: item.quantity,
      seuilMin: item.seuilMin,
      alerteActive: item.alerteActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!canManageStock) { addToast('Accès refusé', 'error'); return; }
    if (!window.confirm('Supprimer cette entrée de stock ?')) return;
    setLoading(true);
    try {
      await axios.delete(`${API}/stock/${id}`, { headers: getHeaders() });
      addToast('Stock supprimé');
      fetchData();
    } catch  {
      addToast('Erreur lors de la suppression', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (id, newQuantity) => {
    if (!canManageStock) return;
    if (newQuantity < 0) { addToast('Quantité négative impossible', 'error'); return; }
    try {
      await axios.put(`${API}/stock/${id}`, { quantity: parseInt(newQuantity) }, { headers: getHeaders() });
      setData(prev => prev.map(item =>
        item._id === id ? { ...item, quantity: parseInt(newQuantity) } : item
      ));
    } catch  {
      addToast('Erreur mise à jour quantité', 'error');
    }
  };

  const getStockStatusText = (quantity, seuilMin) => {
    if (quantity <= 0) return 'Rupture';
    if (quantity < seuilMin) return 'Stock bas';
    if (quantity < seuilMin * 1.5) return 'Modéré';
    return 'Suffisant';
  };

  const getStockStatusColor = (quantity, seuilMin) => {
    if (quantity <= 0) return '#dc3545';
    if (quantity < seuilMin) return '#ffc107';
    if (quantity < seuilMin * 1.5) return '#17a2b8';
    return '#28a745';
  };

  const formatQuantity = (quantity, unite) => {
    if (unite === 'Litres' && quantity >= 1000) return `${(quantity / 1000).toFixed(2)} m³`;
    return quantity?.toLocaleString('fr-FR') || '0';
  };

  const totalVolume = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockCount = data.filter(item => item.quantity > 0 && item.quantity < item.seuilMin).length;
  const outOfStockCount = data.filter(item => item.quantity <= 0).length;

  if (!canManageStock) {
    return (
      <div className="page-stock">
        <div className="access-denied-container">
          <div className="access-denied-icon">🔒</div>
          <h2>Accès Refusé</h2>
          <p>Seul l'administrateur et le commercial peuvent gérer le stock.</p>
          <p className="user-role">Votre rôle : <strong>{user.role || 'Non défini'}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stock">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && '✓ '}
            {toast.type === 'error' && '✗ '}
            {toast.type === 'info' && 'ℹ '}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="header-stock">
        <div className="header-left">
          <h2>⛽ Gestion du Stock de Carburants</h2>
          <p>Inventaire en temps réel connecté au backend</p>
          <div className="user-info">
            <span className="role-badge">{isAdmin ? '👨‍💼 Administrateur' : '📊 Commercial'}</span>
          </div>
        </div>

        <div className="stock-stats">
          <div className="stat-card">
            <div className="stat-number">{data.length}</div>
            <div className="stat-label">Produits en stock</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalVolume.toLocaleString('fr-FR')}</div>
            <div className="stat-label">Volume total</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-number">{lowStockCount}</div>
            <div className="stat-label">Stock faible</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-number">{outOfStockCount}</div>
            <div className="stat-label">Rupture</div>
          </div>
        </div>

        <button className="btn-nouveau" onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }} disabled={loading}>
          + Ajouter au Stock
        </button>
      </div>

      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="alerte-stock">
          <div className="alerte-header">
            <h3>⚠️ Alertes — Stock Bas ({alertes.length})</h3>
            <button onClick={() => setAlertes([])} className="close-alerts">×</button>
          </div>
          <div className="alertes-list">
            {alertes.map((alerte, i) => (
              <div key={alerte._id || i} className="alerte-item">
                <span className="alerte-icon">⚠️</span>
                <strong>{alerte.product?.nom || 'Produit inconnu'}</strong>
                {' '}— Stock actuel : {formatQuantity(alerte.quantity, alerte.product?.uniteMesure)}
                {' '}(Seuil : {formatQuantity(alerte.seuilMin, alerte.product?.uniteMesure)})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recherche */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Rechercher un produit..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⛽</div>
          <h4>Aucun stock enregistré</h4>
          <p>Commencez par ajouter des produits au stock</p>
          <button className="btn-add-first" onClick={() => setShowModal(true)}>+ Ajouter un stock</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Unité</th>
                <th>Seuil Min.</th>
                <th>Statut</th>
                <th>Mise à jour</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan="8" className="no-results">Aucun résultat pour "{searchTerm}"</td></tr>
              ) : filteredData.map(item => (
                <tr key={item._id} className={item.quantity < item.seuilMin ? 'row-low-stock' : ''}>
                  <td data-label="Produit">
                    <strong>{item.product?.nom || '-'}</strong>
                    {item.product?.code && <span className="product-code"> {item.product.code}</span>}
                  </td>
                  <td data-label="Type">{item.product?.typeProduit?.nom || '-'}</td>
                  <td data-label="Quantité">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => handleUpdateQuantity(item._id, parseInt(e.target.value) || 0)}
                      className="input-quantite"
                      disabled={loading}
                    />
                  </td>
                  <td data-label="Unité">{item.product?.uniteMesure || '-'}</td>
                  <td data-label="Seuil Min." className="text-center">
                    {formatQuantity(item.seuilMin, item.product?.uniteMesure)}
                  </td>
                  <td data-label="Statut" className="text-center">
                    <span className="stock-status-badge" style={{ backgroundColor: getStockStatusColor(item.quantity, item.seuilMin) }}>
                      {getStockStatusText(item.quantity, item.seuilMin)}
                    </span>
                  </td>
                  <td data-label="Mise à jour" className="text-center">
                    {item.updatedAt || item.dateDerniereMiseAJour
                      ? new Date(item.updatedAt || item.dateDerniereMiseAJour).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td data-label="Actions">
                    <button onClick={() => handleEdit(item)} className="btn-edit" disabled={loading} title="Modifier">✏️</button>
                    <button onClick={() => handleDelete(item._id)} className="btn-delete" disabled={loading} title="Supprimer">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? '✏️ Modifier le Stock' : '➕ Ajouter au Stock'}</h3>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>

            <div className="modal-body">
              {!editingId && (
                <div className="form-group">
                  <label>Produit *</label>
                  <select value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}>
                    <option value="">-- Choisir un produit --</option>
                    {filteredProducts.map(p => (
                      <option key={p._id} value={p._id} disabled={hasStock(p._id)}>
                        {p.nom} — {p.typeProduit?.nom || '-'} ({p.uniteMesure})
                        {hasStock(p._id) ? ' (déjà en stock)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingId && (
                <div className="form-group">
                  <label>Produit</label>
                  <div className="info-value">
                    {products.find(p => p._id === form.product)?.nom || '—'}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Quantité *</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  placeholder="Quantité en stock"
                  min="0"
                  step="100"
                />
              </div>

              <div className="form-group">
                <label>Seuil minimum d'alerte</label>
                <input
                  type="number"
                  value={form.seuilMin}
                  onChange={e => setForm({ ...form, seuilMin: parseInt(e.target.value) || 0 })}
                  min="0"
                  step="100"
                />
                <small>Alerte déclenchée si le stock descend en dessous de ce seuil</small>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={form.alerteActive}
                    onChange={e => setForm({ ...form, alerteActive: e.target.checked })}
                  />
                  {' '}Activer les alertes de stock bas
                </label>
              </div>
            </div>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => { setShowModal(false); resetForm(); }} disabled={loading}>Annuler</button>
              <button className="btn-save" onClick={handleSave} disabled={loading}>
                {loading ? 'En cours...' : editingId ? 'Mettre à jour' : 'Ajouter au stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionStock;
