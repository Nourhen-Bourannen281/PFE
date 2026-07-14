// pages/PenalitesRetard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';
import '../css/PenalitesRetard.css';

const API_BASE_URL = 'http://localhost:5001/api';

const DEMO_DATA = [
  { _id: '1', reference: 'CMD-2024-089', type: 'Commande', client: 'Société Pétrolière du Sud',
    montantDu: 125000, dateEcheance: new Date(Date.now() - 15 * 86400000).toISOString(),
    tauxPenalite: 0.5, statut: 'En retard' },
  { _id: '2', reference: 'FAC-2024-034', type: 'Facture', client: 'STEG Distribution',
    montantDu: 87500, dateEcheance: new Date(Date.now() - 8 * 86400000).toISOString(),
    tauxPenalite: 0.5, statut: 'En retard' },
  { _id: '3', reference: 'LIV-2024-055', type: 'Livraison', client: 'GPC Industries',
    montantDu: 43200, dateEcheance: new Date(Date.now() - 22 * 86400000).toISOString(),
    tauxPenalite: 0.75, statut: 'En retard' },
  { _id: '4', reference: 'CMD-2024-071', type: 'Commande', client: 'Raffinerie du Nord',
    montantDu: 210000, dateEcheance: new Date(Date.now() - 5 * 86400000).toISOString(),
    tauxPenalite: 0.5, statut: 'En retard' },
  { _id: '5', reference: 'FAC-2024-078', type: 'Facture', client: 'Transport Maritime SA',
    montantDu: 62000, dateEcheance: new Date(Date.now() - 30 * 86400000).toISOString(),
    tauxPenalite: 1.0, statut: 'Critique' },
];

const PenalitesRetard = () => {
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isDemoMode, setIsDemoMode]   = useState(false);
  const [filterType, setFilterType]   = useState('all');
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState([]);
  const [applying, setApplying]       = useState(false);
  const [success, setSuccess]         = useState('');
  const [tauxGlobal, setTauxGlobal]   = useState('');

  const token = getToken();
  const api   = useMemo(() => {
    if (!token) return null;
    return axios.create({ baseURL: API_BASE_URL, headers: { Authorization: `Bearer ${token}` } });
  }, [token]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!token || !api) { setIsDemoMode(true); setData(DEMO_DATA); setLoading(false); return; }
    try {
      const res = await api.get('/penalites');
      setData(Array.isArray(res.data) ? res.data : res.data.data || []);
      setIsDemoMode(false);
    } catch {
      setIsDemoMode(true); setData(DEMO_DATA);
    } finally { setLoading(false); }
  }, [api, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Calcul des pénalités ──────────────────────────────────────
  const calcPenalite = useCallback((item) => {
    const jours = Math.max(0, Math.floor((Date.now() - new Date(item.dateEcheance).getTime()) / 86400000));
    const taux  = parseFloat(tauxGlobal) || item.tauxPenalite || 0.5;
    return { jours, montant: (item.montantDu * taux / 100) * jours };
  }, [tauxGlobal]);

  // ── Filtered ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== 'all') list = list.filter(d => d.type === filterType);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(d => d.reference.toLowerCase().includes(s) || d.client.toLowerCase().includes(s));
    }
    return list;
  }, [data, filterType, search]);

  const totalPenalites = useMemo(() =>
    filtered.reduce((acc, item) => acc + calcPenalite(item).montant, 0),
  [filtered, calcPenalite]);

  // ── Sélection ────────────────────────────────────────────────
  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map(d => d._id));

  // ── Appliquer pénalités ───────────────────────────────────────
  const applyPenalites = useCallback(async () => {
    if (selected.length === 0) return;
    setApplying(true);
    const payload = selected.map(id => {
      const item = data.find(d => d._id === id);
      const { jours, montant } = calcPenalite(item);
      return { id, jours, montant, taux: parseFloat(tauxGlobal) || item.tauxPenalite };
    });
    if (!isDemoMode && api) {
      try { await api.post('/penalites/appliquer', { penalites: payload }); }
      catch { /* ignore */ }
    }
    setSuccess(`${selected.length} pénalité${selected.length > 1 ? 's' : ''} appliquée${selected.length > 1 ? 's' : ''} avec succès.`);
    setSelected([]);
    setApplying(false);
    setTimeout(() => setSuccess(''), 4000);
  }, [selected, data, calcPenalite, tauxGlobal, api, isDemoMode]);

  const fmt = (n) => new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 2 }).format(n);
  const fmtDate = (iso) => iso ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)) : '-';

  return (
    <div className="pen-page">

      {/* Header */}
      <div className="pen-header">
        <div>
          <h1>Pénalités de retard</h1>
          <p>Calcul automatique et application des pénalités sur les échéances dépassées</p>
        </div>
        {isDemoMode && <span className="pen-demo-tag">⚡ Démo</span>}
      </div>

      {/* Summary cards */}
      <div className="pen-summary">
        <div className="pen-card">
          <span className="pen-card-icon">📋</span>
          <div>
            <div className="pen-card-value">{filtered.length}</div>
            <div className="pen-card-label">Dossiers en retard</div>
          </div>
        </div>
        <div className="pen-card pen-card-warning">
          <span className="pen-card-icon">⏰</span>
          <div>
            <div className="pen-card-value">
              {Math.max(0, ...filtered.map(d => calcPenalite(d).jours))} j
            </div>
            <div className="pen-card-label">Retard maximal</div>
          </div>
        </div>
        <div className="pen-card pen-card-danger">
          <span className="pen-card-icon">💰</span>
          <div>
            <div className="pen-card-value">{fmt(totalPenalites)}</div>
            <div className="pen-card-label">Total pénalités calculées</div>
          </div>
        </div>
        <div className="pen-card pen-card-info">
          <span className="pen-card-icon">✅</span>
          <div>
            <div className="pen-card-value">{selected.length}</div>
            <div className="pen-card-label">Sélectionnés</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="pen-toolbar">
        <div className="pen-toolbar-left">
          <input
            className="pen-search"
            type="text"
            placeholder="🔍 Rechercher référence ou client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="pen-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">Tous les types</option>
            <option value="Commande">Commandes</option>
            <option value="Facture">Factures</option>
            <option value="Livraison">Livraisons</option>
          </select>
          <div className="pen-taux-wrap">
            <label>Taux global (%/j)</label>
            <input
              type="number" step="0.1" min="0" max="5"
              className="pen-taux-input"
              placeholder="0.50"
              value={tauxGlobal}
              onChange={e => setTauxGlobal(e.target.value)}
            />
          </div>
        </div>
        <div className="pen-toolbar-right">
          {selected.length > 0 && (
            <button className="btn-apply" onClick={applyPenalites} disabled={applying}>
              {applying ? 'Application...' : `⚡ Appliquer (${selected.length})`}
            </button>
          )}
        </div>
      </div>

      {success && <div className="pen-success">✅ {success}</div>}

      {/* Table */}
      <div className="pen-table-wrap">
        {loading ? (
          <div className="pen-loading">
            <div className="pen-spinner" /><span>Calcul en cours...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pen-empty">
            <span>🎉</span><p>Aucun retard détecté</p>
          </div>
        ) : (
          <table className="pen-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={selectAll}
                    className="pen-checkbox"
                  />
                </th>
                <th>Référence</th>
                <th>Type</th>
                <th>Client</th>
                <th>Montant dû</th>
                <th>Échéance</th>
                <th>Jours retard</th>
                <th>Taux (%/j)</th>
                <th>Pénalité calculée</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const { jours, montant } = calcPenalite(item);
                const taux = parseFloat(tauxGlobal) || item.tauxPenalite;
                const isSel = selected.includes(item._id);
                return (
                  <tr key={item._id} className={isSel ? 'row-selected' : ''}>
                    <td>
                      <input type="checkbox" checked={isSel}
                        onChange={() => toggleSelect(item._id)}
                        className="pen-checkbox"
                      />
                    </td>
                    <td className="pen-ref">{item.reference}</td>
                    <td>
                      <span className={`pen-type-badge pen-type-${item.type.toLowerCase()}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="pen-client">{item.client}</td>
                    <td className="pen-montant">{fmt(item.montantDu)}</td>
                    <td>{fmtDate(item.dateEcheance)}</td>
                    <td>
                      <span className={`pen-jours ${jours > 20 ? 'jours-critical' : jours > 10 ? 'jours-warning' : 'jours-normal'}`}>
                        {jours} j
                      </span>
                    </td>
                    <td className="pen-taux">{taux.toFixed(2)} %</td>
                    <td className="pen-penalite-val">{fmt(montant)}</td>
                    <td>
                      <span className={`pen-statut ${item.statut === 'Critique' ? 'statut-critical' : 'statut-late'}`}>
                        {item.statut}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="pen-total-row">
                <td colSpan="8">Total pénalités ({filtered.length} dossiers)</td>
                <td className="pen-total-val">{fmt(totalPenalites)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default PenalitesRetard;