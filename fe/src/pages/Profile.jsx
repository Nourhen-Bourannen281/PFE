// pages/Profile.jsx - ✅ AVEC QR CODES + FONCTIONNALITÉS AVANCÉES
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, logout } from '../utils/auth';
import { QRCodeSVG } from 'qrcode.react';
import '../css/Profile.css';

// ── Configuration par rôle ─────────────────────────────────────
const ROLE_CONFIG = {
  Admin: {
    icon:        '👑',
    label:       'Administrateur',
    color:       'role-admin',
    description: 'Accès complet à toutes les fonctionnalités de la plateforme SMART-TRADE 360°.',
    permissions: [
      'Gestion des utilisateurs',
      'Gestion des tiers (Clients & Fournisseurs)',
      'Gestion du stock',
      'Validation des contrats',
      'Suivi des commandes et livraisons',
      'Gestion des factures',
      'Conformité et historique',
      'Export des données',
      'Pénalités de retard',
      'Notifications système',
    ],
    stats: [
      { icon: '👥', label: 'Utilisateurs gérés',  key: 'users',     demo: 24  },
      { icon: '📋', label: 'Contrats actifs',      key: 'contrats',  demo: 18  },
      { icon: '📦', label: 'Commandes ce mois',    key: 'commandes', demo: 142 },
      { icon: '⚠️', label: 'Alertes en cours',     key: 'alertes',   demo: 3   },
    ],
    navLinks: [
      { path: '/dashboard',       label: 'Dashboard'        },
      { path: '/users',           label: 'Utilisateurs'     },
      { path: '/tiers',           label: 'Tiers'            },
      { path: '/contrats',        label: 'Contrats'         },
      { path: '/historique',      label: 'Historique'       },
    ],
    // ✅ NOUVELLES FONCTIONNALITÉS
    features: [
      {
        id: 'notifications',
        icon: '🔔',
        title: 'Notifications Auto',
        description: 'Système d\'alertes automatiques pour les événements critiques',
        status: 'En développement',
        estimatedDays: 2,
        user_story: 'En tant que système, je veux envoyer des alertes',
        qr_code: true,
      },
      {
        id: 'penalties',
        icon: '⚠️',
        title: 'Pénalités Retard',
        description: 'Calcul automatique des pénalités de retard de livraison',
        status: 'En développement',
        estimatedDays: 1,
        user_story: 'En tant que système, je veux calculer les pénalités de retard',
        qr_code: true,
      },
      {
        id: 'history',
        icon: '📜',
        title: 'Historique Actions',
        description: 'Journal complet de toutes les actions système et utilisateurs',
        status: 'En développement',
        estimatedDays: 2,
        user_story: 'En tant qu\'Admin, je veux voir toutes les actions',
        qr_code: true,
      },
      {
        id: 'chatbot',
        icon: '🤖',
        title: 'Chatbot Assistant',
        description: 'Assistant virtuel pour l\'aide utilisateur et support',
        status: 'En développement',
        estimatedDays: 3,
        user_story: 'En tant qu\'utilisateur, je veux être aidé par un chatbot',
        qr_code: true,
      },
    ],
  },
  Commercial: {
    icon:        '💼',
    label:       'Commercial',
    color:       'role-commercial',
    description: 'Gestion des contrats, commandes et relations clients SMART-TRADE 360°.',
    permissions: [
      'Gestion des contrats de vente',
      'Suivi des commandes clients',
      'Gestion des factures',
      'Conformité documentaire',
      'Export des données commerciales',
      'Tiers clients et fournisseurs',
      'Produits nationaux (Ventes STEG / Cabotage STIR)',
      'Notifications commerciales',
    ],
    stats: [
      { icon: '📝', label: 'Contrats ce mois',  key: 'contrats',  demo: 8  },
      { icon: '🛒', label: 'Commandes actives', key: 'commandes', demo: 34 },
      { icon: '💰', label: 'CA ce mois (TND)',  key: 'ca',        demo: '284 500' },
      { icon: '📄', label: 'Factures en attente', key: 'factures', demo: 6 },
    ],
    navLinks: [
      { path: '/commercial-dashboard', label: 'Dashboard'    },
      { path: '/contrats',             label: 'Contrats'     },
      { path: '/commandes',            label: 'Commandes'    },
      { path: '/factures',             label: 'Factures'     },
      { path: '/conformite',           label: 'Conformité'   },
    ],
    features: [
      {
        id: 'notifications',
        icon: '🔔',
        title: 'Notifications Commerciales',
        description: 'Alertes sur les nouveaux contrats et commandes',
        status: 'En développement',
        estimatedDays: 2,
        user_story: 'En tant que commercial, je veux recevoir des alertes commerciales',
        qr_code: true,
      },
      {
        id: 'penalties',
        icon: '⚠️',
        title: 'Pénalités Retard',
        description: 'Consulter les pénalités de retard sur les contrats',
        status: 'Disponible',
        estimatedDays: 0,
        user_story: 'En tant que commercial, je veux voir les pénalités de retard',
        qr_code: true,
      },
      {
        id: 'history',
        icon: '📜',
        title: 'Historique Actions',
        description: 'Journal de toutes vos actions commerciales',
        status: 'Disponible',
        estimatedDays: 0,
        user_story: 'En tant que commercial, je veux consulter mon historique',
        qr_code: true,
      },
      {
        id: 'chatbot',
        icon: '🤖',
        title: 'Assistant Commercial',
        description: 'Aide pour la gestion des contrats et commandes',
        status: 'En développement',
        estimatedDays: 3,
        user_story: 'En tant que commercial, je veux être aidé par un assistant',
        qr_code: true,
      },
    ],
  },
  Client: {
    icon:        '🏢',
    label:       'Client',
    color:       'role-client',
    description: 'Accès à vos commandes, livraisons et factures SMART-TRADE 360°.',
    permissions: [
      'Consultation du catalogue produits',
      'Passage de commandes',
      'Suivi des livraisons en temps réel',
      'Consultation des factures',
      'Téléchargement des reçus',
      'Assistant virtuel SMART-TRADE 360°',
    ],
    stats: [
      { icon: '🛒', label: 'Commandes totales',   key: 'commandes', demo: 12 },
      { icon: '🚚', label: 'Livraisons en cours',  key: 'livraisons', demo: 2 },
      { icon: '📄', label: 'Factures ce mois',     key: 'factures',  demo: 5  },
      { icon: '💳', label: 'Montant payé (TND)',   key: 'paye',      demo: '12 450' },
    ],
    navLinks: [
      { path: '/client-dashboard', label: 'Dashboard'        },
      { path: '/mes-commandes',    label: 'Mes Commandes'    },
      { path: '/mes-livraisons',   label: 'Mes Livraisons'   },
      { path: '/mes-factures',     label: 'Mes Factures'     },
    ],
    features: [
      {
        id: 'notifications',
        icon: '🔔',
        title: 'Notifications Livraisons',
        description: 'Alertes en temps réel sur vos livraisons',
        status: 'En développement',
        estimatedDays: 2,
        user_story: 'En tant que client, je veux recevoir des alertes sur mes livraisons',
        qr_code: true,
      },
      {
        id: 'penalties',
        icon: '⚠️',
        title: 'Pénalités Retard',
        description: 'Consulter et payer vos pénalités de retard de livraison',
        status: 'Disponible',
        estimatedDays: 0,
        user_story: 'En tant que client, je veux voir et payer mes pénalités',
        qr_code: true,
      },
      {
        id: 'history',
        icon: '📜',
        title: 'Historique Commandes',
        description: 'Journal de toutes vos commandes et livraisons',
        status: 'Disponible',
        estimatedDays: 0,
        user_story: 'En tant que client, je veux consulter mon historique de commandes',
        qr_code: true,
      },
      {
        id: 'chatbot',
        icon: '🤖',
        title: 'Support Client',
        description: 'Assistant virtuel pour vos questions et demandes',
        status: 'En développement',
        estimatedDays: 3,
        user_story: 'En tant que client, je veux être aidé par un assistant',
        qr_code: true,
      },
    ],
  },
  Transporteur: {
    icon:        '🚛',
    label:       'Transporteur',
    color:       'role-transporteur',
    description: 'Gestion et suivi de vos missions de livraison SMART-TRADE 360°.',
    permissions: [
      'Consultation des livraisons assignées',
      'Mise à jour du statut de livraison',
      'Suivi des itinéraires',
      'Contact avec les clients',
      'Tiers partenaires',
    ],
    stats: [
      { icon: '🚚', label: 'Livraisons du jour',   key: 'today',     demo: 4  },
      { icon: '✅', label: 'Livrées ce mois',       key: 'livrees',   demo: 38 },
      { icon: '⏳', label: 'En attente',            key: 'attente',   demo: 2  },
      { icon: '📍', label: 'Km parcourus ce mois',  key: 'km',        demo: '1 240' },
    ],
    navLinks: [
      { path: '/transporteur-dashboard',  label: 'Dashboard'        },
      { path: '/transporteur-livraisons', label: 'Mes Livraisons'   },
      { path: '/tiers',                   label: 'Tiers'            },
    ],
    features: [
      {
        id: 'notifications',
        icon: '🔔',
        title: 'Alertes Livraison',
        description: 'Notifications des nouvelles livraisons assignées',
        status: 'En développement',
        estimatedDays: 2,
        user_story: 'En tant que transporteur, je veux recevoir les alertes de livraison',
        qr_code: true,
      },
      {
        id: 'penalties',
        icon: '⚠️',
        title: 'Pénalités Retard',
        description: 'Consulter vos pénalités de retard de livraison',
        status: 'Disponible',
        estimatedDays: 0,
        user_story: 'En tant que transporteur, je veux voir mes pénalités de retard',
        qr_code: true,
      },
      {
        id: 'history',
        icon: '📜',
        title: 'Historique Livraisons',
        description: 'Journal de toutes vos missions de livraison',
        status: 'Disponible',
        estimatedDays: 0,
        user_story: 'En tant que transporteur, je veux consulter mon historique',
        qr_code: true,
      },
      {
        id: 'chatbot',
        icon: '🤖',
        title: 'Assistant Logistique',
        description: 'Aide pour les itinéraires et le suivi',
        status: 'En développement',
        estimatedDays: 3,
        user_story: 'En tant que transporteur, je veux être aidé',
        qr_code: true,
      },
    ],
  },
  Fournisseur: {
    icon:        '🏭',
    label:       'Fournisseur',
    color:       'role-fournisseur',
    description: 'Gestion de vos commandes reçues et livraisons sortantes SMART-TRADE 360°.',
    permissions: [
      'Consultation des commandes reçues',
      'Gestion des livraisons',
      'Consultation des factures fournisseur',
      'Tiers partenaires SMART-TRADE 360°',
    ],
    stats: [
      { icon: '📦', label: 'Commandes reçues',    key: 'commandes', demo: 15  },
      { icon: '🚚', label: 'Livraisons ce mois',  key: 'livraisons', demo: 11 },
      { icon: '📄', label: 'Factures émises',     key: 'factures',  demo: 8   },
      { icon: '💰', label: 'Montant facturé (TND)', key: 'montant', demo: '95 000' },
    ],
    navLinks: [
      { path: '/dashboard',   label: 'Dashboard'      },
      { path: '/commandes',   label: 'Commandes'      },
      { path: '/livraisons',  label: 'Livraisons'     },
      { path: '/mes-factures',label: 'Mes Factures'   },
      { path: '/tiers',       label: 'Tiers'          },
    ],
    features: [
      {
        id: 'notifications',
        icon: '🔔',
        title: 'Alertes Commandes',
        description: 'Notifications sur les nouvelles commandes reçues',
        status: 'En développement',
        estimatedDays: 2,
        user_story: 'En tant que fournisseur, je veux recevoir des alertes',
        qr_code: true,
      },
      {
        id: 'penalties',
        icon: '⚠️',
        title: 'Pénalités Retard',
        description: 'Consulter vos pénalités de retard de livraison',
        status: 'Disponible',
        estimatedDays: 0,
        user_story: 'En tant que fournisseur, je veux voir mes pénalités de retard',
        qr_code: true,
      },
      {
        id: 'history',
        icon: '📜',
        title: 'Historique Commandes',
        description: 'Journal de toutes vos commandes et livraisons sortantes',
        status: 'Disponible',
        estimatedDays: 0,
        user_story: 'En tant que fournisseur, je veux consulter mon historique',
        qr_code: true,
      },
      {
        id: 'chatbot',
        icon: '🤖',
        title: 'Support Fournisseur',
        description: 'Assistant pour les commandes et livraisons',
        status: 'En développement',
        estimatedDays: 3,
        user_story: 'En tant que fournisseur, je veux être aidé',
        qr_code: true,
      },
    ],
  },
};

// ── QR Code généré localement (sans service externe) ──────────

// ── Composant principal ────────────────────────────────────────
function Profile() {
  const navigate = useNavigate();

  // Lire l'utilisateur depuis localStorage
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  const role      = user?.role || 'Client';
  const config    = ROLE_CONFIG[role] || ROLE_CONFIG.Client;
  const token     = getToken();

  // ── Edit mode ────────────────────────────────────────────────
  const [isEditing,  setIsEditing]  = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [formData,   setFormData]   = useState({
    nom:       user?.nom       || user?.name  || 'Ghfayra&Nahnouh',
    email:     user?.email     || '',
    telephone: user?.telephone || '',
    adresse:   user?.adresse   || '',
    pseudo:    user?.pseudo    || 'Ghfayra&Nahnouh',
  });

  // Sauvegarder les valeurs par défaut si pas encore enregistrées
  useEffect(() => {
    if (!user?.nom && !user?.pseudo) {
      const updated = {
        ...user,
        nom:    'Ghfayra&Nahnouh',
        pseudo: 'Ghfayra&Nahnouh',
      };
      localStorage.setItem('user', JSON.stringify(updated));
    }
  }, []);

  // ── Modal QR Code ────────────────────────────────────────────
  const [qrModal, setQrModal] = useState(null);

  const handleSave = useCallback(() => {
    const updated = { ...user, ...formData };
    localStorage.setItem('user', JSON.stringify(updated));
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [user, formData]);

  const handleLogout = useCallback(() => {
    logout(navigate);
  }, [navigate]);

  const setField = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  // ── Initiales pour l'avatar ──────────────────────────────────
  const initiales = useMemo(() => {
    const nom = formData.nom || user?.pseudo || '';
    return nom
      .split(' ')
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() || '')
      .join('') || role[0]?.toUpperCase() || 'U';
  }, [formData.nom, user?.pseudo, role]);

  return (
    <div className="profile-page">

      {/* ── Saved toast ─────────────────────────────────────── */}
      {saved && (
        <div className="profile-toast">✅ Profil mis à jour avec succès</div>
      )}

      {/* ── QR Modal ─────────────────────────────────────────── */}
      {qrModal && (
        <div className="qr-modal-overlay" onClick={() => setQrModal(null)}>
          <div className="qr-modal-content" onClick={e => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => setQrModal(null)}>✕</button>
            <div className="qr-modal-header">
              <span className="qr-modal-icon">{qrModal.icon}</span>
              <h3>{qrModal.title}</h3>
            </div>
            <div className="qr-modal-body">
              <div className="qr-code-image" style={{ display: 'flex', justifyContent: 'center', padding: '12px', background: '#fff', borderRadius: '12px', border: '1px solid #e4edf7' }}>
                <QRCodeSVG
                  value={token || `etap://${qrModal.id}/${role.toLowerCase()}`}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0d2b3e"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="qr-modal-instruction">
                Scannez ce code avec votre application mobile SMART-TRADE 360°
              </p>
              <p className="qr-modal-feature">{qrModal.description}</p>
            </div>
            <div className="qr-modal-footer">
              <button className="btn-qr-copy" onClick={() => {
                navigator.clipboard.writeText(token || `etap://${qrModal.id}/${role.toLowerCase()}`);
                alert('Lien copié !');
              }}>
                📋 Copier le lien
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="profile-hero">
        <div className="profile-hero-bg" />

        <div className="profile-avatar-wrap">
          <div className={`profile-avatar ${config.color}`}>
            {initiales}
          </div>
          <div className={`profile-role-badge ${config.color}`}>
            {config.icon} {config.label}
          </div>
        </div>

        <div className="profile-hero-info">
          <h1>{formData.nom || user?.pseudo || 'Utilisateur SMART-TRADE 360°'}</h1>
          <p className="profile-email">{formData.email || '—'}</p>
          <p className="profile-company">
            🛢️ Entreprise Tunisienne d'Activités Pétrolières
          </p>
          {!token && <span className="profile-demo-tag">⚡ Mode démo</span>}
        </div>

        <div className="profile-hero-actions">
          {!isEditing ? (
            <button className="btn-profile-edit" onClick={() => setIsEditing(true)}>
              ✏️ Modifier le profil
            </button>
          ) : (
            <>
              <button className="btn-profile-save" onClick={handleSave}>
                💾 Enregistrer
              </button>
              <button className="btn-profile-cancel" onClick={() => setIsEditing(false)}>
                Annuler
              </button>
            </>
          )}
          <button className="btn-profile-logout" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="profile-body">

        {/* ── Colonne gauche ───────────────────────────────── */}
        <div className="profile-col-left">

          {/* Infos personnelles */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>👤 Informations personnelles</h2>
            </div>
            <div className="profile-card-body">
              {isEditing ? (
                <div className="profile-form">
                  <div className="profile-field">
                    <label>Nom complet</label>
                    <input
                      value={formData.nom}
                      onChange={e => setField('nom', e.target.value)}
                      placeholder="Votre nom complet"
                    />
                  </div>
                  <div className="profile-field">
                    <label>Pseudo / Identifiant</label>
                    <input
                      value={formData.pseudo}
                      onChange={e => setField('pseudo', e.target.value)}
                      placeholder="Votre identifiant"
                    />
                  </div>
                  <div className="profile-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setField('email', e.target.value)}
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div className="profile-field">
                    <label>Téléphone</label>
                    <input
                      value={formData.telephone}
                      onChange={e => setField('telephone', e.target.value)}
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>
                  <div className="profile-field">
                    <label>Adresse</label>
                    <input
                      value={formData.adresse}
                      onChange={e => setField('adresse', e.target.value)}
                      placeholder="Votre adresse"
                    />
                  </div>
                </div>
              ) : (
                <div className="profile-info-list">
                  <div className="profile-info-row">
                    <span className="pir-icon">👤</span>
                    <div>
                      <div className="pir-label">Nom complet</div>
                      <div className="pir-value">{formData.nom || '—'}</div>
                    </div>
                  </div>
                  <div className="profile-info-row">
                    <span className="pir-icon">🔑</span>
                    <div>
                      <div className="pir-label">Pseudo</div>
                      <div className="pir-value">{formData.pseudo || '—'}</div>
                    </div>
                  </div>
                  <div className="profile-info-row">
                    <span className="pir-icon">✉️</span>
                    <div>
                      <div className="pir-label">Email</div>
                      <div className="pir-value pir-mono">{formData.email || '—'}</div>
                    </div>
                  </div>
                  <div className="profile-info-row">
                    <span className="pir-icon">📞</span>
                    <div>
                      <div className="pir-label">Téléphone</div>
                      <div className="pir-value">{formData.telephone || '—'}</div>
                    </div>
                  </div>
                  <div className="profile-info-row">
                    <span className="pir-icon">📍</span>
                    <div>
                      <div className="pir-label">Adresse</div>
                      <div className="pir-value">{formData.adresse || '—'}</div>
                    </div>
                  </div>
                  <div className="profile-info-row">
                    <span className="pir-icon">🏷️</span>
                    <div>
                      <div className="pir-label">Rôle système</div>
                      <div className={`pir-value pir-role ${config.color}`}>
                        {config.icon} {config.label}
                      </div>
                    </div>
                  </div>
                  <div className="profile-info-row">
                    <span className="pir-icon">🔐</span>
                    <div>
                      <div className="pir-label">Statut du compte</div>
                      <div className="pir-value pir-active">● Actif</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Accès rapide */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>⚡ Accès rapide</h2>
            </div>
            <div className="profile-card-body profile-nav-links">
              {config.navLinks.map(link => (
                <button
                  key={link.path}
                  className="profile-nav-btn"
                  onClick={() => navigate(link.path)}
                >
                  <span>{link.label}</span>
                  <span className="nav-arrow">→</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ── Colonne droite ───────────────────────────────── */}
        <div className="profile-col-right">

          {/* Description du rôle */}
          <div className="profile-card profile-role-card">
            <div className="profile-card-header">
              <h2>{config.icon} Rôle : {config.label}</h2>
            </div>
            <div className="profile-card-body">
              <p className="profile-role-desc">{config.description}</p>

              {/* Stats */}
              <div className="profile-stats-grid">
                {config.stats.map(stat => (
                  <div key={stat.key} className="profile-stat">
                    <span className="profile-stat-icon">{stat.icon}</span>
                    <div className="profile-stat-num">{stat.demo}</div>
                    <div className="profile-stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QR CODE ADMIN — carte dédiée */}
          {role === 'Admin' && (
            <div className="profile-card profile-qr-admin-card">
              <div className="profile-card-header">
                <h2>📱 QR Code d'accès mobile</h2>
                <span className="profile-perm-count">Connexion rapide</span>
              </div>
              <div className="profile-card-body">
                <div className="admin-qr-wrapper">
                  <div className="admin-qr-code">
                    <QRCodeSVG
                      value={token || `etap://${user?.id || 'admin'}/${role.toLowerCase()}`}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#0d2b3e"
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="admin-qr-info">
                    <p className="admin-qr-title">Code d'accès administrateur</p>
                    <p className="admin-qr-desc">
                      Scannez ce QR code depuis l'application mobile SMART-TRADE 360° pour vous connecter
                      directement en tant qu'administrateur sans saisir vos identifiants.
                    </p>
                    <div className="admin-qr-actions">
                      <button
                        className="btn-qr"
                        onClick={() => setQrModal({
                          id: user?.id || 'admin',
                          icon: '👑',
                          title: 'QR Code Administrateur',
                          description: 'Scannez pour accéder à votre espace Admin sur l\'application mobile SMART-TRADE 360°',
                        })}
                      >
                        🔍 Agrandir
                      </button>
                      <button
                        className="btn-qr-copy"
                        style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '8px', fontWeight: 600 }}
                        onClick={() => {
                          navigator.clipboard.writeText(token || `etap://${user?.id || 'admin'}/admin`);
                          alert('Lien copié !');
                        }}
                      >
                        📋 Copier
                      </button>
                    </div>
                    <div className="admin-qr-badge">
                      <span className="perm-check">✓</span>
                      <span style={{ fontSize: 12, color: '#1a3c5e', fontWeight: 600 }}>
                        {token ? 'Token JWT actif — accès sécurisé' : 'Mode démo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ FONCTIONNALITÉS AVANCÉES - NOUVEAU */}
          {config.features && config.features.length > 0 && (
            <div className="profile-card profile-features-card">
              <div className="profile-card-header">
                <h2>🚀 Fonctionnalités avancées</h2>
                <button
                  className="btn-qr"
                  onClick={() => setQrModal({
                    id: 'app',
                    icon: '📱',
                    title: 'Accès Mobile SMART-TRADE 360°',
                    description: `Scannez pour accéder à votre espace ${config.label} sur l'application mobile`,
                  })}
                  title="QR Code unique pour l'app mobile"
                >
                  📱 QR Code Mobile
                </button>
              </div>
              <div className="profile-card-body">
                <div className="features-grid">
                  {config.features.map(feature => (
                    <div key={feature.id} className="feature-item">
                      <div className="feature-header">
                        <span className="feature-icon">{feature.icon}</span>
                        <h4>{feature.title}</h4>
                      </div>
                      <p className="feature-desc">{feature.description}</p>
                      <div className="feature-user-story">
                        <span className="story-icon">📋</span>
                        <span className="story-text">{feature.user_story}</span>
                      </div>
                      <div className="feature-footer">
                        <span className="feature-estimation">
                          ⏱️ {feature.estimatedDays} jour{feature.estimatedDays > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Permissions */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>🔐 Permissions</h2>
              <span className="profile-perm-count">{config.permissions.length} droits</span>
            </div>
            <div className="profile-card-body">
              <ul className="profile-permissions">
                {config.permissions.map((perm, i) => (
                  <li key={i} className="profile-perm-item">
                    <span className="perm-check">✓</span>
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sécurité */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>🛡️ Sécurité</h2>
            </div>
            <div className="profile-card-body">
              <div className="profile-security-list">
                <div className="profile-security-item">
                  <div className="psi-left">
                    <span className="psi-icon">🔑</span>
                    <div>
                      <div className="psi-title">Mot de passe</div>
                      <div className="psi-sub">Dernière modification inconnue</div>
                    </div>
                  </div>
                  <button
                    className="btn-security"
                    onClick={() => navigate('/forgot-password')}
                  >
                    Modifier
                  </button>
                </div>
                <div className="profile-security-item">
                  <div className="psi-left">
                    <span className="psi-icon">🔒</span>
                    <div>
                      <div className="psi-title">Session active</div>
                      <div className="psi-sub">
                        {token ? 'Connecté avec un token valide' : 'Mode démo'}
                      </div>
                    </div>
                  </div>
                  <span className={`badge-session ${token ? 'session-ok' : 'session-demo'}`}>
                    {token ? '● Active' : '● Démo'}
                  </span>
                </div>
                <div className="profile-security-item">
                  <div className="psi-left">
                    <span className="psi-icon">🚪</span>
                    <div>
                      <div className="psi-title">Déconnexion</div>
                      <div className="psi-sub">Mettre fin à la session en cours</div>
                    </div>
                  </div>
                  <button className="btn-security btn-logout-sec" onClick={handleLogout}>
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;