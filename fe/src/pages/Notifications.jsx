// pages/Notifications.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';
import '../css/Notifications.css';

const API_BASE_URL = 'http://localhost:5001/api'; // ✅ port 5000

const DEMO_NOTIFICATIONS = [
  {
    _id: '1', type: 'warning', title: 'Commande en retard',
    message: 'La commande #CMD-2024-089 dépasse la date de livraison prévue de 3 jours.',
    entityType: 'Commande', entityId: 'CMD-2024-089',
    isRead: false, createdAt: new Date().toISOString(),
  },
  {
    _id: '2', type: 'success', title: 'Facture payée',
    message: 'La facture #FAC-2024-112 a été réglée par le client Société ABC.',
    entityType: 'Facture', entityId: 'FAC-2024-112',
    isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: '3', type: 'info', title: 'Nouveau contrat signé',
    message: 'Le contrat #CT-2024-034 avec Entreprise XYZ a été signé et archivé.',
    entityType: 'Contrat', entityId: 'CT-2024-034',
    isRead: true, createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: '4', type: 'error', title: 'Pénalité appliquée',
    message: 'Une pénalité de retard de 450 TND a été calculée pour la livraison #LIV-2024-055.',
    entityType: 'Livraison', entityId: 'LIV-2024-055',
    isRead: false, createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: '5', type: 'info', title: 'Stock bas détecté',
    message: 'Le produit "Gaz Naturel - Grade A" est en dessous du seuil minimal de stock.',
    entityType: 'Stock', entityId: 'STK-001',
    isRead: true, createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    _id: '6', type: 'warning', title: 'Contrat expirant',
    message: 'Le contrat #CT-2024-011 expire dans 7 jours. Pensez au renouvellement.',
    entityType: 'Contrat', entityId: 'CT-2024-011',
    isRead: false, createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

const TYPE_CONFIG = {
  info:    { label: 'Information',    icon: 'ℹ️', color: 'blue'  },
  success: { label: 'Succès',         icon: '✅', color: 'green' },
  warning: { label: 'Avertissement',  icon: '⚠️', color: 'amber' },
  error:   { label: 'Erreur',         icon: '🔴', color: 'red'  },
};

const Notifications = () => {
  const [notifications,  setNotifications]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [filter,         setFilter]         = useState('all');
  const [isDemoMode,     setIsDemoMode]     = useState(false);
  const [actionLoading,  setActionLoading]  = useState(null);

  const token = getToken();
  const api   = useMemo(() => {
    if (!token) return null;
    return axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  // ── Fetch ─────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    if (!token || !api) {
      setIsDemoMode(true);
      setNotifications(DEMO_NOTIFICATIONS);
      setLoading(false);
      return;
    }
    try {
      const res  = await api.get('/notifications');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setNotifications(data);
      setIsDemoMode(false);
    } catch (err) {
      // ✅ 404 = route pas encore créée → mode démo silencieux (pas de console.error)
      if (err.response?.status === 404) {
        setIsDemoMode(true);
        setNotifications(DEMO_NOTIFICATIONS);
      } else if (err.response?.status === 401) {
        setError('Session expirée, veuillez vous reconnecter');
      } else {
        // Autre erreur réseau → mode démo avec message discret
        setIsDemoMode(true);
        setNotifications(DEMO_NOTIFICATIONS);
        setError('Serveur indisponible — affichage des données de démonstration');
      }
    } finally {
      setLoading(false);
    }
  }, [api, token]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── Auto-refresh toutes les 30s ───────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDemoMode) fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isDemoMode]);

  // ── Actions ───────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setActionLoading(id);
    if (!isDemoMode && api) {
      try { await api.patch(`/notifications/${id}/read`); } catch { /* silencieux */ }
    }
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setActionLoading(null);
  }, [api, isDemoMode]);

  const markAllRead = useCallback(async () => {
    setActionLoading('all');
    if (!isDemoMode && api) {
      try { await api.patch('/notifications/read-all'); } catch { /* silencieux */ }
    }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setActionLoading(null);
  }, [api, isDemoMode]);

  const deleteNotification = useCallback(async (id) => {
    setActionLoading(id + '_del');
    if (!isDemoMode && api) {
      try { await api.delete(`/notifications/${id}`); } catch { /* silencieux */ }
    }
    setNotifications(prev => prev.filter(n => n._id !== id));
    setActionLoading(null);
  }, [api, isDemoMode]);

  // ── Filtrage ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (filter === 'all')    return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.isRead);
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.isRead).length,
    [notifications]
  );

  const formatDate = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000)    return 'À l\'instant';
    if (diff < 3600000)  return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  };

  return (
    <div className="notif-page">

      {/* Header */}
      <div className="notif-header">
        <div className="notif-header-left">
          <div className="notif-icon-wrap">
            <span className="notif-bell">🔔</span>
            {unreadCount > 0 && <span className="notif-badge-count">{unreadCount}</span>}
          </div>
          <div>
            <h1>Notifications</h1>
            <p>{unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}</p>
          </div>
        </div>
        <div className="notif-header-actions">
          {isDemoMode && <span className="demo-tag">⚡ Démo</span>}
          {unreadCount > 0 && (
            <button className="btn-mark-all" onClick={markAllRead} disabled={actionLoading === 'all'}>
              {actionLoading === 'all' ? '...' : '✓ Tout marquer lu'}
            </button>
          )}
          <button className="btn-refresh" onClick={fetchNotifications} title="Rafraîchir">↻</button>
        </div>
      </div>

      {/* Erreur non-404 */}
      {error && (
        <div className="notif-error">
          ⚠️ {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="notif-tabs">
        {[
          { key: 'all',     label: 'Toutes',        count: notifications.length },
          { key: 'unread',  label: 'Non lues',       count: unreadCount },
          { key: 'warning', label: 'Avertissements', count: notifications.filter(n => n.type === 'warning').length },
          { key: 'error',   label: 'Erreurs',        count: notifications.filter(n => n.type === 'error').length },
          { key: 'success', label: 'Succès',         count: notifications.filter(n => n.type === 'success').length },
          { key: 'info',    label: 'Infos',          count: notifications.filter(n => n.type === 'info').length },
        ].map(tab => (
          <button key={tab.key}
            className={`notif-tab ${filter === tab.key ? 'active' : ''} tab-${tab.key}`}
            onClick={() => setFilter(tab.key)}>
            {tab.label}
            {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="notif-list-wrap">
        {loading ? (
          <div className="notif-loading">
            <div className="notif-spinner" /><span>Chargement...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="notif-empty">
            <span className="notif-empty-icon">🔕</span>
            <p>Aucune notification {filter !== 'all' ? 'dans cette catégorie' : ''}</p>
          </div>
        ) : (
          <ul className="notif-list">
            {filtered.map(notif => (
              <li key={notif._id}
                className={`notif-item notif-${notif.type} ${notif.isRead ? 'is-read' : 'is-unread'}`}>
                <div className="notif-item-icon">
                  {TYPE_CONFIG[notif.type]?.icon || 'ℹ️'}
                </div>
                <div className="notif-item-body">
                  <div className="notif-item-top">
                    <span className="notif-item-title">{notif.title}</span>
                    <span className="notif-item-time">{formatDate(notif.createdAt)}</span>
                  </div>
                  <p className="notif-item-message">{notif.message}</p>
                  {notif.entityType && (
                    <span className="notif-item-tag">{notif.entityType} · {notif.entityId}</span>
                  )}
                </div>
                <div className="notif-item-actions">
                  {!notif.isRead && (
                    <button className="btn-notif-read"
                      onClick={() => markAsRead(notif._id)}
                      disabled={actionLoading === notif._id}
                      title="Marquer comme lu">
                      {actionLoading === notif._id ? '...' : '✓'}
                    </button>
                  )}
                  <button className="btn-notif-del"
                    onClick={() => deleteNotification(notif._id)}
                    disabled={actionLoading === notif._id + '_del'}
                    title="Supprimer">×</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;