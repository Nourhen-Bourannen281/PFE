import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import '../../css/CommercialDashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler, RadialLinearScale
);

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTHS_ABBR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const YEARS = [2023, 2024, 2025, 2026];
const API_BASE_URL = 'http://localhost:5001/api';
const OBJECTIF_MENSUEL = 18_000_000;
const OBJECTIF_ANNUEL  = 200_000_000;

const STATUT_COLORS = {
  en_attente: { badge: 'status-badge warning',  text: 'En attente', icon: '⏳', bg: '#fef3c7', color: '#d97706' },
  confirmee:  { badge: 'status-badge success',  text: 'Confirmée',  icon: '✓',  bg: '#d1fae5', color: '#059669' },
  en_cours:   { badge: 'status-badge info',     text: 'En cours',   icon: '⚙️', bg: '#dbeafe', color: '#2563eb' },
  livree:     { badge: 'status-badge success',  text: 'Livrée',     icon: '🚚', bg: '#d1fae5', color: '#059669' },
  exportee:   { badge: 'status-badge primary',  text: 'Exportée',   icon: '📦', bg: '#ede9fe', color: '#7c3aed' },
  facturee:   { badge: 'status-badge purple',   text: 'Facturée',   icon: '📄', bg: '#ede9fe', color: '#7c3aed' }
};

const formatCurrency = (v) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

const formatCurrencyShort = (v) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' MDT';
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + ' kDT';
  return (v || 0).toFixed(0) + ' DT';
};

const formatVolume = (v) => {
  if (v >= 1_000) return (v / 1_000).toFixed(1) + ' k m³';
  return (v || 0).toLocaleString() + ' m³';
};

const formatVolumeShort = (v) => {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M m³';
  if (v >= 1_000)     return (v / 1_000).toFixed(1) + ' k m³';
  return (v || 0).toLocaleString() + ' m³';
};

// ── Normalize records from various API shapes ───────────────────────
function normalize(records, type) {
  return (Array.isArray(records) ? records : []).map(r => ({
    _id:             r._id,
    numeroOperation: r.numeroOperation || r.numero || r._id,
    dateOperation:   r.dateOperation   || r.date   || r.createdAt,
    type,
    client:    typeof r.client    === 'object' ? r.client    : { nom: r.client    || '' },
    produit:   typeof r.produit   === 'object' ? r.produit   : { nom: r.produit   || '' },
    quantite:      parseFloat(r.quantite      || r.volume    || 0),
    prixUnitaire:  parseFloat(r.prixUnitaire  || 0),
    montantTotal:  parseFloat(r.montantTotal  || r.montant   || 0),
    statut:    r.statut || 'en_attente',
    origine:   r.origine    || null,
    destination: r.destination || null,
    navire:    r.navire     || null,
    livraisonId: r.livraisonId || null
  }));
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
const CommercialDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operations, setOperations] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [activeTypeFilter, setActiveTypeFilter]     = useState('all');
  const [activeStatutFilter, setActiveStatutFilter] = useState('all');
  const [searchTerm, setSearchTerm]                 = useState('');
  const [selectedMonth, setSelectedMonth]           = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear]             = useState(new Date().getFullYear());
  const [selectedClient, setSelectedClient]         = useState('all');
  const [viewMode, setViewMode]                     = useState('monthly');

  const [showCreateLivraison, setShowCreateLivraison] = useState(false);
  const [selectedOperation, setSelectedOperation]     = useState(null);
  const [newLivraison, setNewLivraison] = useState({
    transporteur: '', plaque: '', chauffeur: '', dateLivraison: '', remarques: ''
  });

  // ── Fetch ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setError('Non authentifié. Veuillez vous reconnecter.'); setLoading(false); return; }
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [ventesRes, cabotagesRes, exportsRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/ventes`,   { headers }),
        axios.get(`${API_BASE_URL}/cabotage`, { headers }),
        axios.get(`${API_BASE_URL}/exports`,  { headers })
      ]);

      const extract = (res) => res.status === 'fulfilled' ? (res.value?.data?.data || res.value?.data || []) : [];

      const all = [
        ...normalize(extract(ventesRes),   'vente_steg'),
        ...normalize(extract(cabotagesRes), 'cabotage_stir'),
        ...normalize(extract(exportsRes),   'export')
      ];

      setOperations(all);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Erreur lors du chargement des données.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filtrage ─────────────────────────────────────────────────────
  const operationsFiltrees = useMemo(() => {
    let f = [...operations];

    if (viewMode === 'yearly') {
      f = f.filter(o => o.dateOperation && new Date(o.dateOperation).getFullYear() === selectedYear);
    } else {
      f = f.filter(o => {
        if (!o.dateOperation) return false;
        const d = new Date(o.dateOperation);
        if (isNaN(d.getTime())) return false;
        return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
      });
    }

    if (activeTypeFilter   !== 'all') f = f.filter(o => o.type   === activeTypeFilter);
    if (selectedClient     !== 'all') f = f.filter(o => o.client?.nom === selectedClient);
    if (activeStatutFilter !== 'all') f = f.filter(o => o.statut === activeStatutFilter);

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      f = f.filter(o =>
        (o.numeroOperation || '').toLowerCase().includes(s) ||
        (o.client?.nom     || '').toLowerCase().includes(s) ||
        (o.produit?.nom    || '').toLowerCase().includes(s)
      );
    }
    return f;
  }, [operations, selectedMonth, selectedYear, selectedClient, activeTypeFilter, activeStatutFilter, searchTerm, viewMode]);

  // ── Statistiques ─────────────────────────────────────────────────
  const statistics = useMemo(() => {
    const ventesSTEG    = operationsFiltrees.filter(o => o.type === 'vente_steg');
    const cabotagesSTIR = operationsFiltrees.filter(o => o.type === 'cabotage_stir');
    const exports       = operationsFiltrees.filter(o => o.type === 'export');

    const totalVolume  = operationsFiltrees.reduce((s, o) => s + o.quantite, 0);
    const totalMontant = operationsFiltrees.reduce((s, o) => s + o.montantTotal, 0);

    const byType = {
      ventes_steg:   { volume: ventesSTEG.reduce((s,o)=>s+o.quantite,0),    montant: ventesSTEG.reduce((s,o)=>s+o.montantTotal,0),    count: ventesSTEG.length    },
      cabotage_stir: { volume: cabotagesSTIR.reduce((s,o)=>s+o.quantite,0), montant: cabotagesSTIR.reduce((s,o)=>s+o.montantTotal,0), count: cabotagesSTIR.length },
      export:        { volume: exports.reduce((s,o)=>s+o.quantite,0),       montant: exports.reduce((s,o)=>s+o.montantTotal,0),       count: exports.length       }
    };

    const byStatus = operationsFiltrees.reduce((acc, o) => {
      const k = o.statut || 'en_attente'; acc[k] = (acc[k] || 0) + 1; return acc;
    }, {});

    const ventesParClient = operationsFiltrees.reduce((acc, o) => {
      const nom = o.client?.nom || 'Inconnu';
      acc[nom] = (acc[nom] || 0) + o.montantTotal;
      return acc;
    }, {});
    const topClients = Object.entries(ventesParClient).sort(([,a],[,b]) => b-a).slice(0, 5);

    const prixMoyen = totalVolume > 0 ? totalMontant / totalVolume : 0;
    const valeurMoyenneParOperation = operationsFiltrees.length > 0 ? totalMontant / operationsFiltrees.length : 0;

    const realisees = (byStatus.livree || 0) + (byStatus.exportee || 0) + (byStatus.facturee || 0);
    const tauxRealisation = operationsFiltrees.length > 0 ? (realisees / operationsFiltrees.length) * 100 : 0;

    const objectif = viewMode === 'yearly' ? OBJECTIF_ANNUEL : OBJECTIF_MENSUEL;
    const progressionObjectif = objectif > 0 ? (totalMontant / objectif) * 100 : 0;

    return {
      total: { volume: totalVolume, montant: totalMontant, count: operationsFiltrees.length, prixMoyen, valeurMoyenneParOperation },
      byType, byStatus, topClients, tauxRealisation, objectif, progressionObjectif
    };
  }, [operationsFiltrees, viewMode]);

  // ── Listes pour filtres ──────────────────────────────────────────
  const clientsList = useMemo(() => {
    const s = new Set(operations.map(o => o.client?.nom).filter(Boolean));
    return ['all', ...Array.from(s).sort()];
  }, [operations]);

  // ── Données graphiques mensuelles ────────────────────────────────
  const monthlyData = useMemo(() => {
    const montants     = new Array(12).fill(0);
    const ventesSTEG   = new Array(12).fill(0);
    const cabotageSTIR = new Array(12).fill(0);
    const exports      = new Array(12).fill(0);

    operations.forEach(o => {
      if (!o.dateOperation) return;
      const d = new Date(o.dateOperation);
      if (isNaN(d.getTime()) || d.getFullYear() !== selectedYear) return;
      const m = d.getMonth();
      montants[m] += o.montantTotal;
      if (o.type === 'vente_steg')    ventesSTEG[m]   += o.montantTotal;
      else if (o.type === 'cabotage_stir') cabotageSTIR[m] += o.montantTotal;
      else if (o.type === 'export')   exports[m]      += o.montantTotal;
    });

    let cum = 0;
    const montantsCumul = montants.map(v => { cum += v; return cum; });
    return { montants, ventesSTEG, cabotageSTIR, exports, montantsCumul };
  }, [operations, selectedYear]);

  const stackedBarData = {
    labels: MONTHS_ABBR,
    datasets: [
      { label: 'Ventes STEG',    data: monthlyData.ventesSTEG.map(v=>v/1e6),   backgroundColor: 'rgba(26,60,94,0.85)',   borderRadius: 4, stack: 'stack1' },
      { label: 'Cabotage STIR',  data: monthlyData.cabotageSTIR.map(v=>v/1e6), backgroundColor: 'rgba(59,130,246,0.85)', borderRadius: 4, stack: 'stack1' },
      { label: 'Export',         data: monthlyData.exports.map(v=>v/1e6),      backgroundColor: 'rgba(16,185,129,0.85)', borderRadius: 4, stack: 'stack1' }
    ]
  };

  const lineChartData = {
    labels: MONTHS_ABBR,
    datasets: [{
      label: 'CA Cumulé (MDT)',
      data: monthlyData.montantsCumul.map(v=>v/1e6),
      borderColor: '#1a3c5e', backgroundColor: 'rgba(26,60,94,0.1)',
      fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#1a3c5e'
    }]
  };

  const doughnutData = {
    labels: ['Ventes STEG', 'Cabotage STIR', 'Export'],
    datasets: [{
      data: [statistics.byType.ventes_steg.montant, statistics.byType.cabotage_stir.montant, statistics.byType.export.montant],
      backgroundColor: ['#1a3c5e', '#3b82f6', '#10b981'],
      borderWidth: 0, hoverOffset: 8
    }]
  };

  const stackedOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12, weight: 'bold' }, usePointStyle: true } },
      tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)} MDT` } }
    },
    scales: {
      y: { title: { display: true, text: 'Millions DT', font: { weight: 'bold' } }, beginAtZero: true, stacked: true },
      x: { stacked: true }
    }
  };

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)} MDT` } }
    },
    scales: { y: { title: { display: true, text: 'Millions DT', font: { weight: 'bold' } }, beginAtZero: true } }
  };

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 } } },
      tooltip: { callbacks: { label: ctx => `${ctx.label}: ${formatCurrencyShort(ctx.raw)}` } }
    },
    cutout: '60%'
  };

  // ── Variation mois précédent ─────────────────────────────────────
  const variation = useMemo(() => {
    if (selectedMonth === 1) return { value: 0, trend: 'stable' };
    const cur  = monthlyData.montants[selectedMonth - 1] || 0;
    const prev = monthlyData.montants[selectedMonth - 2] || 0;
    if (prev === 0) return { value: 0, trend: 'stable' };
    const pct = (cur - prev) / prev * 100;
    return { value: Math.abs(pct).toFixed(1), trend: pct >= 0 ? 'up' : 'down' };
  }, [monthlyData, selectedMonth]);

  // ── Création livraison ───────────────────────────────────────────
  const handleCreateLivraison = (op) => {
    setSelectedOperation(op);
    setNewLivraison({ transporteur: '', plaque: '', chauffeur: '', dateLivraison: new Date().toISOString().split('T')[0], remarques: '' });
    setShowCreateLivraison(true);
  };

  const submitLivraison = async () => {
    if (!newLivraison.transporteur) { alert('Veuillez saisir le nom du transporteur'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/livraisons`,
        { operationId: selectedOperation._id, type: selectedOperation.type, ...newLivraison },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success || res.status === 201) {
        alert('✅ Livraison créée avec succès !');
        setShowCreateLivraison(false);
        fetchData();
      }
    } catch {
      alert('❌ Erreur lors de la création de la livraison');
    }
  };

  // ── Export Excel ─────────────────────────────────────────────────
  const exportToExcel = () => {
    if (operationsFiltrees.length === 0) { alert('Aucune donnée à exporter'); return; }

    const data = operationsFiltrees.map(o => ({
      'N° Opération':     o.numeroOperation,
      'Date':             o.dateOperation ? new Date(o.dateOperation).toLocaleDateString('fr-FR') : '',
      'Type':             o.type === 'vente_steg' ? 'Vente STEG' : o.type === 'cabotage_stir' ? 'Cabotage STIR' : 'Export',
      'Client':           o.client?.nom  || '',
      'Produit':          o.produit?.nom || '',
      'Quantité (m³)':    o.quantite?.toLocaleString() || 0,
      'Prix Unitaire (DT)': (o.prixUnitaire || 0).toLocaleString(),
      'Montant Total (DT)': (o.montantTotal || 0).toLocaleString(),
      'Origine':          o.origine    || '-',
      'Destination':      o.destination || '-',
      'Navire':           o.navire     || '-',
      'Statut':           STATUT_COLORS[o.statut]?.text || o.statut
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Operations_${selectedYear}`);

    const recap = [{
      'Période':              getPeriodText(),
      'Total Opérations':    statistics.total.count,
      'CA Total (DT)':       statistics.total.montant,
      'Volume Total (m³)':   statistics.total.volume,
      'Ventes STEG (DT)':    statistics.byType.ventes_steg.montant,
      'Cabotage STIR (DT)':  statistics.byType.cabotage_stir.montant,
      'Export (DT)':         statistics.byType.export.montant,
      'Taux de réalisation': `${statistics.tauxRealisation.toFixed(1)}%`
    }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recap), 'Récapitulatif');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `SMART-TRADE-360_Dashboard_${getPeriodText()}.xlsx`);
  };

  const getPeriodText = () => viewMode === 'yearly' ? `Année ${selectedYear}` : `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

  // ── Rendu ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Chargement des données SMART-TRADE 360°...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-loading">
        <p style={{ color: '#dc2626' }}>⚠️ {error}</p>
        <button className="action-btn secondary" onClick={fetchData} style={{ marginTop: '1rem' }}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="commercial-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <h1>🏭 Tableau de bord Commercial</h1>
          <p>Ventes STEG · Cabotage STIR · Export — {lastUpdate.toLocaleTimeString('fr-FR')}</p>
        </div>
        <div className="header-stats">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'monthly' ? 'active' : ''}`} onClick={() => setViewMode('monthly')}>📅 Mensuel</button>
            <button className={`view-btn ${viewMode === 'yearly'  ? 'active' : ''}`} onClick={() => setViewMode('yearly')}>📆 Annuel</button>
          </div>
          {viewMode === 'monthly' && (
            <div className="filter-group">
              <label>📅 Mois</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
          )}
          <div className="filter-group">
            <label>📆 Année</label>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <span className="kpi-label">Chiffre d'affaires total</span>
            <span className="kpi-value">{formatCurrency(statistics.total.montant)}</span>
            <span className={`kpi-trend ${variation.trend}`}>
              {variation.trend === 'up' ? '↑' : variation.trend === 'down' ? '↓' : '→'} {variation.value}% vs mois dernier
            </span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🏭</div>
          <div className="kpi-content">
            <span className="kpi-label">Ventes STEG</span>
            <span className="kpi-value">{formatCurrency(statistics.byType.ventes_steg.montant)}</span>
            <span className="kpi-trend">{formatVolume(statistics.byType.ventes_steg.volume)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">⛴️</div>
          <div className="kpi-content">
            <span className="kpi-label">Cabotage STIR</span>
            <span className="kpi-value">{formatCurrency(statistics.byType.cabotage_stir.montant)}</span>
            <span className="kpi-trend">{formatVolume(statistics.byType.cabotage_stir.volume)}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📦</div>
          <div className="kpi-content">
            <span className="kpi-label">Export</span>
            <span className="kpi-value">{formatCurrency(statistics.byType.export.montant)}</span>
            <span className="kpi-trend">{formatVolume(statistics.byType.export.volume)}</span>
          </div>
        </div>
      </div>

      {/* Barre de progression objectif */}
      <div className="progress-section">
        <div className="progress-card">
          <div className="progress-header">
            <span>🎯 Objectif {viewMode === 'yearly' ? 'annuel' : 'mensuel'} — {getPeriodText()}</span>
            <span>{formatCurrencyShort(statistics.total.montant)} / {formatCurrencyShort(statistics.objectif)}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(statistics.progressionObjectif, 100)}%` }} />
          </div>
          <div className="progress-footer">
            <span>Progression: {statistics.progressionObjectif.toFixed(1)}%</span>
            <span>Reste: {formatCurrencyShort(Math.max(0, statistics.objectif - statistics.total.montant))}</span>
            <span>Taux de réalisation: {statistics.tauxRealisation.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header"><h3>📊 CA par activité — {selectedYear}</h3></div>
          <div className="chart-container" style={{ height: '400px' }}>
            <Bar data={stackedBarData} options={stackedOptions} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header"><h3>📈 Évolution cumulée du CA</h3></div>
          <div className="chart-container" style={{ height: '350px' }}>
            <Line data={lineChartData} options={lineOptions} />
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header"><h3>🥧 Répartition du CA par activité</h3></div>
          <div className="chart-container" style={{ height: '300px' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div className="chart-stats">
            {statistics.total.montant > 0 ? (
              <>
                <div className="chart-stat-item"><span className="chart-stat-label">🏭 Ventes STEG</span><span className="chart-stat-value">{((statistics.byType.ventes_steg.montant / statistics.total.montant)*100).toFixed(1)}%</span></div>
                <div className="chart-stat-item"><span className="chart-stat-label">⛴️ Cabotage STIR</span><span className="chart-stat-value">{((statistics.byType.cabotage_stir.montant / statistics.total.montant)*100).toFixed(1)}%</span></div>
                <div className="chart-stat-item"><span className="chart-stat-label">📦 Export</span><span className="chart-stat-value">{((statistics.byType.export.montant / statistics.total.montant)*100).toFixed(1)}%</span></div>
              </>
            ) : <p style={{ textAlign: 'center', color: '#9ca3af' }}>Aucune donnée</p>}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header"><h3>📊 Indicateurs clés — {getPeriodText()}</h3></div>
          <div className="stats-mini-grid">
            <div className="stat-mini-card"><div className="stat-mini-value">{operationsFiltrees.length}</div><div className="stat-mini-label">Opérations totales</div></div>
            <div className="stat-mini-card"><div className="stat-mini-value">{formatCurrency(statistics.total.prixMoyen)}/m³</div><div className="stat-mini-label">Prix moyen</div></div>
            <div className="stat-mini-card"><div className="stat-mini-value">{statistics.byType.ventes_steg.count}</div><div className="stat-mini-label">Ventes STEG</div></div>
            <div className="stat-mini-card"><div className="stat-mini-value">{statistics.byType.cabotage_stir.count}</div><div className="stat-mini-label">Opérations STIR</div></div>
            <div className="stat-mini-card"><div className="stat-mini-value">{statistics.byType.export.count}</div><div className="stat-mini-label">Exportations</div></div>
            <div className="stat-mini-card"><div className="stat-mini-value">{formatCurrencyShort(statistics.total.valeurMoyenneParOperation)}</div><div className="stat-mini-label">Valeur moyenne/op</div></div>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      {statistics.topClients.length > 0 && (
        <div className="top-clients">
          <h3>🏆 Top 5 Clients</h3>
          <div className="client-list">
            {statistics.topClients.map(([client, montant], i) => (
              <div key={client} className="client-item">
                <div className="client-rank">{i + 1}</div>
                <div className="client-info">
                  <div className="client-name">{client}</div>
                  <div className="client-stats">{formatCurrency(montant)}</div>
                </div>
                <div className="client-bar-container">
                  <div className="client-bar" style={{ width: `${(montant / statistics.topClients[0][1]) * 100}%` }} />
                </div>
                <div className="client-percent">{statistics.total.montant > 0 ? ((montant / statistics.total.montant) * 100).toFixed(1) : 0}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres avancés */}
      <div className="advanced-filters">
        <div className="filter-group">
          <label>📌 Type</label>
          <select value={activeTypeFilter} onChange={e => setActiveTypeFilter(e.target.value)}>
            <option value="all">Tous les types</option>
            <option value="vente_steg">🏭 Ventes STEG</option>
            <option value="cabotage_stir">⛴️ Cabotage STIR</option>
            <option value="export">📦 Export</option>
          </select>
        </div>
        <div className="filter-group">
          <label>👥 Client</label>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
            {clientsList.map(c => <option key={c} value={c}>{c === 'all' ? 'Tous les clients' : c}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>📌 Statut</label>
          <select value={activeStatutFilter} onChange={e => setActiveStatutFilter(e.target.value)}>
            <option value="all">Tous statuts</option>
            <option value="en_attente">⏳ En attente ({statistics.byStatus.en_attente || 0})</option>
            <option value="confirmee">✓ Confirmée ({statistics.byStatus.confirmee || 0})</option>
            <option value="en_cours">⚙️ En cours ({statistics.byStatus.en_cours || 0})</option>
            <option value="livree">🚚 Livrée ({statistics.byStatus.livree || 0})</option>
            <option value="exportee">📦 Exportée ({statistics.byStatus.exportee || 0})</option>
          </select>
        </div>
        <div className="filter-group">
          <label>🔍 Recherche</label>
          <input type="text" placeholder="N° opération, client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
        </div>
        <div className="filter-group">
          <button className="action-btn secondary" onClick={exportToExcel}>📎 Exporter</button>
          <button className="action-btn secondary" onClick={fetchData}>🔄 Rafraîchir</button>
        </div>
      </div>

      {/* Table des opérations */}
      <div className="commandes-section">
        <div className="section-header">
          <h3>📋 Opérations ({operationsFiltrees.length} sur {operations.length})</h3>
          <div className="section-stats">
            <span className="section-badge">💰 {formatCurrencyShort(statistics.total.montant)}</span>
            <span className="section-badge">📦 {formatVolumeShort(statistics.total.volume)}</span>
          </div>
        </div>
        <div className="table-container">
          <table className="commandes-table">
            <thead>
              <tr>
                <th>N° Opération</th><th>Date</th><th>Type</th><th>Client</th><th>Produit</th>
                <th>Quantité</th><th>Montant</th><th>Origine/Destination</th><th>Statut</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {operationsFiltrees.length > 0 ? operationsFiltrees.slice(0, 50).map(op => (
                <tr key={op._id}>
                  <td><strong>{op.numeroOperation}</strong></td>
                  <td>{op.dateOperation ? new Date(op.dateOperation).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>
                    <span className="type-badge">
                      {op.type === 'vente_steg' ? '🏭 STEG' : op.type === 'cabotage_stir' ? '⛴️ STIR' : '📦 EXPORT'}
                    </span>
                  </td>
                  <td>{op.client?.nom || '-'}</td>
                  <td>{op.produit?.nom || '-'}</td>
                  <td>{(op.quantite || 0).toLocaleString()} m³</td>
                  <td><strong>{formatCurrency(op.montantTotal)}</strong></td>
                  <td>{op.origine || op.destination || '-'}</td>
                  <td>
                    <span className={STATUT_COLORS[op.statut]?.badge} style={{ background: STATUT_COLORS[op.statut]?.bg, color: STATUT_COLORS[op.statut]?.color }}>
                      {STATUT_COLORS[op.statut]?.icon} {STATUT_COLORS[op.statut]?.text || op.statut}
                    </span>
                  </td>
                  <td>
                    {(op.statut === 'confirmee' || op.statut === 'en_cours') && !op.livraisonId && (
                      <button className="btn-create-livraison" onClick={() => handleCreateLivraison(op)}>🚚 Planifier</button>
                    )}
                    {op.livraisonId && <span className="livraison-created">✅ Planifiée</span>}
                  </td>
                </tr>
              )) : (
                <tr className="no-data">
                  <td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                    📭 Aucune opération trouvée pour {getPeriodText()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Livraison */}
      {showCreateLivraison && (
        <div className="modal-overlay" onClick={() => setShowCreateLivraison(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚚 Planifier la livraison</h3>
              <button className="modal-close" onClick={() => setShowCreateLivraison(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-group"><label>Opération N°</label><input type="text" value={selectedOperation?.numeroOperation || ''} disabled /></div>
              <div className="info-group"><label>Client</label><input type="text" value={selectedOperation?.client?.nom || ''} disabled /></div>
              <div className="info-group"><label>Quantité</label><input type="text" value={`${(selectedOperation?.quantite || 0).toLocaleString()} m³`} disabled /></div>
              <div className="info-group"><label>Transporteur *</label><input type="text" value={newLivraison.transporteur} onChange={e => setNewLivraison({...newLivraison, transporteur: e.target.value})} placeholder="Nom du transporteur" required /></div>
              <div className="form-row">
                <div className="info-group"><label>Plaque</label><input type="text" value={newLivraison.plaque} onChange={e => setNewLivraison({...newLivraison, plaque: e.target.value})} placeholder="123 TUN 456" /></div>
                <div className="info-group"><label>Chauffeur</label><input type="text" value={newLivraison.chauffeur} onChange={e => setNewLivraison({...newLivraison, chauffeur: e.target.value})} placeholder="Nom du chauffeur" /></div>
              </div>
              <div className="info-group"><label>Date de livraison</label><input type="date" value={newLivraison.dateLivraison} onChange={e => setNewLivraison({...newLivraison, dateLivraison: e.target.value})} /></div>
              <div className="info-group"><label>Remarques</label><textarea value={newLivraison.remarques} onChange={e => setNewLivraison({...newLivraison, remarques: e.target.value})} rows="3" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCreateLivraison(false)}>Annuler</button>
              <button className="btn-submit" onClick={submitLivraison}>✓ Planifier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommercialDashboard;
