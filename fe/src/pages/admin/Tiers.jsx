// pages/admin/Tiers.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import '../../css/Tiers.css';

const API_BASE_URL = 'http://localhost:5001/api'; // ✅ port 5000

// ✅ FIX: MongoDB renvoie type en STRING ("0","1") → normaliser en Number
const toNum = (v) => Number(v);

const TYPE_MAP = {
  0: { label: 'Client',      css: 'badge-client',      icon: '👤' },
  1: { label: 'Fournisseur', css: 'badge-fournisseur', icon: '🏭' },
};

const MOCK_PAYS    = [
  { _id: '1', nom: 'Tunisie' }, { _id: '2', nom: 'France' },
  { _id: '3', nom: 'Algérie' }, { _id: '4', nom: 'Maroc' },
];
const MOCK_BANQUES = [
  { _id: '1', nom: 'BIAT' },            { _id: '2', nom: 'Amen Bank' },
  { _id: '3', nom: 'STB' },             { _id: '4', nom: 'Attijari Bank' },
  { _id: '5', nom: 'Arab Tunisian Bank' },
];
const MOCK_TIERS = [
  {
    _id: 'C1', type: 0,
    raisonSociale: 'STEG – Société Tunisienne de l\'Électricité et du Gaz',
    email: 'achats@steg.com.tn', telephone: '+216 71 341 311',
    matriculeFiscale: '0000001C', adresse: 'Rue Tahar Ben Achour, 1001 Tunis',
    pays: { _id: '1', nom: 'Tunisie' }, banque: { _id: '3', nom: 'STB' },
  },
  {
    _id: 'C2', type: 0,
    raisonSociale: 'STIR – Société Tuniso-Italienne de Raffinage',
    email: 'direction@stir.com.tn', telephone: '+216 72 477 000',
    matriculeFiscale: '0000002C', adresse: 'Zarzouna, Bizerte',
    pays: { _id: '1', nom: 'Tunisie' }, banque: { _id: '2', nom: 'Amen Bank' },
  },
  {
    _id: 'C3', type: 0,
    raisonSociale: 'GPC – Groupement Pétrolier de Clients',
    email: 'contact@gpc.com.tn', telephone: '+216 73 654 321',
    matriculeFiscale: '0000003C', adresse: 'Zone Industrielle, Sfax',
    pays: { _id: '1', nom: 'Tunisie' }, banque: { _id: '1', nom: 'BIAT' },
  },
  {
    _id: 'F1', type: 1,
    raisonSociale: 'TotalEnergies Marketing Tunisie',
    email: 'approvisionnement@total.com.tn', telephone: '+216 70 020 020',
    matriculeFiscale: '1000001F', adresse: 'Les Berges du Lac II, Tunis',
    pays: { _id: '1', nom: 'Tunisie' }, banque: { _id: '5', nom: 'Arab Tunisian Bank' },
  },
  {
    _id: 'F2', type: 1,
    raisonSociale: 'Schlumberger Oilfield Services',
    email: 'tn.services@slb.com', telephone: '+216 75 230 100',
    matriculeFiscale: '1000002F', adresse: 'Route de Gabès, Sfax',
    pays: { _id: '1', nom: 'Tunisie' }, banque: { _id: '4', nom: 'Attijari Bank' },
  },
  {
    _id: 'F3', type: 1,
    raisonSociale: 'Halliburton Tunisia SARL',
    email: 'contact@halliburton.tn', telephone: '+216 71 900 123',
    matriculeFiscale: '1000003F', adresse: 'Centre Urbain Nord, Tunis',
    pays: { _id: '1', nom: 'Tunisie' }, banque: { _id: '2', nom: 'Amen Bank' },
  },
];

const TYPE_STR = { 0: 'Client', 1: 'Fournisseur', 2: 'Transporteur' };

const EMPTY_FORM = {
  raisonSociale: '', type: 0, adresse: '',
  email: '', telephone: '', matriculeFiscale: '',
  pays: '', banque: '', code: '',
};

function Tiers() {
  const [data,       setData]       = useState([]);
  const [pays,       setPays]       = useState([]);
  const [banques,    setBanques]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showModal,  setShowModal]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  const token = getToken();

  // ✅ FIX BOUCLE INFINIE: useMemo au lieu de useState + useEffect
  const isAdmin = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const r = (localStorage.getItem('role') || user.role || '').toLowerCase();
      return r === 'admin' || r === 'administrateur';
    } catch { return false; }
  }, []);

  const api = useMemo(() => {
    if (!token) return null;
    return axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const extractArray = useCallback((res) => {
    if (Array.isArray(res))       return res;
    if (Array.isArray(res?.data)) return res.data;
    if (typeof res === 'object') {
      for (const k in res) if (Array.isArray(res[k])) return res[k];
    }
    return [];
  }, []);

  const normalizeTiers = useCallback(
    (list) => list.map(t => ({ ...t, type: toNum(t.type) })), []
  );

  const loadMock = useCallback(() => {
    setIsDemoMode(true);
    setPays(MOCK_PAYS);
    setBanques(MOCK_BANQUES);
    setData(normalizeTiers(MOCK_TIERS));
  }, [normalizeTiers]);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (!token || !api) { loadMock(); setLoading(false); return; }
    try {
      const [t, p, b] = await Promise.all([
        api.get('/tiers'), api.get('/pays'), api.get('/banques'),
      ]);
      setData(normalizeTiers(extractArray(t.data)));
      setPays(extractArray(p.data));
      setBanques(extractArray(b.data));
      setIsDemoMode(false);
    } catch {
      loadMock();
    } finally { setLoading(false); }
  }, [api, token, extractArray, loadMock, normalizeTiers]);

  useEffect(() => { loadData(); }, [loadData]);

  const refreshTiers = useCallback(async () => {
    if (isDemoMode || !api) return;
    try {
      const res = await api.get('/tiers');
      setData(normalizeTiers(extractArray(res.data)));
    } catch { /* silencieux */ }
  }, [api, isDemoMode, extractArray, normalizeTiers]);

  const counts = useMemo(() => ({
    all:         data.length,
    client:      data.filter(d => d.type === 0).length,
    fournisseur: data.filter(d => d.type === 1).length,
  }), [data]);

  const filteredData = useMemo(() => {
    if (filterType === 'client')      return data.filter(d => d.type === 0);
    if (filterType === 'fournisseur') return data.filter(d => d.type === 1);
    return data;
  }, [data, filterType]);

  const resetForm = useCallback(() => setForm(EMPTY_FORM), []);
  const setField  = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const openAdd  = () => { setEditingId(null); resetForm(); setShowModal(true); };
  const openEdit = (item) => {
    if (!isAdmin) { showToast('⛔ Accès réservé à l\'administrateur', 'error'); return; }
    setEditingId(item._id);
    setForm({
      raisonSociale:    item.raisonSociale    || '',
      type:             toNum(item.type),
      adresse:          item.adresse          || '',
      email:            item.email            || '',
      telephone:        item.telephone        || '',
      matriculeFiscale: item.matriculeFiscale || '',
      pays:             item.pays?._id  || item.pays  || '',
      banque:           item.banque?._id || item.banque || '',
      code:             item.code             || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.raisonSociale.trim()) {
      showToast('La raison sociale est obligatoire', 'error'); return;
    }
    setSaving(true);
    try {
      const paysObj   = pays.find(p => p._id === form.pays)     || null;
      const banqueObj = banques.find(b => b._id === form.banque) || null;
      const typeStr   = TYPE_STR[toNum(form.type)] || 'Client';
      const autoCode  = form.code?.trim()
        || form.matriculeFiscale?.trim()
        || `${typeStr.toUpperCase().slice(0, 3)}-${Date.now().toString(36).toUpperCase()}`;
      const payload   = { ...form, type: typeStr, code: autoCode };

      if (isDemoMode) {
        const record = { _id: editingId || String(Date.now()), ...payload, pays: paysObj, banque: banqueObj };
        setData(prev =>
          editingId ? prev.map(d => d._id === editingId ? record : d) : [record, ...prev]
        );
        showToast(editingId ? 'Tiers modifié (démo)' : 'Tiers ajouté (démo)');
      } else {
        editingId
          ? await api.put(`/tiers/${editingId}`, payload)
          : await api.post('/tiers', payload);
        showToast(editingId ? 'Tiers modifié avec succès' : 'Tiers ajouté avec succès');
        await refreshTiers();
      }
      setShowModal(false); setEditingId(null); resetForm();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) { showToast('⛔ Accès réservé à l\'administrateur', 'error'); return; }
    if (!window.confirm('Confirmer la suppression de ce tiers ?')) return;
    try {
      if (isDemoMode) {
        setData(prev => prev.filter(d => d._id !== id));
        showToast('Tiers supprimé (démo)');
      } else {
        await api.delete(`/tiers/${id}`);
        showToast('Tiers supprimé avec succès');
        await refreshTiers();
      }
    } catch { showToast('Erreur lors de la suppression', 'error'); }
  };

  if (loading) {
    return (
      <div className="tiers-page">
        <div className="tiers-loading">
          <div className="tiers-spinner" /><p>Chargement des tiers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tiers-page">
      {toast && <div className={`tiers-toast tiers-toast-${toast.type}`}>{toast.msg}</div>}

      <div className="tiers-header">
        <div className="tiers-header-left">
          <span className="tiers-header-icon">🛢️</span>
          <div>
            <span className="tiers-company-name">SMART-TRADE 360°</span>
            <h1>Gestion des Tiers</h1>
            <p>Entreprise Tunisienne d'Activités Pétrolières · Clients &amp; Fournisseurs</p>
          </div>
        </div>
        <div className="tiers-header-right">
          {isDemoMode && <span className="tiers-demo-tag">⚡ Démo</span>}
          <span className={`tiers-role-tag ${isAdmin ? 'role-admin' : 'role-read'}`}>
            {isAdmin ? '👑 Administrateur' : '🔒 Lecture seule'}
          </span>
          {isAdmin && (
            <button className="btn-nouveau-tiers" onClick={openAdd}>+ Nouveau Tiers</button>
          )}
        </div>
      </div>

      <div className="tiers-legend">
        <div className="legend-item">
          <span className="tiers-type-badge badge-client">👤 Client</span>
          <span>Entité qui <strong>achète</strong> à SMART-TRADE 360° · valeur <code>0</code></span>
        </div>
        <span className="legend-sep">·</span>
        <div className="legend-item">
          <span className="tiers-type-badge badge-fournisseur">🏭 Fournisseur</span>
          <span>Entité qui <strong>fournit</strong> des biens/services à SMART-TRADE 360° · valeur <code>1</code></span>
        </div>
      </div>

      <div className="tiers-stats">
        <div className="tiers-stat-card tiers-stat-all">
          <span>📋</span>
          <div><div className="tiers-stat-num">{counts.all}</div><div className="tiers-stat-lbl">Total tiers</div></div>
        </div>
        <div className="tiers-stat-card tiers-stat-client">
          <span>👤</span>
          <div><div className="tiers-stat-num">{counts.client}</div><div className="tiers-stat-lbl">Clients <code>(0)</code></div></div>
        </div>
        <div className="tiers-stat-card tiers-stat-four">
          <span>🏭</span>
          <div><div className="tiers-stat-num">{counts.fournisseur}</div><div className="tiers-stat-lbl">Fournisseurs <code>(1)</code></div></div>
        </div>
      </div>

      <div className="tiers-filters">
        {[
          { key: 'all',         label: 'Tous',                     count: counts.all         },
          { key: 'client',      label: '👤 Clients (type 0)',      count: counts.client      },
          { key: 'fournisseur', label: '🏭 Fournisseurs (type 1)', count: counts.fournisseur },
        ].map(f => (
          <button key={f.key}
            className={`tiers-filter-btn filter-${f.key} ${filterType === f.key ? 'active' : ''}`}
            onClick={() => setFilterType(f.key)}>
            {f.label} <span className="tiers-filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      <div className="tiers-table-wrap">
        {filteredData.length === 0 ? (
          <div className="tiers-empty"><span>📭</span><p>Aucun tiers trouvé</p></div>
        ) : (
          <table className="tiers-table">
            <thead>
              <tr>
                <th>Type</th><th>Raison Sociale</th><th>Email</th>
                <th>Téléphone</th><th>Matricule Fiscale</th><th>Pays</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => {
                const info = TYPE_MAP[item.type] ?? TYPE_MAP[0];
                return (
                  <tr key={item._id}>
                    <td><span className={`tiers-type-badge ${info.css}`}>{info.icon} {info.label}</span></td>
                    <td className="tiers-raison">{item.raisonSociale}</td>
                    <td className="tiers-email">{item.email || '—'}</td>
                    <td>{item.telephone || '—'}</td>
                    <td className="tiers-mono">{item.matriculeFiscale || '—'}</td>
                    <td>{item.pays?.nom || '—'}</td>
                    {isAdmin && (
                      <td className="tiers-actions">
                        <button className="btn-edit-tiers"   onClick={() => openEdit(item)}         title="Modifier">✏️</button>
                        <button className="btn-delete-tiers" onClick={() => handleDelete(item._id)} title="Supprimer">🗑️</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && isAdmin && (
        <div className="tiers-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="tiers-modal" onClick={e => e.stopPropagation()}>
            <div className="tiers-modal-header">
              <div>
                <h2>{editingId ? '✏️ Modifier le tiers' : '➕ Nouveau tiers'}</h2>
                <p>SMART-TRADE 360° · Entreprise Tunisienne d'Activités Pétrolières</p>
              </div>
              <button className="tiers-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="tiers-modal-body">
              <div className="tiers-form-group">
                <label>Type · Client = <code>0</code> · Fournisseur = <code>1</code></label>
                <div className="tiers-type-toggle">
                  <button type="button"
                    className={`type-toggle-btn ${toNum(form.type) === 0 ? 'active-client' : ''}`}
                    onClick={() => setField('type', 0)}>
                    <span className="ttb-icon">👤</span>
                    <span className="ttb-label">Client</span>
                    <span className="ttb-code">type = 0</span>
                  </button>
                  <button type="button"
                    className={`type-toggle-btn ${toNum(form.type) === 1 ? 'active-fournisseur' : ''}`}
                    onClick={() => setField('type', 1)}>
                    <span className="ttb-icon">🏭</span>
                    <span className="ttb-label">Fournisseur</span>
                    <span className="ttb-code">type = 1</span>
                  </button>
                </div>
              </div>

              <div className="tiers-form-group">
                <label>Raison Sociale <span className="required">*</span></label>
                <input placeholder="Ex : STEG – Société Tunisienne de l'Électricité et du Gaz"
                  value={form.raisonSociale} onChange={e => setField('raisonSociale', e.target.value)} />
              </div>

              <div className="tiers-form-row">
                <div className="tiers-form-group">
                  <label>Email</label>
                  <input type="email" placeholder="contact@entreprise.tn"
                    value={form.email} onChange={e => setField('email', e.target.value)} />
                </div>
                <div className="tiers-form-group">
                  <label>Téléphone</label>
                  <input placeholder="+216 XX XXX XXX"
                    value={form.telephone} onChange={e => setField('telephone', e.target.value)} />
                </div>
              </div>

              <div className="tiers-form-group">
                <label>Adresse</label>
                <input placeholder="Rue, Ville, Code Postal"
                  value={form.adresse} onChange={e => setField('adresse', e.target.value)} />
              </div>

              <div className="tiers-form-group">
                <label>Matricule Fiscale</label>
                <input placeholder="1234567A/B/C..."
                  value={form.matriculeFiscale} onChange={e => setField('matriculeFiscale', e.target.value)} />
              </div>

              <div className="tiers-form-row">
                <div className="tiers-form-group">
                  <label>Pays</label>
                  <select value={form.pays} onChange={e => setField('pays', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {pays.map(p => <option key={p._id} value={p._id}>{p.nom}</option>)}
                  </select>
                </div>
                <div className="tiers-form-group">
                  <label>Banque domiciliataire</label>
                  <select value={form.banque} onChange={e => setField('banque', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {banques.map(b => <option key={b._id} value={b._id}>{b.nom}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="tiers-modal-footer">
              <button className="btn-cancel-tiers" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-save-tiers" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tiers;