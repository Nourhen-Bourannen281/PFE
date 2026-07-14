// pages/transporteur/TransporteurDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import '../../css/TransporteurDashboared.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler
);

const API_BASE_URL = 'http://localhost:5001/api';

// ── Constantes statiques hors composant ───────────────────────
const ETAT_CLASSES = {
  'À préparer': 'etat-preparer',
  'Prête':      'etat-prete',
  'En cours':   'etat-cours',
  'Livrée':     'etat-livree',
  'Annulée':    'etat-annulee',
};
const ETAT_ICONS = {
  'À préparer': '⏳', 'Prête': '✅',
  'En cours':   '🚚', 'Livrée': '📦', 'Annulée': '❌',
};
const ETAT_MESSAGES = {
  'Prête':   '✅ Livraison marquée comme prête',
  'En cours':'🚚 Livraison en cours',
  'Livrée':  '📦 Livraison marquée comme livrée',
  'Annulée': '❌ Livraison annulée',
};
const RISK_COLORS = {
  'Critique': '#dc2626', 'Élevé': '#d97706',
  'Modéré':   '#f59e0b', 'Faible': '#16a34a',
};

// ── Analyse IA (fonction pure hors composant) ─────────────────
function calcAI(livraisonsData) {
  if (!livraisonsData?.length) {
    return {
      predictedDelay: 0, riskLevel: 'Faible',
      recommendedAction: 'Aucune donnée disponible pour l\'analyse',
      estimatedCompletion: 'N/A', trend: 'stable',
      insights: ['Aucune donnée suffisante pour l\'analyse IA'],
      completionRate: 0, avgDelay: '0.0', performanceScore: 0,
    };
  }

  const livrees   = livraisonsData.filter(l => l.etat === 'Livrée');
  const enCours   = livraisonsData.filter(l => l.etat === 'En cours');

  // Délai moyen
  const avgDelay = livrees.length > 0
    ? livrees.reduce((sum, l) => {
        const diff = (new Date(l.dateLivraison || l.updatedAt || new Date()) - new Date(l.dateCreation))
          / (1000 * 60 * 60 * 24);
        return sum + Math.max(0, diff);
      }, 0) / livrees.length
    : 0;

  // Risque retard
  const risky = enCours.filter(l => {
    const days = (Date.now() - new Date(l.dateCreation)) / (1000 * 60 * 60 * 24);
    return days > (avgDelay || 3);
  }).length;
  const predictedDelay = Math.round((risky / (enCours.length || 1)) * 100);

  const riskLevel =
    predictedDelay > 60 ? 'Critique' :
    predictedDelay > 30 ? 'Élevé'    :
    predictedDelay > 10 ? 'Modéré'   : 'Faible';

  const recommendedAction =
    riskLevel === 'Critique' ? '🚨 Priorité absolue : Contacter immédiatement les transporteurs concernés' :
    riskLevel === 'Élevé'    ? '⚠️ Surveillance renforcée requise pour les livraisons en cours'            :
    riskLevel === 'Modéré'   ? '📊 Optimiser la planification des tournées'                               :
                               '✅ Performance excellente — Maintenir le rythme actuel';

  const completionRate = livrees.length / (livraisonsData.length || 1);
  const estimatedCompletion =
    completionRate > 0.8 ? 'Objectif mensuel atteint'         :
    completionRate > 0.5 ? 'Objectif en bonne voie'           :
    completionRate > 0.3 ? 'Objectif nécessite accélération'  :
                           'Objectif critique — Action immédiate requise';

  // Tendance
  const now      = new Date();
  const week1ago = new Date(now); week1ago.setDate(now.getDate() - 7);
  const week2ago = new Date(now); week2ago.setDate(now.getDate() - 14);
  const recent   = livrees.filter(l => new Date(l.dateLivraison || l.updatedAt) >= week1ago).length;
  const prev     = livrees.filter(l => {
    const d = new Date(l.dateLivraison || l.updatedAt);
    return d >= week2ago && d < week1ago;
  }).length;
  const trend = recent > prev * 1.2 ? 'up' : recent < prev * 0.8 ? 'down' : 'stable';

  // Insights
  const insights = [];
  if (predictedDelay > 30) insights.push(`📈 ${predictedDelay}% des livraisons risquent d'être en retard`);
  if (avgDelay > 5)        insights.push(`⏱️ Délai moyen de livraison : ${avgDelay.toFixed(1)} jours`);
  if (enCours.length > 10) insights.push(`🚚 Volume élevé en cours (${enCours.length})`);
  if (completionRate < 0.3) insights.push(`🎯 Taux de réalisation critique : ${Math.round(completionRate * 100)}%`);
  if (!insights.length)    insights.push('✨ Performance optimale — Toutes les métriques sont au vert');

  return {
    predictedDelay, riskLevel, recommendedAction, estimatedCompletion,
    trend, insights,
    completionRate: Math.round(completionRate * 100),
    avgDelay: avgDelay.toFixed(1),
    performanceScore: Math.round(completionRate * 100 * (1 - predictedDelay / 100)),
  };
}

// ─────────────────────────────────────────────────────────────
function TransporteurDashboard() {
// ─────────────────────────────────────────────────────────────

  const [livraisons,    setLivraisons]    = useState([]);
  const [commandes,     setCommandes]     = useState([]);
  const [transporteurs, setTransporteurs] = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [toasts,        setToasts]        = useState([]);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [selectedEtat,  setSelectedEtat]  = useState('');

  // ✅ Modals avec useState (pas de getElementById)
  const [showModal,        setShowModal]        = useState(false);
  const [showAssignModal,  setShowAssignModal]  = useState(false);
  const [selectedCommande, setSelectedCommande] = useState('');
  const [selectedLivraison,setSelectedLivraison]= useState(null);
  const [selectedTransp,   setSelectedTransp]  = useState('');  // ✅ Fix anti-pattern

  const token = localStorage.getItem('token');

  // ✅ user et rôles mémoïsés
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  const isAdmin       = useMemo(() => user.role === 'Admin',        [user.role]);
  const isCommercial  = useMemo(() => user.role === 'Commercial',   [user.role]);
  const isTransporteur= useMemo(() => user.role === 'Transporteur', [user.role]);

  // ✅ api mémoïsé — ne se recrée que si le token change
  const api = useMemo(() => {
    if (!token) return null;
    return axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  // ✅ addToast en useCallback
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const extractArray = useCallback((res) => {
    if (Array.isArray(res))         return res;
    if (Array.isArray(res?.data))   return res.data;
    if (typeof res === 'object') {
      for (const k in res) if (Array.isArray(res[k])) return res[k];
    }
    return [];
  }, []);

  // ── Fetch ─────────────────────────────────────────────────
  const fetchLivraisons = useCallback(async () => {
    if (!api) return;
    try {
      setLoading(true);
      const res = await api.get('/livraisons');
      setLivraisons(extractArray(res.data));
    } catch  {
      addToast('Erreur lors du chargement des livraisons', 'error');
      setLivraisons([]);
    } finally { setLoading(false); }
  }, [api, extractArray, addToast]);

  const fetchCommandesValidees = useCallback(async () => {
    if (!api) return;
    try {
      const res = await api.get('/commandes?statut=Validée');
      setCommandes(extractArray(res.data));
    } catch { setCommandes([]); }
  }, [api, extractArray]);

  const fetchTransporteurs = useCallback(async () => {
    if (!api) return;
    try {
      const res = await api.get('/users/transporteurs');
      setTransporteurs(extractArray(res.data));
    } catch { setTransporteurs([]); }
  }, [api, extractArray]);

  useEffect(() => {
    fetchLivraisons();
    if (isCommercial || isAdmin) fetchCommandesValidees();
    if (isAdmin)                 fetchTransporteurs();
  }, [fetchLivraisons, fetchCommandesValidees, fetchTransporteurs, isCommercial, isAdmin]);

  // ── IA (mémoïsé, recalculé quand livraisons change) ────────
  const aiPredictions = useMemo(() => calcAI(livraisons), [livraisons]);

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = livraisons.length;
    const livrees = livraisons.filter(l => l.etat === 'Livrée').length;
    return {
      total,
      aPreparer: livraisons.filter(l => l.etat === 'À préparer').length,
      prete:     livraisons.filter(l => l.etat === 'Prête').length,
      enCours:   livraisons.filter(l => l.etat === 'En cours').length,
      livrees,
      tauxCompletion: total > 0 ? Math.round((livrees / total) * 100) : 0,
    };
  }, [livraisons]);

  // ── Filtrage ──────────────────────────────────────────────
  const filteredLivraisons = useMemo(() => livraisons.filter(l => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      (l.numeroLivraison || '').toLowerCase().includes(s) ||
      (l.commande?.numeroCommande || '').toLowerCase().includes(s) ||
      (l.transporteur?.nom || '').toLowerCase().includes(s);
    return matchSearch && (!selectedEtat || l.etat === selectedEtat);
  }), [livraisons, searchTerm, selectedEtat]);

  // ── Chart data ────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    const count   = new Array(12).fill(0);
    const done    = new Array(12).fill(0);
    livraisons.forEach(l => {
      const m = new Date(l.dateCreation).getMonth();
      count[m]++;
      if (l.etat === 'Livrée') done[m]++;
    });
    return { months, count, done };
  }, [livraisons]);

  const weeklyData = useMemo(() => {
    const days  = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    const daily = new Array(7).fill(0);
    const now   = new Date();
    const sow   = new Date(now); sow.setDate(now.getDate() - now.getDay() + 1);
    livraisons.forEach(l => {
      const d = new Date(l.dateCreation);
      if (d >= sow) {
        const idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
        daily[idx]++;
      }
    });
    return { days, daily };
  }, [livraisons]);

  const statusData = useMemo(() => ({
    labels: ['À préparer','Prête','En cours','Livrée'],
    datasets: [{
      data: [stats.aPreparer, stats.prete, stats.enCours, stats.livrees],
      backgroundColor: ['#f59e0b','#3b82f6','#8b5cf6','#10b981'],
      borderWidth: 0,
    }],
  }), [stats]);

  // ── CRUD ──────────────────────────────────────────────────
  const createLivraison = useCallback(async () => {
    if (!isCommercial) { addToast('Accès non autorisé.', 'error'); return; }
    if (!selectedCommande) { addToast('Veuillez sélectionner une commande', 'error'); return; }
    try {
      setLoading(true);
      await api.post(`/livraisons/from-commande/${selectedCommande}`);
      addToast('✅ Livraison créée avec succès !');
      setShowModal(false); setSelectedCommande('');
      fetchLivraisons(); fetchCommandesValidees();
    } catch (err) { addToast(err.response?.data?.message || '❌ Erreur lors de la création', 'error'); }
    finally { setLoading(false); }
  }, [isCommercial, selectedCommande, api, addToast, fetchLivraisons, fetchCommandesValidees]);

  const updateEtat = useCallback(async (livraisonId, nouvelEtat) => {
    if (!isCommercial && !isTransporteur) { addToast('Accès non autorisé.', 'error'); return; }
    try {
      setLoading(true);
      await api.patch(`/livraisons/${livraisonId}/etat`, { etat: nouvelEtat });
      addToast(ETAT_MESSAGES[nouvelEtat] || `État mis à jour : ${nouvelEtat}`);
      fetchLivraisons();
    } catch (err) { addToast(err.response?.data?.message || 'Erreur mise à jour', 'error'); }
    finally { setLoading(false); }
  }, [isCommercial, isTransporteur, api, addToast, fetchLivraisons]);

  const assignTransporteur = useCallback(async () => {
    if (!isAdmin) { addToast('Accès non autorisé.', 'error'); return; }
    if (!selectedTransp) { addToast('Veuillez sélectionner un transporteur', 'error'); return; }
    try {
      setLoading(true);
      await api.patch(`/livraisons/${selectedLivraison._id}/assign-transporteur`, { transporteurId: selectedTransp });
      const t = transporteurs.find(t => t._id === selectedTransp);
      addToast(`✅ Transporteur "${t?.nom}" assigné avec succès`);
      setShowAssignModal(false); setSelectedTransp(''); setSelectedLivraison(null);
      fetchLivraisons();
    } catch (err) { addToast(err.response?.data?.message || '❌ Erreur assignation', 'error'); }
    finally { setLoading(false); }
  }, [isAdmin, selectedTransp, selectedLivraison, api, addToast, transporteurs, fetchLivraisons]);

  const downloadBonLivraison = useCallback(async (livraisonId, num) => {
    if (!isCommercial) { addToast('Accès non autorisé.', 'error'); return; }
    try {
      setLoading(true);
      const res = await api.get(`/livraisons/${livraisonId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url; a.download = `bon_livraison_${num}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      addToast('📄 Bon de livraison téléchargé');
    } catch { addToast('❌ Erreur téléchargement', 'error'); }
    finally { setLoading(false); }
  }, [isCommercial, api, addToast]);

  const getEtatsPossibles = useCallback((etatActuel) => {
    if (isCommercial) {
      return { 'À préparer': ['Prête','Annulée'], 'Prête': ['En cours','Annulée'], 'En cours': ['Livrée','Annulée'] }[etatActuel] || [];
    }
    if (isTransporteur) {
      return { 'Prête': ['En cours'], 'En cours': ['Livrée'] }[etatActuel] || [];
    }
    return [];
  }, [isCommercial, isTransporteur]);

  // ── Chart options ─────────────────────────────────────────
  const barOpts  = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } },
  }), []);

  const lineOpts = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } },
  }), []);

  const doughOpts = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    cutout: '60%',
  }), []);

  // ─────────────────────────────────────────────────────────
  return (
    <div className="td-page">

      {/* ── Toasts ────────────────────────────────────────── */}
      <div className="td-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`td-toast td-toast-${t.type}`}>
            <span className="td-toast-icon">{t.type === 'success' ? '✓' : '✗'}</span>
            <span>{t.message}</span>
            <button onClick={() => removeToast(t.id)}>×</button>
          </div>
        ))}
      </div>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="td-header">
        <div>
          <h1>🚚 Tableau de bord — Transporteur</h1>
          <p>Bienvenue, <strong>{user.nom || 'Transporteur'}</strong> !</p>
        </div>
        <button className="td-btn-refresh" onClick={fetchLivraisons} disabled={loading}>
          {loading ? '⏳' : '🔄'} Actualiser
        </button>
      </div>

      {/* ── Panel IA ──────────────────────────────────────── */}
      <div className="td-ai-panel">
        <div className="td-ai-header">
          <h3>🤖 Intelligence Artificielle — Analyse Prédictive</h3>
          <span className="td-ai-score">Score : {aiPredictions.performanceScore}%</span>
        </div>

        <div className="td-ai-grid">
          {/* Risque retard */}
          <div className="td-ai-card">
            <div className="td-ai-card-label">Risque de retard prédit</div>
            <div className="td-ai-card-num">{aiPredictions.predictedDelay}%</div>
            <div
              className="td-ai-risk-badge"
              style={{ background: RISK_COLORS[aiPredictions.riskLevel] }}
            >
              {aiPredictions.riskLevel}
            </div>
          </div>

          {/* Tendance */}
          <div className="td-ai-card">
            <div className="td-ai-card-label">Tendance des livraisons</div>
            <div className="td-ai-card-num">
              {aiPredictions.trend === 'up' ? '📈 Hausse' : aiPredictions.trend === 'down' ? '📉 Baisse' : '➡️ Stable'}
            </div>
            <div className="td-ai-card-sub">Taux de réalisation : {aiPredictions.completionRate}%</div>
          </div>

          {/* Délai moyen */}
          <div className="td-ai-card">
            <div className="td-ai-card-label">Délai moyen livraison</div>
            <div className="td-ai-card-num">{aiPredictions.avgDelay} jours</div>
            <div className="td-ai-card-sub">{aiPredictions.estimatedCompletion}</div>
          </div>
        </div>

        {/* Recommandation */}
        <div className="td-ai-reco">
          <div className="td-ai-reco-label">💡 Recommandation IA</div>
          <div className="td-ai-reco-text">{aiPredictions.recommendedAction}</div>
        </div>

        {/* Insights */}
        <div className="td-ai-insights">
          <div className="td-ai-insights-title">📊 Insights intelligents</div>
          {aiPredictions.insights.map((ins, i) => (
            <div key={i} className="td-ai-insight-item">
              <span className="td-ai-dot" /> {ins}
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div className="td-kpi-grid">
        {[
          { icon: '📦', label: 'Total livraisons',  val: stats.total,     cls: '' },
          { icon: '⏳', label: 'À préparer',         val: stats.aPreparer, cls: 'td-kpi-warning' },
          { icon: '✅', label: 'Prêtes',             val: stats.prete,     cls: 'td-kpi-info' },
          { icon: '🚚', label: 'En cours',           val: stats.enCours,   cls: 'td-kpi-primary' },
          { icon: '📦', label: 'Livrées',            val: stats.livrees,   cls: 'td-kpi-success' },
        ].map(k => (
          <div key={k.label} className={`td-kpi ${k.cls}`}>
            <span className="td-kpi-icon">{k.icon}</span>
            <div>
              <div className="td-kpi-val">{k.val}</div>
              <div className="td-kpi-label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ────────────────────────────────────────── */}
      <div className="td-charts-row">
        <div className="td-chart-card">
          <div className="td-chart-head"><h3>📊 Livraisons mensuelles</h3></div>
          <div className="td-chart-wrap">
            <Bar
              data={{
                labels: monthlyData.months,
                datasets: [
                  { label: 'Créées',  data: monthlyData.count, backgroundColor: '#3b82f6', borderRadius: 6 },
                  { label: 'Livrées', data: monthlyData.done,  backgroundColor: '#10b981', borderRadius: 6 },
                ],
              }}
              options={barOpts}
            />
          </div>
        </div>

        <div className="td-chart-card">
          <div className="td-chart-head"><h3>📈 Tendance hebdomadaire</h3></div>
          <div className="td-chart-wrap">
            <Line
              data={{
                labels: weeklyData.days,
                datasets: [{
                  label: 'Livraisons', data: weeklyData.daily,
                  borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,.1)',
                  fill: true, tension: 0.4,
                }],
              }}
              options={lineOpts}
            />
          </div>
        </div>
      </div>

      <div className="td-charts-row">
        <div className="td-chart-card">
          <div className="td-chart-head"><h3>🥧 Répartition par statut</h3></div>
          <div className="td-chart-wrap">
            <Doughnut data={statusData} options={doughOpts} />
          </div>
        </div>

        <div className="td-chart-card">
          <div className="td-chart-head"><h3>🎯 Taux de complétion</h3></div>
          <div className="td-completion">
            <div className="td-comp-header">
              <span>Progression globale</span>
              <span className="td-comp-pct">{stats.tauxCompletion}%</span>
            </div>
            <div className="td-comp-bar">
              <div className="td-comp-fill" style={{ width: `${stats.tauxCompletion}%` }} />
            </div>
            <div className="td-comp-footer">
              <span>Objectif : 100%</span>
              <span>Reste : {100 - stats.tauxCompletion}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filtres ───────────────────────────────────────── */}
      <div className="td-filters">
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="td-search"
        />
        <div className="td-filter-btns">
          {[
            { key: '',           label: `Tous (${stats.total})`             },
            { key: 'À préparer', label: `⏳ À préparer (${stats.aPreparer})` },
            { key: 'Prête',      label: `✅ Prête (${stats.prete})`          },
            { key: 'En cours',   label: `🚚 En cours (${stats.enCours})`     },
            { key: 'Livrée',     label: `📦 Livrée (${stats.livrees})`       },
          ].map(f => (
            <button key={f.key}
              className={`td-filter-btn ${selectedEtat === f.key ? 'active' : ''}`}
              onClick={() => setSelectedEtat(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        {isCommercial && (
          <button className="td-btn-new" onClick={() => setShowModal(true)} disabled={loading}>
            + Nouvelle Livraison
          </button>
        )}
      </div>

      {/* ── Liste livraisons ──────────────────────────────── */}
      {filteredLivraisons.length === 0 ? (
        <div className="td-empty">
          <span>🚚</span>
          <h4>Aucune livraison</h4>
          <p>{searchTerm || selectedEtat ? 'Aucune livraison ne correspond à vos critères' : 'Commencez par créer une livraison'}</p>
        </div>
      ) : (
        <div className="td-livraisons-grid">
          {filteredLivraisons.map(l => (
            <div key={l._id} className="td-card">
              <div className="td-card-head">
                <div>
                  <div className="td-card-num">{l.numeroLivraison}</div>
                  <div className="td-card-cmd">Commande : {l.commande?.numeroCommande || 'N/A'}</div>
                </div>
                <span className={`td-etat-badge ${ETAT_CLASSES[l.etat] || ''}`}>
                  {ETAT_ICONS[l.etat]} {l.etat}
                </span>
              </div>

              <div className="td-card-body">
                <div className="td-info-row">
                  <span>Transporteur</span>
                  <span>
                    {l.transporteur?.nom || 'Non assigné'}
                    {isAdmin && (
                      <button className="td-btn-assign"
                        onClick={() => { setSelectedLivraison(l); setSelectedTransp(''); setShowAssignModal(true); }}>
                        {l.transporteur ? '🔄' : '✍️'}
                      </button>
                    )}
                  </span>
                </div>
                <div className="td-info-row">
                  <span>Date création</span>
                  <span>{new Date(l.dateCreation).toLocaleDateString('fr-FR')}</span>
                </div>
                {l.dateArriveePrevue && (
                  <div className="td-info-row">
                    <span>Arrivée prévue</span>
                    <span>{new Date(l.dateArriveePrevue).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>

              <div className="td-card-actions">
                {isCommercial && (
                  <button className="td-btn-pdf"
                    onClick={() => downloadBonLivraison(l._id, l.numeroLivraison)}>
                    📄 Bon
                  </button>
                )}
                {getEtatsPossibles(l.etat).map(etat => (
                  <button key={etat}
                    className={`td-btn-etat td-btn-${etat === 'Annulée' ? 'danger' : 'action'}`}
                    onClick={() => updateEtat(l._id, etat)}
                    disabled={loading}>
                    {ETAT_ICONS[etat]} {etat}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal nouvelle livraison ───────────────────────── */}
      {showModal && isCommercial && (
        <div className="td-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="td-modal" onClick={e => e.stopPropagation()}>
            <div className="td-modal-head">
              <h3>📝 Nouvelle Livraison</h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="td-modal-body">
              <div className="td-form-group">
                <label>Commande validée</label>
                <select
                  value={selectedCommande}
                  onChange={e => setSelectedCommande(e.target.value)}>
                  <option value="">— Choisir une commande —</option>
                  {commandes.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.numeroCommande} — {c.montantTotal?.toLocaleString()} TND
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="td-modal-foot">
              <button className="td-btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="td-btn-save" onClick={createLivraison} disabled={loading || !selectedCommande}>
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal assigner transporteur ────────────────────── */}
      {showAssignModal && isAdmin && selectedLivraison && (
        <div className="td-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="td-modal" onClick={e => e.stopPropagation()}>
            <div className="td-modal-head">
              <h3>✍️ Assigner un transporteur</h3>
              <button onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="td-modal-body">
              {/* ✅ Fix anti-pattern : useState au lieu de getElementById */}
              <div className="td-form-group">
                <label>Sélectionner un transporteur *</label>
                <select
                  value={selectedTransp}
                  onChange={e => setSelectedTransp(e.target.value)}>
                  <option value="">— Choisir un transporteur —</option>
                  {transporteurs.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.nom} {t.prenom || ''} — {t.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="td-modal-foot">
              <button className="td-btn-cancel" onClick={() => setShowAssignModal(false)}>Annuler</button>
              <button className="td-btn-save" onClick={assignTransporteur} disabled={loading || !selectedTransp}>
                Assigner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransporteurDashboard;