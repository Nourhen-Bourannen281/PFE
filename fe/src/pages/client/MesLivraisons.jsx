// pages/client/MesLivraisons.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/MesLivraisons.css';

const MOCK_LIVRAISONS = [
  {
    _id: 'LIV001',
    numeroLivraison: 'LIV-2026-0001',
    numeroCommande: 'CMD-2026-0001',
    clientId: 'client123',
    clientNom: 'Ahmed Ben Ali',
    dateLivraison: '2026-05-10',
    heureLivraison: '10:30',
    statut: 'Livrée',
    dateReception: '2026-05-10',
    heureReception: '11:15',
    signature: true,
    signataire: 'Ahmed Ben Ali',
    adresse: '123 Avenue Habib Bourguiba, Tunis Centre, Tunisie',
    codePostal: '1000',
    transporteur: 'STEG Express',
    telephone: '+216 98 456 789',
    email: 'suivi@stegexpress.tn',
    montant: 320.500,
    modeLivraison: 'Standard',
    poids: '150 kg',
    suivis: [
      { date: '2026-05-10 08:00', statut: 'Préparation de la commande', lieu: 'Entrepôt STEG Tunis' },
      { date: '2026-05-10 09:30', statut: 'Chargement du camion',       lieu: 'Entrepôt STEG Tunis' },
      { date: '2026-05-10 10:30', statut: 'En cours de livraison',      lieu: 'En route'             },
      { date: '2026-05-10 11:15', statut: 'Livrée',                     lieu: 'Tunis Centre'         },
    ],
    produits: [
      { id: 'P1', nom: 'Électricité Basse Tension', quantite: 1000, uniteMesure: 'kWh', prixUnitaire: 0.320 },
    ],
  },
  {
    _id: 'LIV002',
    numeroLivraison: 'LIV-2026-0002',
    numeroCommande: 'CMD-2026-0002',
    clientId: 'client123',
    clientNom: 'Ahmed Ben Ali',
    dateLivraison: '2026-05-12',
    heureLivraison: '14:00',
    statut: 'En cours',
    statutDetail: 'Livreur en route',
    positionLivreur: 'À 5 km',
    dureeEstimee: '15 min',
    adresse: "Route de l'Aéroport, Sfax, Tunisie",
    codePostal: '3000',
    transporteur: 'STEG Distribution',
    telephone: '+216 25 111 222',
    email: 'suivi@stegdistribution.tn',
    montant: 150.200,
    modeLivraison: 'Express',
    poids: '75 kg',
    suivis: [
      { date: '2026-05-12 08:00', statut: 'Préparation de la commande', lieu: 'Entrepôt STEG Sfax' },
      { date: '2026-05-12 10:30', statut: 'Chargement du camion',       lieu: 'Entrepôt STEG Sfax' },
      { date: '2026-05-12 13:00', statut: 'En cours de livraison',      lieu: 'En route'            },
    ],
    produits: [
      { id: 'P2', nom: 'Gaz Naturel Domestique', quantite: 500, uniteMesure: 'm³', prixUnitaire: 0.280 },
    ],
  },
  {
    _id: 'LIV003',
    numeroLivraison: 'LIV-2026-0003',
    numeroCommande: 'CMD-2026-0003',
    clientId: 'client123',
    clientNom: 'Ahmed Ben Ali',
    dateLivraison: '2026-05-15',
    heureLivraison: '09:15',
    statut: 'En attente',
    adresse: 'Boulevard 14 Janvier, Sousse, Tunisie',
    codePostal: '4000',
    transporteur: 'STEG Service',
    telephone: '+216 55 777 888',
    email: 'service@steg.tn',
    montant: 500.000,
    modeLivraison: 'Standard',
    poids: '25 kg',
    suivis: [
      { date: '2026-05-14 14:00', statut: 'Commande validée', lieu: 'Système STEG' },
    ],
    produits: [
      { id: 'P3', nom: 'Compteur Électrique Intelligent', quantite: 2, uniteMesure: 'Unité', prixUnitaire: 250 },
    ],
  },
];

function MesLivraisons() {
  const navigate = useNavigate();

  // ── Auth ────────────────────────────────────────────────────
  const isAuthenticated = useMemo(() => {
    return !!(localStorage.getItem('token') && localStorage.getItem('user'));
  }, []);

  // ── Client connecté ─────────────────────────────────────────
  const currentClient = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  // ── State ────────────────────────────────────────────────────
  const [livraisons]           = useState(MOCK_LIVRAISONS);
  const [filterStatut, setFilterStatut]           = useState('tous');
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedLivraison, setSelectedLivraison] = useState(null);

  // ── Redirect si non auth ─────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      const t = setTimeout(() => navigate('/login'), 2000);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, navigate]);

  // ── Livraisons du client connecté ────────────────────────────
  const clientLivraisons = useMemo(() => livraisons, [livraisons]);


  // ── Filtrage ──────────────────────────────────────────────────
  const filteredLivraisons = useMemo(() => {
    switch (filterStatut) {
      case 'livrees': return clientLivraisons.filter(l => l.statut === 'Livrée');
      case 'encours': return clientLivraisons.filter(l => l.statut === 'En cours');
      case 'attente': return clientLivraisons.filter(l => l.statut === 'En attente');
      default:        return clientLivraisons;
    }
  }, [clientLivraisons, filterStatut]);

  // ── Compteurs ─────────────────────────────────────────────────
  const counts = useMemo(() => ({
    total:   clientLivraisons.length,
    livrees: clientLivraisons.filter(l => l.statut === 'Livrée').length,
    encours: clientLivraisons.filter(l => l.statut === 'En cours').length,
    attente: clientLivraisons.filter(l => l.statut === 'En attente').length,
  }), [clientLivraisons]);

  // ── Helpers ───────────────────────────────────────────────────
  const formatPrix = useCallback((prix) =>
    new Intl.NumberFormat('fr-TN', {
      style: 'currency', currency: 'TND',
      minimumFractionDigits: 3, maximumFractionDigits: 3,
    }).format(prix), []);

  const getFrenchDate = useCallback((dateStr) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }), []);

  const getStatusClass = (statut) => {
    const map = { 'Livrée': 'status-livree', 'En cours': 'status-encours', 'En attente': 'status-attente' };
    return map[statut] || '';
  };

  const getStatusIcon = (statut) => {
    const map = { 'Livrée': '✅', 'En cours': '🚚', 'En attente': '⏳' };
    return map[statut] || '📦';
  };

  const openTracking = useCallback((livraison) => {
    setSelectedLivraison(livraison);
    setShowTrackingModal(true);
  }, []);

  // ── Guard ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="auth-guard">
        <span>🔒</span>
        <h2>Accès non autorisé</h2>
        <p>Redirection vers la connexion...</p>
      </div>
    );
  }

  const clientName = currentClient.nom || currentClient.name || 'Client';

  return (
    <div className="mes-livraisons-page">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="ml-header">
        <div className="ml-header-left">
          <span className="ml-header-icon">🚚</span>
          <div>
            <h1>Suivi de mes livraisons</h1>
            <p>Bonjour <strong>{clientName}</strong> · Historique et suivi en temps réel</p>
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="ml-stats">
        <div className="ml-stat-card ml-stat-total">
          <span className="ml-stat-icon">📦</span>
          <div><div className="ml-stat-num">{counts.total}</div><div className="ml-stat-label">Total</div></div>
        </div>
        <div className="ml-stat-card ml-stat-livree">
          <span className="ml-stat-icon">✅</span>
          <div><div className="ml-stat-num">{counts.livrees}</div><div className="ml-stat-label">Livrées</div></div>
        </div>
        <div className="ml-stat-card ml-stat-encours">
          <span className="ml-stat-icon">🚚</span>
          <div><div className="ml-stat-num">{counts.encours}</div><div className="ml-stat-label">En cours</div></div>
        </div>
        <div className="ml-stat-card ml-stat-attente">
          <span className="ml-stat-icon">⏳</span>
          <div><div className="ml-stat-num">{counts.attente}</div><div className="ml-stat-label">En attente</div></div>
        </div>
      </div>

      {/* ── Filtres ─────────────────────────────────────────── */}
      <div className="ml-filters">
        {[
          { key: 'tous',    label: 'Toutes',     count: counts.total   },
          { key: 'livrees', label: 'Livrées',    count: counts.livrees },
          { key: 'encours', label: 'En cours',   count: counts.encours },
          { key: 'attente', label: 'En attente', count: counts.attente },
        ].map(f => (
          <button
            key={f.key}
            className={`ml-filter-btn ${filterStatut === f.key ? 'active' : ''} filter-${f.key}`}
            onClick={() => setFilterStatut(f.key)}
          >
            {f.label} <span className="ml-filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      {/* ── Liste ───────────────────────────────────────────── */}
      <div className="ml-list">
        {filteredLivraisons.length === 0 ? (
          <div className="ml-empty">
            <span>📭</span>
            <h3>Aucune livraison trouvée</h3>
            <p>Aucune livraison dans cette catégorie pour le moment.</p>
          </div>
        ) : (
          filteredLivraisons.map(livraison => (
            <div key={livraison._id} className={`ml-card ml-card-${getStatusClass(livraison.statut)}`}>

              {/* Card header */}
              <div className="ml-card-header">
                <div className="ml-card-header-left">
                  <span className="ml-card-ref">{livraison.numeroLivraison}</span>
                  <span className="ml-card-cmd">Commande : {livraison.numeroCommande}</span>
                  <span className="ml-card-date">
                    📅 {getFrenchDate(livraison.dateLivraison)} · 🕒 {livraison.heureLivraison}
                  </span>
                </div>
                <div className={`ml-status-badge ${getStatusClass(livraison.statut)}`}>
                  {getStatusIcon(livraison.statut)} {livraison.statut}
                </div>
              </div>

              {/* Badges */}
              <div className="ml-badges">
                <span className="ml-badge ml-badge-mode">
                  {livraison.modeLivraison === 'Express' ? '⚡' : '📦'} {livraison.modeLivraison}
                </span>
                <span className="ml-badge ml-badge-poids">⚖️ {livraison.poids}</span>
              </div>

              {/* Réception (si livrée) */}
              {livraison.statut === 'Livrée' && livraison.dateReception && (
                <div className="ml-reception">
                  ✅ Reçue le {new Date(livraison.dateReception).toLocaleDateString('fr-FR')} à {livraison.heureReception}
                  {livraison.signature && <span> · Signé par <strong>{livraison.signataire}</strong></span>}
                </div>
              )}

              {/* Progression (si en cours) */}
              {livraison.statut === 'En cours' && (
                <div className="ml-progress-section">
                  <div className="ml-progress-steps">
                    <div className="ml-step completed"><span>📦</span><small>Commandée</small></div>
                    <div className="ml-step-line completed" />
                    <div className="ml-step active"><span>🚚</span><small>{livraison.statutDetail || 'En livraison'}</small></div>
                    <div className="ml-step-line" />
                    <div className="ml-step"><span>✅</span><small>Livrée</small></div>
                  </div>
                  <div className="ml-live-info">
                    {livraison.positionLivreur && <span>📍 {livraison.positionLivreur}</span>}
                    {livraison.dureeEstimee    && <span>⏱️ Dans {livraison.dureeEstimee}</span>}
                  </div>
                </div>
              )}

              {/* En attente */}
              {livraison.statut === 'En attente' && (
                <div className="ml-attente-section">
                  <p>⏳ Votre commande est en cours de préparation</p>
                  <div className="ml-bar"><div className="ml-bar-fill" style={{ width: '30%' }} /></div>
                </div>
              )}

              {/* Body : adresse + transporteur + produits */}
              <div className="ml-card-body">
                <div className="ml-info-block">
                  <h4>📍 Adresse</h4>
                  <p>{livraison.adresse}</p>
                  <span className="ml-postal">Code postal : {livraison.codePostal}</span>
                </div>

                <div className="ml-info-block">
                  <h4>🚛 Transporteur</h4>
                  <p className="ml-transporter-name">{livraison.transporteur}</p>
                  <div className="ml-contacts">
                    <span>📞 {livraison.telephone}</span>
                    <span>✉️ {livraison.email}</span>
                  </div>
                </div>
              </div>

              {/* Produits */}
              <div className="ml-produits">
                <h4>⚡ Produits commandés</h4>
                <div className="ml-produits-table">
                  <div className="ml-produits-head">
                    <span>Produit</span><span>Qté</span><span>Prix unit.</span><span>Total</span>
                  </div>
                  {livraison.produits.map((p, i) => (
                    <div key={i} className="ml-produits-row">
                      <span>⚡ {p.nom}</span>
                      <span>{p.quantite} {p.uniteMesure}</span>
                      <span>{formatPrix(p.prixUnitaire)}</span>
                      <span className="ml-prod-total">{formatPrix(p.quantite * p.prixUnitaire)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="ml-card-footer">
                <div className="ml-total">
                  Total TTC : <strong>{formatPrix(livraison.montant)}</strong>
                </div>
                <div className="ml-card-actions">
                  {livraison.statut === 'Livrée' && (
                    <button className="ml-btn ml-btn-receipt"
                      onClick={() => alert(`✅ Livraison ${livraison.numeroLivraison} confirmée\n\nUn reçu a été envoyé par email.`)}>
                      📄 Télécharger reçu
                    </button>
                  )}
                  {livraison.statut === 'En cours' && (
                    <button className="ml-btn ml-btn-track" onClick={() => openTracking(livraison)}>
                      📍 Suivre en direct
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ── Modal Tracking ───────────────────────────────────── */}
      {showTrackingModal && selectedLivraison && (
        <div className="ml-modal-overlay" onClick={() => setShowTrackingModal(false)}>
          <div className="ml-modal" onClick={e => e.stopPropagation()}>
            <div className="ml-modal-header">
              <div>
                <h2>📍 Suivi en temps réel</h2>
                <p>{selectedLivraison.numeroLivraison}</p>
              </div>
              <button className="ml-modal-close" onClick={() => setShowTrackingModal(false)}>✕</button>
            </div>

            <div className="ml-modal-body">
              <div className="ml-tracking-status">
                <span className="ml-tracking-badge">
                  🚚 {selectedLivraison.statutDetail || selectedLivraison.statut}
                </span>
                {selectedLivraison.positionLivreur && (
                  <span className="ml-tracking-pos">📍 {selectedLivraison.positionLivreur}</span>
                )}
                {selectedLivraison.dureeEstimee && (
                  <span className="ml-tracking-eta">⏱️ Dans {selectedLivraison.dureeEstimee}</span>
                )}
              </div>

              <div className="ml-map-placeholder">
                <span>🗺️</span>
                <p>Carte de localisation en temps réel</p>
              </div>

              <div className="ml-timeline-section">
                <h4>Historique de suivi</h4>
                <div className="ml-timeline">
                  {[...selectedLivraison.suivis].reverse().map((s, i) => (
                    <div key={i} className={`ml-timeline-item ${i === 0 ? 'current' : ''}`}>
                      <div className="ml-tl-dot" />
                      <div className="ml-tl-content">
                        <div className="ml-tl-date">{s.date}</div>
                        <div className="ml-tl-status">{s.statut}</div>
                        <div className="ml-tl-lieu">{s.lieu}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ml-modal-footer">
              <button className="ml-btn ml-btn-close" onClick={() => setShowTrackingModal(false)}>
                Fermer
              </button>
              <button className="ml-btn ml-btn-notify"
                onClick={() => alert('🔔 Vous serez notifié des prochaines mises à jour')}>
                🔔 Recevoir des notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MesLivraisons;