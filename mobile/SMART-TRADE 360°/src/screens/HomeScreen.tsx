import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated, Dimensions, StatusBar, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { STORAGE_KEYS } from '../services/storage';
import { getNotifications } from '../services/api';
import { onNewNotification, offNewNotification } from '../services/socket';
import NotificationCard from '../components/NotificationCard';
import LoadingSpinner from '../components/LoadingSpinner';

const { width } = Dimensions.get('window');
const API_BASE = 'http://192.168.1.115:5001/api';

// ── Types ──────────────────────────────────────────────────────────
interface StatCard { icon: string; label: string; value: number | string; screen?: string; warn?: boolean; }
interface QuickAct { id: string; icon: string; label: string; screen: string; badge?: number; }
interface Notification { _id: string; title: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; isRead: boolean; createdAt: string; }

// ── Config par rôle ────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  Admin: '#0d2b3e', Commercial: '#1565c0', Client: '#2e7d32',
  Transporteur: '#e65100', Fournisseur: '#6a1b9a',
};
const ROLE_ICON: Record<string, string> = {
  Admin: '👑', Commercial: '💼', Client: '🏢', Transporteur: '🚛', Fournisseur: '🏭',
};

// Demo data de secours
const DEMO_NOTIFS: Notification[] = [
  { _id: 'd1', title: 'Bienvenue sur SMART-TRADE 360°', message: 'Votre tableau de bord est prêt.', type: 'info', isRead: false, createdAt: new Date().toISOString() },
];

// ── Composant principal ────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const role = user?.role || 'Client';
  const color = ROLE_COLOR[role] || '#1a3c5e';

  const [stats, setStats]           = useState<Record<string, number>>({});
  const [notifications, setNotifs]  = useState<Notification[]>([]);
  const [unread, setUnread]         = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  // ── Chargement ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [dashRes, notifRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/home/dashboard`, { headers }),
        getNotifications(user.id || '').catch(() => ({ data: { notifications: [], unreadCount: 0 } })),
      ]);

      if (dashRes.status === 'fulfilled') {
        setStats(dashRes.value.data.stats || {});
      }

      const notifData = notifRes.status === 'fulfilled' ? notifRes.value : { data: { notifications: [], unreadCount: 0 } };
      const VALID_TYPES = ['info', 'warning', 'error', 'success'] as const;
      const notifs: Notification[] = ((notifData as any).data?.notifications || []).map((n: any) => ({
        ...n,
        type: VALID_TYPES.includes(n.type) ? n.type : 'info',
      }));
      setNotifs(notifs.length > 0 ? notifs : DEMO_NOTIFS);
      setUnread((notifData as any).data?.unreadCount || notifs.filter(n => !n.isRead).length);
    } catch {
      setNotifs(DEMO_NOTIFS);
    } finally {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 55, friction: 8 }),
      ]).start();
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const h = (n: Notification) => { setUnread(u => u + 1); setNotifs(p => [n, ...p].slice(0, 10)); };
    onNewNotification(h);
    return () => offNewNotification(h);
  }, []);

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  // ── Config statCards & quickActions par rôle ───────────────────
  const getStatCards = (): StatCard[] => {
    switch (role) {
      case 'Admin': return [
        { icon: '👥', label: 'Utilisateurs',   value: stats.totalUsers   ?? '—' },
        { icon: '📋', label: 'Tiers total',     value: stats.totalTiers   ?? '—' },
        { icon: '👤', label: 'Clients',         value: stats.clients      ?? '—' },
        { icon: '🏭', label: 'Fournisseurs',    value: stats.fournisseurs ?? '—' },
        { icon: '⚠️', label: 'Pénalités',       value: stats.penalites    ?? '—', screen: 'Penalties', warn: (stats.penalites ?? 0) > 0 },
        { icon: '🔔', label: 'Notifications',   value: unread,                   screen: 'Notifications', warn: unread > 0 },
      ];
      case 'Commercial': return [
        { icon: '📝', label: 'Contrats actifs', value: stats.contrats  ?? '—', screen: 'Assistant' },
        { icon: '🛒', label: 'Commandes',       value: stats.commandes ?? '—', screen: 'Assistant' },
        { icon: '⚠️', label: 'Pénalités',       value: stats.penalites ?? '—', screen: 'Penalties', warn: (stats.penalites ?? 0) > 0 },
        { icon: '🔔', label: 'Notifications',   value: unread,                 screen: 'Notifications', warn: unread > 0 },
      ];
      case 'Client': return [
        { icon: '🛒', label: 'Commandes',     value: stats.commandes  ?? '—', screen: 'History' },
        { icon: '🚚', label: 'En livraison',  value: stats.livraisons ?? '—', screen: 'History' },
        { icon: '✅', label: 'Livrées',       value: stats.factures   ?? '—', screen: 'History' },
        { icon: '⚠️', label: 'Pénalités',     value: stats.penalites  ?? '—', screen: 'Penalties', warn: (stats.penalites ?? 0) > 0 },
        { icon: '🔔', label: 'Notifications', value: unread,                  screen: 'Notifications', warn: unread > 0 },
      ];
      case 'Transporteur': return [
        { icon: '📦', label: 'Livraisons/jour', value: stats.livJour    ?? '—', screen: 'History' },
        { icon: '🚚', label: 'En transit',      value: stats.enTransit  ?? '—', screen: 'History' },
        { icon: '✅', label: 'Livrées',         value: stats.livrees    ?? '—', screen: 'History' },
        { icon: '⚠️', label: 'Pénalités',       value: stats.penalites  ?? '—', screen: 'Penalties', warn: (stats.penalites ?? 0) > 0 },
        { icon: '🔔', label: 'Notifications',   value: unread,                  screen: 'Notifications', warn: unread > 0 },
      ];
      case 'Fournisseur': return [
        { icon: '📥', label: 'Cmdes reçues',  value: stats.commandesRecues ?? '—', screen: 'History' },
        { icon: '🚚', label: 'En livraison',  value: stats.livraisons      ?? '—', screen: 'History' },
        { icon: '⚠️', label: 'Pénalités',     value: stats.penalites       ?? '—', screen: 'Penalties', warn: (stats.penalites ?? 0) > 0 },
        { icon: '🔔', label: 'Notifications', value: unread,                       screen: 'Notifications', warn: unread > 0 },
      ];
      default: return [];
    }
  };

  const getQuickActions = (): QuickAct[] => {
    switch (role) {
      case 'Admin': return [
        { id: 'assistant',     icon: '🤖', label: 'Assistant',    screen: 'Assistant' },
        { id: 'notifications', icon: '🔔', label: 'Notifs',       screen: 'Notifications', badge: unread },
        { id: 'penalties',     icon: '⚠️', label: 'Pénalités',    screen: 'Penalties', badge: stats.penalites },
        { id: 'history',       icon: '📜', label: 'Historique',   screen: 'History' },
        { id: 'profil',        icon: '👤', label: 'Profil',       screen: 'Profil' },
      ];
      case 'Commercial': return [
        { id: 'assistant',     icon: '🤖', label: 'Assistant',    screen: 'Assistant' },
        { id: 'notifications', icon: '🔔', label: 'Notifs',       screen: 'Notifications', badge: unread },
        { id: 'penalties',     icon: '⚠️', label: 'Pénalités',    screen: 'Penalties', badge: stats.penalites },
        { id: 'history',       icon: '📜', label: 'Historique',   screen: 'History' },
        { id: 'profil',        icon: '👤', label: 'Profil',       screen: 'Profil' },
      ];
      case 'Client': return [
        { id: 'assistant',     icon: '🤖', label: 'Assistant',    screen: 'Assistant' },
        { id: 'notifications', icon: '🔔', label: 'Notifs',       screen: 'Notifications', badge: unread },
        { id: 'penalties',     icon: '⚠️', label: 'Pénalités',    screen: 'Penalties', badge: stats.penalites },
        { id: 'history',       icon: '📜', label: 'Historique',   screen: 'History' },
        { id: 'profil',        icon: '👤', label: 'Profil',       screen: 'Profil' },
      ];
      case 'Transporteur': return [
        { id: 'assistant',     icon: '🤖', label: 'Assistant',    screen: 'Assistant' },
        { id: 'notifications', icon: '🔔', label: 'Notifs',       screen: 'Notifications', badge: unread },
        { id: 'penalties',     icon: '⚠️', label: 'Pénalités',    screen: 'Penalties', badge: stats.penalites },
        { id: 'history',       icon: '📜', label: 'Historique',   screen: 'History' },
        { id: 'profil',        icon: '👤', label: 'Profil',       screen: 'Profil' },
      ];
      case 'Fournisseur': return [
        { id: 'assistant',     icon: '🤖', label: 'Assistant',    screen: 'Assistant' },
        { id: 'notifications', icon: '🔔', label: 'Notifs',       screen: 'Notifications', badge: unread },
        { id: 'penalties',     icon: '⚠️', label: 'Pénalités',    screen: 'Penalties', badge: stats.penalites },
        { id: 'history',       icon: '📜', label: 'Historique',   screen: 'History' },
        { id: 'profil',        icon: '👤', label: 'Profil',       screen: 'Profil' },
      ];
      default: return [];
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getRoleLabel = () => {
    const labels: Record<string, string> = {
      Admin: 'Administrateur', Commercial: 'Commercial', Client: 'Client',
      Transporteur: 'Transporteur', Fournisseur: 'Fournisseur',
    };
    return labels[role] || role;
  };

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      Admin:        '🔔 Notifications système',
      Commercial:   '🔔 Mes dernières notifications',
      Client:       '🔔 Mes notifications',
      Transporteur: '🚚 Notifications livraison',
      Fournisseur:  '🔔 Mes notifications',
    };
    return titles[role] || '🔔 Notifications';
  };

  if (loading) return <LoadingSpinner visible text="Chargement..." />;

  const statCards  = getStatCards();
  const quickActs  = getQuickActions();
  const initial    = (user?.nom || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={color} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────────── */}
        <Animated.View style={[s.header, { backgroundColor: color, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.headerLeft}>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.userName} numberOfLines={1}>{user?.nom || 'Utilisateur'}</Text>
            <View style={s.rolePill}>
              <Text style={s.rolePillText}>{ROLE_ICON[role]} {getRoleLabel()}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.avatar} onPress={() => navigation.navigate('Profil')} activeOpacity={0.8}>
            <Text style={s.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Stat cards ────────────────────────────────────── */}
        <Animated.View style={[s.statsGrid, { opacity: fadeAnim }]}>
          {statCards.map((card, i) => (
            <TouchableOpacity
              key={i}
              style={[s.statCard, card.warn && s.statCardWarn, !card.screen && s.statCardStatic]}
              onPress={() => card.screen ? navigation.navigate(card.screen) : undefined}
              activeOpacity={card.screen ? 0.75 : 1}
            >
              <View style={[s.statIconBox, card.warn && s.statIconBoxWarn]}>
                <Text style={s.statIcon}>{card.icon}</Text>
              </View>
              <Text style={[s.statValue, card.warn && s.statValueWarn]}>
                {typeof card.value === 'number' ? card.value : card.value}
              </Text>
              <Text style={s.statLabel}>{card.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── Actions rapides ───────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Actions rapides</Text>
          <View style={s.actionsRow}>
            {quickActs.map((act, i) => (
              <Animated.View key={act.id} style={{ opacity: fadeAnim }}>
                <TouchableOpacity
                  style={s.actionBtn}
                  onPress={() => navigation.navigate(act.screen)}
                  activeOpacity={0.75}
                >
                  <Text style={s.actionIcon}>{act.icon}</Text>
                  <Text style={s.actionLabel}>{act.label}</Text>
                  {!!act.badge && act.badge > 0 && (
                    <View style={s.badge}>
                      <Text style={s.badgeText}>{act.badge > 9 ? '9+' : act.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── Notifications ─────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>{getSectionTitle()}</Text>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                <Text style={[s.seeAll, { color }]}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>

          {notifications.slice(0, 3).map(n => (
            <NotificationCard
              key={n._id}
              notification={n}
              onPress={() => navigation.navigate('Notifications')}
            />
          ))}

          {notifications.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📭</Text>
              <Text style={s.emptyTitle}>Aucune notification</Text>
              <Text style={s.emptyText}>Vous êtes à jour</Text>
            </View>
          )}
        </View>

        <View style={{ height: Platform.OS === 'ios' ? 30 : 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const CARD_W = (width - 16 * 2 - 10) / 2;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5fb' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 20, paddingBottom: 30,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22, shadowRadius: 12,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  greeting: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  userName: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 3, letterSpacing: -0.4 },
  rolePill: {
    alignSelf: 'flex-start', marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  rolePillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.45)',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5,
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#0d2b3e' },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6,
  },
  statCard: {
    width: CARD_W, backgroundColor: '#fff', borderRadius: 18, padding: 16,
    alignItems: 'center', elevation: 3,
    shadowColor: '#0d2b3e', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8,
    borderWidth: 1, borderColor: '#e4edf7',
  },
  statCardStatic: { elevation: 1, shadowOpacity: 0.04 },
  statCardWarn: { borderColor: '#fca5a5', backgroundColor: '#fff5f5', borderWidth: 1.5 },
  statIconBox: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#f0f5fb', justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  statIconBoxWarn: { backgroundColor: '#fee2e2' },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0d2b3e', letterSpacing: -0.5 },
  statValueWarn: { color: '#ef4444' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },

  // Section
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0d2b3e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  seeAll: { fontSize: 13, fontWeight: '700' },

  // Quick actions
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    width: (width - 32 - 40) / 5, backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 4, alignItems: 'center',
    elevation: 3, shadowColor: '#0d2b3e', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 6, borderWidth: 1, borderColor: '#e4edf7', position: 'relative',
  },
  actionIcon: { fontSize: 26, marginBottom: 6 },
  actionLabel: { fontSize: 9, color: '#1a3c5e', fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },
  badge: {
    position: 'absolute', top: 5, right: 5,
    backgroundColor: '#ef4444', borderRadius: 9, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Empty
  empty: {
    alignItems: 'center', paddingVertical: 36,
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e4edf7',
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1a3c5e', marginBottom: 4 },
  emptyText: { fontSize: 12, color: '#94a3b8' },
});
