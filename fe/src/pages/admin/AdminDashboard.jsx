import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
  PointElement, LineElement, Filler,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../css/Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
  PointElement, LineElement, Filler,
);

// ============================================================
// CONSTANTES
// ============================================================
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const YEARS  = [0, 2023, 2024, 2025, 2026];
const API    = 'http://localhost:5001/api';
const OBJECTIF_ANNUEL = 1_000_000;

const STATUT_COLORS = {
  en_attente: { badge: 'status-badge warning', text: 'En attente' },
  confirmee:  { badge: 'status-badge success', text: 'Confirmée'  },
  livree:     { badge: 'status-badge info',    text: 'Livrée'     },
  facturee:   { badge: 'status-badge primary', text: 'Facturée'   },
  planifie:   { badge: 'status-badge warning', text: 'Planifié'   },
  en_cours:   { badge: 'status-badge info',    text: 'En cours'   },
  termine:    { badge: 'status-badge success', text: 'Terminé'    },
  annule:     { badge: 'status-badge danger',  text: 'Annulé'     },
};

// ============================================================
// UTILITAIRES
// ============================================================
const getProductName = (item) =>
  item?.produit?.nom || item?.produitId?.nom || '—';

// client peut être un objet { nom, email } ou une string
const getClientName = (item) => {
  if (item?.client?.nom)               return item.client.nom;
  if (typeof item?.client === 'string' && item.client) return item.client;
  if (item?.clientId?.nom)             return item.clientId.nom;
  return '—';
};

const getNavireName = (cabotage) =>
  cabotage?.navireId?.nom || cabotage?.navire?.nom || '—';

const formatCurrency = (v) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', maximumFractionDigits: 0 }).format(v || 0);

const formatVolume = (v) =>
  new Intl.NumberFormat('fr-TN').format(v || 0) + ' m³';

const formatDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return '—'; }
};

const getStatusInfo = (statut) => {
  const key = statut === 'livre' ? 'livree' : (statut || 'en_attente');
  return STATUT_COLORS[key] || STATUT_COLORS.en_attente;
};

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const safeArray = (res) => {
  const d = res?.data?.data ?? res?.data ?? [];
  return Array.isArray(d) ? d : [];
};

const createSheet = (data) => {
  if (!data?.length) return null;
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = Object.keys(data[0]).map(k => ({
    wch: Math.min(Math.max(k.length, ...data.map(r => String(r[k] ?? '').length)) + 2, 30),
  }));
  return ws;
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const AdminDashboard = () => {
  const [loading,           setLoading]          = useState(true);
  const [error,             setError]            = useState(null);
  const [activeVenteTab,    setActiveVenteTab]   = useState('all');
  const [activeCabotageTab, setActiveCabotageTab]= useState('all');
  const [searchTerm,        setSearchTerm]       = useState('');
  const [selectedMonth,     setSelectedMonth]    = useState(new Date().getMonth() + 1);
  const [selectedYear,      setSelectedYear]     = useState(0);   // 0 = toutes années
  const [filterType,        setFilterType]       = useState('year'); // par défaut: tout afficher

  const [ventes,      setVentes]      = useState([]);
  const [cabotages,   setCabotages]   = useState([]);
  const [factures,    setFactures]    = useState([]);
  const [globalStats, setGlobalStats] = useState({ users: 0, contrats: 0 });

  // ── Chargement des données réelles ──────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const h = authHeaders();
      const [vRes, cRes, fRes, uRes, coRes] = await Promise.allSettled([
        axios.get(`${API}/ventes`,   { headers: h }),
        axios.get(`${API}/cabotage`, { headers: h }),
        axios.get(`${API}/factures`, { headers: h }),
        axios.get(`${API}/users`,    { headers: h }),
        axios.get(`${API}/contrats`, { headers: h }),
      ]);
      setVentes(   vRes.status  === 'fulfilled' ? safeArray(vRes.value)  : []);
      setCabotages(cRes.status  === 'fulfilled' ? safeArray(cRes.value)  : []);
      setFactures( fRes.status  === 'fulfilled' ? safeArray(fRes.value)  : []);
      const users    = uRes.status  === 'fulfilled' ? safeArray(uRes.value)  : [];
      const contrats = coRes.status === 'fulfilled' ? safeArray(coRes.value) : [];
      setGlobalStats({ users: users.length, contrats: contrats.length });
    } catch {
      setError('Impossible de charger les données. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtre par date ──────────────────────────────────────────
  // dateField = 'dateVente' pour ventes, 'dateOperation' pour cabotages
  const filterByDate = useCallback((items, dateField) => {
    if (!Array.isArray(items)) return [];
    // Toutes les années + vue annuelle → tout afficher sans filtrer
    if (filterType === 'year' && selectedYear === 0) return items;
    return items.filter(item => {
      const d = new Date(item[dateField]);
      if (isNaN(d.getTime())) return false;
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      if (filterType === 'year')  return y === selectedYear;
      // filterType === 'month'
      if (selectedYear === 0)     return m === selectedMonth;       // mois, toutes années
      return m === selectedMonth && y === selectedYear;             // mois + année précis
    });
  }, [filterType, selectedMonth, selectedYear]);

  // ── Données filtrées ─────────────────────────────────────────
  const ventesFiltrees = useMemo(() => {
    let list = filterByDate(ventes, 'dateVente');
    if (activeVenteTab !== 'all') {
      const norm = activeVenteTab === 'livre' ? 'livree' : activeVenteTab;
      list = list.filter(v => (v.statut === 'livre' ? 'livree' : v.statut) === norm);
    }
    if (searchTerm.trim()) {
      const sl = searchTerm.toLowerCase();
      list = list.filter(v =>
        (v.numeroVente || '').toLowerCase().includes(sl) ||
        getProductName(v).toLowerCase().includes(sl) ||
        getClientName(v).toLowerCase().includes(sl),
      );
    }
    return list;
  }, [ventes, filterByDate, activeVenteTab, searchTerm]);

  const cabotagesFiltres = useMemo(() => {
    // Cabotage utilise dateOperation (pas dateOperation)
    let list = filterByDate(cabotages, 'dateOperation');
    if (activeCabotageTab !== 'all')
      list = list.filter(c => c.statut === activeCabotageTab);
    if (searchTerm.trim()) {
      const sl = searchTerm.toLowerCase();
      list = list.filter(c =>
        (c.numeroCabotage || '').toLowerCase().includes(sl) ||
        (c.origine        || '').toLowerCase().includes(sl) ||
        (c.destination    || '').toLowerCase().includes(sl) ||
        getClientName(c).toLowerCase().includes(sl),
      );
    }
    return list;
  }, [cabotages, filterByDate, activeCabotageTab, searchTerm]);

  // ── Statistiques calculées ────────────────────────────────────
  const statistics = useMemo(() => {
    const vD = filterByDate(ventes,    'dateVente');
    const cD = filterByDate(cabotages, 'dateOperation');

    const totalMontant = vD.reduce((s, v) => s + (v.montantTotal || 0), 0);
    const totalQteV    = vD.reduce((s, v) => s + (v.quantite     || 0), 0);
    const nbVentes     = vD.length;

    const parStatutV = vD.reduce((acc, v) => {
      const k = v.statut === 'livre' ? 'livree' : (v.statut || 'en_attente');
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const parProduit = vD.reduce((acc, v) => {
      const nom = getProductName(v);
      acc[nom] = (acc[nom] || 0) + (v.quantite || 0);
      return acc;
    }, {});

    const totalQteC   = cD.reduce((s, c) => s + (c.quantite || 0), 0);
    const nbCabotages = cD.length;
    const parStatutC  = cD.reduce((acc, c) => {
      const k = c.statut || 'planifie';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const taux = OBJECTIF_ANNUEL > 0 ? (totalQteV / OBJECTIF_ANNUEL) * 100 : 0;

    let variation = 0;
    if (filterType === 'month' && selectedYear !== 0 && selectedMonth > 1) {
      const pm = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const py = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      const prev = ventes.filter(v => {
        const d = new Date(v.dateVente);
        return d.getMonth() + 1 === pm && d.getFullYear() === py;
      });
      const prevQty = prev.reduce((s, v) => s + (v.quantite || 0), 0);
      if (prevQty) variation = ((totalQteV - prevQty) / prevQty) * 100;
    }

    return {
      ventes:    { montantTotal: totalMontant, quantite: totalQteV, nombre: nbVentes, prixMoyen: totalQteV > 0 ? totalMontant / totalQteV : 0, valeurMoyenne: nbVentes > 0 ? totalMontant / nbVentes : 0, parStatut: parStatutV, parProduit, variation },
      cabotages: { quantite: totalQteC, nombre: nbCabotages, valeurMoyenne: nbCabotages > 0 ? totalQteC / nbCabotages : 0, parStatut: parStatutC },
      tauxRealisation: taux,
    };
  }, [ventes, cabotages, filterByDate, filterType, selectedMonth, selectedYear]);

  // ── Métriques financières depuis les vraies factures ─────────
  const financialMetrics = useMemo(() => {
    if (!factures.length) return null;
    const today = new Date();
    let totalCreances = 0, collected = 0, overdue = 0, upcoming = 0;
    const parStatutF = { 'En attente': 0, 'Payée': 0, 'Annulée': 0 };

    factures.forEach(f => {
      parStatutF[f.statut] = (parStatutF[f.statut] || 0) + 1;
      if (f.statut === 'Annulée') return;
      const montant = f.montantTTC || 0;
      totalCreances += montant;
      if (f.statut === 'Payée') {
        collected += montant;
      } else {
        const echeance = new Date(f.dateEcheance);
        if (echeance < today) overdue += montant;
        else upcoming += montant;
      }
    });

    const recoveryRate = totalCreances > 0 ? Math.round((collected / totalCreances) * 100) : 0;
    return { totalCreances, collected, overdue, upcoming, recoveryRate, parStatut: parStatutF, total: factures.length };
  }, [factures]);

  // ── Données graphiques ───────────────────────────────────────
  const chartData = useMemo(() => {
    const ventesParMois    = new Array(12).fill(0);
    const cabotagesParMois = new Array(12).fill(0);

    ventes.forEach(v => {
      const d = new Date(v.dateVente);
      if (isNaN(d.getTime())) return;
      if (selectedYear === 0 || d.getFullYear() === selectedYear)
        ventesParMois[d.getMonth()] += v.quantite || 0;
    });

    cabotages.forEach(c => {
      const d = new Date(c.dateOperation);
      if (isNaN(d.getTime())) return;
      if (selectedYear === 0 || d.getFullYear() === selectedYear)
        cabotagesParMois[d.getMonth()] += c.quantite || 0;
    });

    let cumulativeData = null;
    if (selectedYear !== 0) {
      let cv = 0, cc = 0;
      const vCumul = [], cCumul = [];
      for (let i = 0; i < 12; i++) {
        cv += ventesParMois[i]; vCumul.push(cv);
        cc += cabotagesParMois[i]; cCumul.push(cc);
      }
      cumulativeData = { ventes: vCumul, cabotage: cCumul };
    }

    return { monthlyData: { ventes: ventesParMois, cabotage: cabotagesParMois }, cumulativeData };
  }, [ventes, cabotages, selectedYear]);

  const monthLabels = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];

  const barChartData = {
    labels: monthLabels,
    datasets: [
      { label: `Ventes STEG (m³)${selectedYear ? ` ${selectedYear}` : ''}`,   data: chartData.monthlyData.ventes,   backgroundColor: '#1a3c5e', borderRadius: 8 },
      { label: `Cabotage STIR (m³)${selectedYear ? ` ${selectedYear}` : ''}`, data: chartData.monthlyData.cabotage, backgroundColor: '#3d5e7e', borderRadius: 8 },
    ],
  };

  const pieChartData = useMemo(() => {
    const labels = Object.keys(statistics.ventes.parProduit);
    return {
      labels: labels.length ? labels : ['Aucune donnée'],
      datasets: [{
        data: labels.length ? Object.values(statistics.ventes.parProduit) : [1],
        backgroundColor: ['#1a3c5e','#2c4c6e','#3d5e7e','#4e6e8e','#5f7e9e','#708eae'],
        borderWidth: 0,
      }],
    };
  }, [statistics.ventes.parProduit]);

  const lineChartData = chartData.cumulativeData ? {
    labels: monthLabels,
    datasets: [
      { label: `Cumul Ventes STEG (m³) ${selectedYear}`,   data: chartData.cumulativeData.ventes,   borderColor: '#1a3c5e', backgroundColor: 'rgba(26,60,94,0.1)',  fill: true, tension: 0.4 },
      { label: `Cumul Cabotage STIR (m³) ${selectedYear}`, data: chartData.cumulativeData.cabotage, borderColor: '#3d5e7e', backgroundColor: 'rgba(61,94,126,0.1)', fill: true, tension: 0.4 },
    ],
  } : null;

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, borderRadius: 8 },
    },
  };

  // ── Exports ──────────────────────────────────────────────────
  const suffix = selectedYear === 0 ? 'toutes_annees' : `${selectedYear}-${selectedMonth}`;

  const exportVentes = useCallback(() => {
    if (!ventesFiltrees.length) { alert('Aucune vente'); return; }
    const rows = ventesFiltrees.map(v => ({
      'N° Vente': v.numeroVente, 'Date': formatDate(v.dateVente), 'Client': getClientName(v),
      'Produit': getProductName(v), 'Quantité (m³)': v.quantite,
      'Prix Unitaire (DT)': v.prixUnitaire, 'Montant Total (DT)': v.montantTotal,
      'Statut': getStatusInfo(v.statut).text,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, createSheet(rows), 'Ventes STEG');
    saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), `Ventes_STEG_${suffix}.xlsx`);
  }, [ventesFiltrees, suffix]);

  const exportCabotages = useCallback(() => {
    if (!cabotagesFiltres.length) { alert('Aucun cabotage'); return; }
    const rows = cabotagesFiltres.map(c => ({
      'N° Opération': c.numeroCabotage, 'Date': formatDate(c.dateOperation), 'Client': getClientName(c),
      'Origine': c.origine, 'Destination': c.destination, 'Quantité (m³)': c.quantite,
      'Navire': getNavireName(c), 'Statut': getStatusInfo(c.statut).text,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, createSheet(rows), 'Cabotage STIR');
    saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' }), { type: 'application/octet-stream' }]), `Cabotage_STIR_${suffix}.xlsx`);
  }, [cabotagesFiltres, suffix]);

  const exportAll = useCallback(() => {
    const wb = XLSX.utils.book_new();
    if (ventesFiltrees.length) {
      XLSX.utils.book_append_sheet(wb, createSheet(ventesFiltrees.map(v => ({
        'N° Vente': v.numeroVente, 'Date': formatDate(v.dateVente), 'Client': getClientName(v),
        'Produit': getProductName(v), 'Quantité (m³)': v.quantite,
        'Prix (DT)': v.prixUnitaire, 'Montant (DT)': v.montantTotal,
        'Statut': getStatusInfo(v.statut).text,
      }))), 'Ventes STEG');
    }
    if (cabotagesFiltres.length) {
      XLSX.utils.book_append_sheet(wb, createSheet(cabotagesFiltres.map(c => ({
        'N° Op': c.numeroCabotage, 'Date': formatDate(c.dateOperation), 'Client': getClientName(c),
        'Origine': c.origine, 'Destination': c.destination, 'Quantité (m³)': c.quantite,
        'Navire': getNavireName(c), 'Statut': getStatusInfo(c.statut).text,
      }))), 'Cabotage STIR');
    }
    if (wb.SheetNames.length)
      saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), `SMART-TRADE_360_Dashboard_${suffix}.xlsx`);
    else alert('Aucune donnée');
  }, [ventesFiltrees, cabotagesFiltres, suffix]);

  // Export PDF (au lieu de CSV)
  const exportPDF = useCallback((type) => {
    const list = type === 'ventes' ? ventesFiltrees : cabotagesFiltres;
    if (!list.length) { alert('Aucune donnée à exporter'); return; }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = 297;
    const marginX = 15;
    let y = 18;

    // Titre
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(12, 44, 92);
    const titre = type === 'ventes' ? 'RAPPORT DES VENTES SMART-TRADE 360' : 'RAPPORT CABOTAGE SMART-TRADE 360';
    doc.text(titre, pageW / 2, y, { align: 'center' });

    y += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Periode: ${suffix}`, pageW / 2, y, { align: 'center' });

    y += 6;
    doc.setDrawColor(180, 200, 220);
    doc.line(marginX, y, pageW - marginX, y);
    y += 8;

    if (type === 'ventes') {
      const head = [['N°', 'Date', 'Client', 'Produit', 'Qte (m3)', 'Prix (DT)', 'Montant (DT)', 'Statut']];
      const body = ventesFiltrees.map(v => [
        v.numeroVente || 'N/A',
        formatDate(v.dateVente),
        getClientName(v),
        getProductName(v),
        (v.quantite || 0).toString(),
        (v.prixUnitaire || 0).toFixed(2),
        (v.montantTotal || 0).toFixed(2),
        getStatusInfo(v.statut).text
      ]);

      autoTable(doc, {
        startY: y,
        head, body,
        theme: 'striped',
        headStyles: { fillColor: [12, 44, 92], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        margin: { left: marginX, right: marginX },
      });

      const total = ventesFiltrees.reduce((s, v) => s + (v.montantTotal || 0), 0);
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(12, 44, 92);
      doc.text(`TOTAL VENTES: ${total.toFixed(2)} DT`, pageW - marginX, finalY, { align: 'right' });
    } else {
      const head = [['N°', 'Date', 'Client', 'Origine', 'Destination', 'Qte (m3)', 'Navire', 'Statut']];
      const body = cabotagesFiltres.map(c => [
        c.numeroCabotage || 'N/A',
        formatDate(c.dateOperation),
        getClientName(c),
        c.origine || 'N/A',
        c.destination || 'N/A',
        (c.quantite || 0).toString(),
        getNavireName(c),
        getStatusInfo(c.statut).text
      ]);

      autoTable(doc, {
        startY: y,
        head, body,
        theme: 'striped',
        headStyles: { fillColor: [12, 44, 92], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        margin: { left: marginX, right: marginX },
      });
    }

    // Pied de page
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR')} - SMART-TRADE 360°`,
             pageW / 2, pageH - 8, { align: 'center' });

    const fileName = `${type === 'ventes' ? 'Ventes_STEG' : 'Cabotage_STIR'}_SMART-TRADE-360_${suffix}.pdf`;
    doc.save(fileName);
  }, [ventesFiltrees, cabotagesFiltres, suffix]);

  // ── Rendu ────────────────────────────────────────────────────
  if (loading) return <div className="admin-dashboard-loading"><div className="spinner" /><p>⏳ Chargement des données...</p></div>;
  if (error)   return <div className="admin-dashboard-error"><p>⚠️ {error}</p><button onClick={fetchAll}>🔄 Réessayer</button></div>;

  const periodText =
    filterType === 'year' && selectedYear === 0 ? '📆 Toutes les années (tout afficher)' :
    filterType === 'year'  ? `📆 Année ${selectedYear}` :
    selectedYear === 0     ? `📅 ${MONTHS[selectedMonth - 1]} (toutes années)` :
                             `📅 ${MONTHS[selectedMonth - 1]} ${selectedYear}`;
  const totalVentes    = filterByDate(ventes,    'dateVente').length;
  const totalCabotages = filterByDate(cabotages, 'dateOperation').length;

  return (
    <div className="admin-dashboard">

      {/* ── En-tête ──────────────────────────────────────────── */}
      <div className="dashboard-header">
        <h1>📊 Dashboard Administrateur SMART-TRADE 360°</h1>
        <p>Ventes STEG &amp; Cabotage STIR — Période : <strong>{periodText}</strong></p>
      </div>

      {/* ── Filtres ──────────────────────────────────────────── */}
      <div className="dashboard-filters">
        <div className="filter-group">
          <label>Période :</label>
          <div className="filter-buttons">
            <button className={`filter-btn ${filterType === 'month' ? 'active' : ''}`} onClick={() => setFilterType('month')}>📅 Mensuel</button>
            <button className={`filter-btn ${filterType === 'year'  ? 'active' : ''}`} onClick={() => setFilterType('year')}>📆 Annuel</button>
          </div>
        </div>
        {filterType === 'month' && (
          <div className="filter-group">
            <label>Mois :</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}>
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
        )}
        <div className="filter-group">
          <label>Année :</label>
          <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y === 0 ? 'Toutes' : y}</option>)}
          </select>
        </div>
        <div className="filter-group" style={{ flex: 1 }}>
          <label>🔍 Recherche :</label>
          <input
            type="text"
            className="search-input"
            placeholder="N°, produit, client, origine…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── Boutons export ───────────────────────────────────── */}
      <div className="export-buttons">
        <button className="btn-export"     onClick={exportVentes}>📎 Ventes (Excel)</button>
        <button className="btn-export"     onClick={exportCabotages}>📎 Cabotage (Excel)</button>
        <button className="btn-export-all" onClick={exportAll}>📊 Tout (Excel)</button>
        <button className="btn-export-pdf" onClick={() => exportPDF('ventes')}>📄 Ventes (PDF)</button>
        <button className="btn-export-pdf" onClick={() => exportPDF('cabotages')}>📄 Cabotage (PDF)</button>
        <button className="btn-export" style={{ marginLeft: 'auto' }} onClick={fetchAll}>🔄 Actualiser</button>
      </div>

      {/* ── KPIs principaux ──────────────────────────────────── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">🏭</div>
          <div className="kpi-content">
            <span className="kpi-label">Ventes STEG</span>
            <span className="kpi-value">{formatVolume(statistics.ventes.quantite)}</span>
            <span className={`kpi-trend ${statistics.ventes.variation >= 0 ? 'up' : 'down'}`}>
              {statistics.ventes.variation !== 0 && `${statistics.ventes.variation >= 0 ? '↑' : '↓'} ${Math.abs(statistics.ventes.variation).toFixed(1)}%`}
            </span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">⛴️</div>
          <div className="kpi-content">
            <span className="kpi-label">Cabotage STIR</span>
            <span className="kpi-value">{formatVolume(statistics.cabotages.quantite)}</span>
            <span className="kpi-trend">{statistics.cabotages.nombre} opérations</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <span className="kpi-label">Chiffre d&apos;Affaires</span>
            <span className="kpi-value">{formatCurrency(statistics.ventes.montantTotal)}</span>
            <span className="kpi-trend">Moy. {formatCurrency(statistics.ventes.valeurMoyenne)}/vente</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <span className="kpi-label">Volume Total</span>
            <span className="kpi-value">{formatVolume(statistics.ventes.quantite + statistics.cabotages.quantite)}</span>
            <span className="kpi-trend">{statistics.ventes.nombre} ventes + {statistics.cabotages.nombre} cab.</span>
          </div>
        </div>
      </div>

      {/* ── Stats secondaires ─────────────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-title">Prix Moyen/m³</div><div className="stat-large">{statistics.ventes.prixMoyen.toFixed(2)} DT</div><div className="stat-sub">Prix unitaire moyen</div></div>
        <div className="stat-card"><div className="stat-title">Transactions</div><div className="stat-large">{statistics.ventes.nombre + statistics.cabotages.nombre}</div><div className="stat-sub">{statistics.ventes.nombre}V + {statistics.cabotages.nombre}C</div></div>
        <div className="stat-card"><div className="stat-title">Vol. Moy./Cabotage</div><div className="stat-large">{statistics.cabotages.valeurMoyenne.toFixed(0)} m³</div><div className="stat-sub">Par opération</div></div>
        <div className="stat-card"><div className="stat-title">Utilisateurs</div><div className="stat-large">{globalStats.users}</div><div className="stat-sub">Comptes enregistrés</div></div>
        <div className="stat-card"><div className="stat-title">Ventes Confirmées</div><div className="stat-large">{statistics.ventes.parStatut.confirmee || 0}</div><div className="stat-sub">En attente : {statistics.ventes.parStatut.en_attente || 0}</div></div>
        <div className="stat-card"><div className="stat-title">Ventes Livrées</div><div className="stat-large">{statistics.ventes.parStatut.livree || 0}</div><div className="stat-sub">Facturées : {statistics.ventes.parStatut.facturee || 0}</div></div>
      </div>

      {/* ── Barre de progression ─────────────────────────────── */}
      <div className="progress-section">
        <div className="progress-card">
          <div className="progress-header">
            <span>Objectif Ventes {selectedYear || 'Global'}</span>
            <span>{statistics.tauxRealisation.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(statistics.tauxRealisation, 100)}%` }} role="progressbar" />
          </div>
          <div className="progress-footer">
            <span>{formatVolume(statistics.ventes.quantite)}</span>
            <span>Objectif : {formatVolume(OBJECTIF_ANNUEL)}</span>
          </div>
        </div>
      </div>

      {/* ── Graphiques ───────────────────────────────────────── */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header"><h3>📊 Production Mensuelle {selectedYear || '(toutes années)'}</h3></div>
          <div className="chart-container"><Bar data={barChartData} options={chartOptions} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-header"><h3>🥧 Répartition par Produit</h3></div>
          <div className="chart-container small">
            {Object.keys(statistics.ventes.parProduit).length
              ? <Pie data={pieChartData} options={chartOptions} />
              : <div className="no-data-placeholder">Aucune donnée pour cette période</div>}
          </div>
        </div>
      </div>

      {lineChartData && (
        <div className="charts-row">
          <div className="chart-card full">
            <div className="chart-header"><h3>📈 Évolution Cumulative — {selectedYear}</h3></div>
            <div className="chart-container"><Line data={lineChartData} options={chartOptions} /></div>
          </div>
        </div>
      )}

      {/* ── Indicateurs financiers (vraies factures) ─────────── */}
      {financialMetrics && (
        <>
          <div className="financial-header" style={{ marginTop: '2rem' }}>
            <h2>💰 Indicateurs Financiers — {financialMetrics.total} factures</h2>
          </div>
          <div className="kpi-grid">
            <div className="kpi-card"><div className="kpi-icon">💶</div><div className="kpi-content"><span className="kpi-label">Créances totales</span><span className="kpi-value">{formatCurrency(financialMetrics.totalCreances)}</span></div></div>
            <div className="kpi-card"><div className="kpi-icon">✅</div><div className="kpi-content"><span className="kpi-label">Encaissé</span><span className="kpi-value">{formatCurrency(financialMetrics.collected)}</span><span className="kpi-trend">Taux : {financialMetrics.recoveryRate}%</span></div></div>
            <div className="kpi-card"><div className="kpi-icon">⚠️</div><div className="kpi-content"><span className="kpi-label">Impayés</span><span className="kpi-value">{formatCurrency(financialMetrics.overdue)}</span></div></div>
            <div className="kpi-card"><div className="kpi-icon">⏳</div><div className="kpi-content"><span className="kpi-label">À venir</span><span className="kpi-value">{formatCurrency(financialMetrics.upcoming)}</span></div></div>
          </div>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card"><div className="stat-title">Factures Payées</div><div className="stat-large">{financialMetrics.parStatut['Payée'] || 0}</div></div>
            <div className="stat-card"><div className="stat-title">En Attente</div><div className="stat-large">{financialMetrics.parStatut['En attente'] || 0}</div></div>
            <div className="stat-card"><div className="stat-title">Annulées</div><div className="stat-large">{financialMetrics.parStatut['Annulée'] || 0}</div></div>
            <div className="stat-card"><div className="stat-title">Taux Recouvrement</div><div className="stat-large">{financialMetrics.recoveryRate}%</div></div>
          </div>
        </>
      )}

      {/* ── Détails Ventes ────────────────────────────────────── */}
      <VentesSection
        data={ventesFiltrees}
        total={totalVentes}
        activeTab={activeVenteTab}
        onTabChange={setActiveVenteTab}
        statistics={statistics.ventes}
      />

      {/* ── Détails Cabotage ──────────────────────────────────── */}
      <CabotagesSection
        data={cabotagesFiltres}
        total={totalCabotages}
        activeTab={activeCabotageTab}
        onTabChange={setActiveCabotageTab}
        statistics={statistics.cabotages}
      />
    </div>
  );
};

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

const VentesSection = ({ data, total, activeTab, onTabChange, statistics }) => (
  <div className="details-section">
    <div className="section-header">
      <h3>📋 Détails des Ventes STEG</h3>
      <div className="section-stats">
        <span className="section-badge">{data.length} / {total} transactions</span>
        <div className="status-tabs">
          {['all','en_attente','confirmee','livree','facturee'].map(tab => (
            <button
              key={tab}
              role="tab"
              className={`status-tab ${activeTab === tab ? 'active' : ''} ${tab !== 'all' ? (STATUT_COLORS[tab]?.badge.split(' ')[1] || '') : ''}`}
              onClick={() => onTabChange(tab)}
            >
              {tab === 'all' ? 'Tous' : STATUT_COLORS[tab]?.text || tab}
              {' '}({tab === 'all' ? total : (statistics.parStatut[tab] || 0)})
            </button>
          ))}
        </div>
      </div>
    </div>
    <div className="table-container">
      <table className="details-table">
        <thead>
          <tr>
            <th>N° Vente</th><th>Date</th><th>Client</th><th>Produit</th>
            <th>Qté (m³)</th><th>Prix (DT)</th><th>Montant (DT)</th><th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {data.length ? data.map((v, i) => (
            <tr key={v._id || i}>
              <td><strong>{v.numeroVente}</strong></td>
              <td>{formatDate(v.dateVente)}</td>
              <td>{getClientName(v)}</td>
              <td>{getProductName(v)}</td>
              <td>{(v.quantite    || 0).toLocaleString()} m³</td>
              <td>{(v.prixUnitaire|| 0).toLocaleString()} DT</td>
              <td><strong>{(v.montantTotal || 0).toLocaleString()} DT</strong></td>
              <td><span className={getStatusInfo(v.statut).badge}>{getStatusInfo(v.statut).text}</span></td>
            </tr>
          )) : (
            <tr className="no-data-row">
              <td colSpan="8"><div className="no-data-cell">Aucune vente trouvée pour cette période</div></td>
            </tr>
          )}
        </tbody>
        {data.length > 0 && (
          <tfoot>
            <tr className="table-footer">
              <td colSpan="4"><strong>Total</strong></td>
              <td><strong>{data.reduce((s, v) => s + (v.quantite    || 0), 0).toLocaleString()} m³</strong></td>
              <td>—</td>
              <td><strong>{data.reduce((s, v) => s + (v.montantTotal|| 0), 0).toLocaleString()} DT</strong></td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  </div>
);

const CabotagesSection = ({ data, total, activeTab, onTabChange, statistics }) => (
  <div className="details-section">
    <div className="section-header">
      <h3>🚢 Détails des Opérations Cabotage STIR</h3>
      <div className="section-stats">
        <span className="section-badge">{data.length} / {total} opérations</span>
        <div className="status-tabs">
          {['all','planifie','en_cours','termine','annule'].map(tab => (
            <button
              key={tab}
              role="tab"
              className={`status-tab ${activeTab === tab ? 'active' : ''} ${tab !== 'all' ? (STATUT_COLORS[tab]?.badge.split(' ')[1] || '') : ''}`}
              onClick={() => onTabChange(tab)}
            >
              {tab === 'all' ? 'Tous' : STATUT_COLORS[tab]?.text || tab}
              {' '}({tab === 'all' ? total : (statistics.parStatut[tab] || 0)})
            </button>
          ))}
        </div>
      </div>
    </div>
    <div className="table-container">
      <table className="details-table">
        <thead>
          <tr>
            <th>N° Opération</th><th>Date Opération</th><th>Client</th><th>Origine</th>
            <th>Destination</th><th>Qté (m³)</th><th>Navire</th><th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {data.length ? data.map((c, i) => (
            <tr key={c._id || i}>
              <td><strong>{c.numeroCabotage}</strong></td>
              <td>{formatDate(c.dateOperation)}</td>
              <td>{getClientName(c)}</td>
              <td>{c.origine      || '—'}</td>
              <td>{c.destination  || '—'}</td>
              <td>{(c.quantite || 0).toLocaleString()} m³</td>
              <td>{getNavireName(c)}</td>
              <td><span className={getStatusInfo(c.statut).badge}>{getStatusInfo(c.statut).text}</span></td>
            </tr>
          )) : (
            <tr className="no-data-row">
              <td colSpan="8"><div className="no-data-cell">Aucune opération trouvée pour cette période</div></td>
            </tr>
          )}
        </tbody>
        {data.length > 0 && (
          <tfoot>
            <tr className="table-footer">
              <td colSpan="5"><strong>Total</strong></td>
              <td><strong>{data.reduce((s, c) => s + (c.quantite || 0), 0).toLocaleString()} m³</strong></td>
              <td colSpan="2" />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  </div>
);

export default AdminDashboard;
