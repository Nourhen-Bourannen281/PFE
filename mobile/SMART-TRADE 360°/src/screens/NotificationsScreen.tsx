import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,

  StatusBar,
  SectionList,
  ScrollView
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead
} from '../services/api';

const { width } = Dimensions.get('window');

// ========== TYPES ==========
interface Notification {
  _id: string;
  userId: string;
  userRole: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationGroup {
  title: string;
  data: Notification[];
}

interface NotificationFilter {
  type: string | null;
  isRead: boolean | null;
}

// ========== UTILITAIRES ==========
const getIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'warning': '⚠️',
    'error': '❌',
    'success': '✅',
    'info': 'ℹ️'
  };
  return icons[type] || 'ℹ️';
};

const getIconBackgroundColor = (type: string): string => {
  const colors: Record<string, string> = {
    'warning': '#fff8e1',
    'error': '#ffebee',
    'success': '#e8f5e9',
    'info': '#e8f0fe'
  };
  return colors[type] || '#e8f0fe';
};

const getIconColor = (type: string): string => {
  const colors: Record<string, string> = {
    'warning': '#f57f17',
    'error': '#d32f2f',
    'success': '#388e3c',
    'info': '#1976d2'
  };
  return colors[type] || '#1976d2';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'à l\'instant';
  if (minutes < 60) return `il y a ${minutes}m`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 7) return `il y a ${days}j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)}sem`;
  
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const groupNotificationsByDate = (notifications: Notification[]): NotificationGroup[] => {
  const groups: Record<string, Notification[]> = {
    'Aujourd\'hui': [],
    'Hier': [],
    'Cette semaine': [],
    'Plus anciennes': []
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  notifications.forEach((notif) => {
    const notifDate = new Date(notif.createdAt);
    const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

    if (notifDay.getTime() === today.getTime()) {
      groups['Aujourd\'hui'].push(notif);
    } else if (notifDay.getTime() === yesterday.getTime()) {
      groups['Hier'].push(notif);
    } else if (notifDay.getTime() >= weekAgo.getTime()) {
      groups['Cette semaine'].push(notif);
    } else {
      groups['Plus anciennes'].push(notif);
    }
  });

  return Object.entries(groups)
    .filter(([_, notifs]) => notifs.length > 0)
    .map(([title, data]) => ({ title, data }));
};

// ========== DONNÉES DE DÉMONSTRATION PAR RÔLE ==========
const now = Date.now();
const DEMO_ALL_NOTIFICATIONS: Notification[] = [
  // Client
  { _id: 'd1', userId: 'demo', userRole: 'Client',       type: 'success', title: 'Commande confirmée ✅',        message: 'Votre commande #CMD-2024-087 a été confirmée et est en cours de traitement.',                                 isRead: false, createdAt: new Date(now - 8 * 60000).toISOString() },
  { _id: 'd2', userId: 'demo', userRole: 'Client',       type: 'info',    title: 'Livraison planifiée',           message: 'Votre livraison #LIV-2024-045 est prévue pour demain entre 9h et 12h à Tunis.',                          isRead: false, createdAt: new Date(now - 2 * 3600000).toISOString() },
  { _id: 'd3', userId: 'demo', userRole: 'Client',       type: 'warning', title: 'Retard de livraison ⚠️',       message: 'La livraison #LIV-2024-038 a été reportée de 2 jours suite à des conditions météorologiques.',            isRead: false, createdAt: new Date(now - 5 * 3600000).toISOString() },
  { _id: 'd4', userId: 'demo', userRole: 'Client',       type: 'success', title: 'Paiement confirmé',             message: 'Votre paiement de 1 250,00 TND pour la facture #FAC-2024-089 a été reçu avec succès.',                   isRead: true,  createdAt: new Date(now - 24 * 3600000).toISOString() },
  { _id: 'd5', userId: 'demo', userRole: 'Client',       type: 'info',    title: 'Nouveau contrat disponible',    message: 'Un contrat de fourniture #CONT-2024-012 est disponible pour signature. Échéance : 30/05/2024.',           isRead: true,  createdAt: new Date(now - 3 * 24 * 3600000).toISOString() },
  // Admin / Commercial
  { _id: 'd6', userId: 'demo', userRole: 'Admin',        type: 'error',   title: 'Pénalité détectée 🚨',         message: 'Le fournisseur ABC Logistique a un retard de 12 jours sur CMD-2024-075. Pénalité : 540 TND.',              isRead: false, createdAt: new Date(now - 2 * 3600000).toISOString() },
  { _id: 'd7', userId: 'demo', userRole: 'Admin',        type: 'warning', title: 'Stock critique ⚠️',             message: '3 produits sont en dessous du seuil minimal de stock. Action requise.',                                  isRead: false, createdAt: new Date(now - 4 * 3600000).toISOString() },
  { _id: 'd8', userId: 'demo', userRole: 'Admin',        type: 'info',    title: 'Rapport mensuel disponible',    message: 'Le rapport des opérations de mai 2024 est prêt. 142 ventes, 38 cabotages.',                             isRead: true,  createdAt: new Date(now - 24 * 3600000).toISOString() },
  { _id: 'd9', userId: 'demo', userRole: 'Commercial',   type: 'success', title: 'Contrat signé ✅',              message: 'Le contrat #CONT-2024-018 avec Sté Pétrogazelle a été signé. Montant : 78 000 TND.',                     isRead: false, createdAt: new Date(now - 30 * 60000).toISOString() },
  { _id: 'd10',userId: 'demo', userRole: 'Commercial',   type: 'warning', title: 'Relance client requise',        message: 'La facture #FAC-2024-076 est impayée depuis 15 jours. Relancer le client.',                              isRead: false, createdAt: new Date(now - 6 * 3600000).toISOString() },
  // Fournisseur
  { _id: 'd11',userId: 'demo', userRole: 'Fournisseur',  type: 'warning', title: 'Retard signalé ⚠️',            message: 'Un retard de 8 jours a été enregistré sur votre livraison #LIV-2024-052. Pénalité possible.',             isRead: false, createdAt: new Date(now - 3 * 3600000).toISOString() },
  { _id: 'd12',userId: 'demo', userRole: 'Fournisseur',  type: 'info',    title: 'Nouvelle commande reçue',       message: 'Vous avez reçu une nouvelle commande #CMD-2024-093. Quantité : 500 m³. Délai : 15 jours.',               isRead: false, createdAt: new Date(now - 24 * 3600000).toISOString() },
  { _id: 'd13',userId: 'demo', userRole: 'Fournisseur',  type: 'success', title: 'Livraison validée ✅',          message: 'Votre livraison #LIV-2024-048 a été validée. Paiement en cours de traitement.',                         isRead: true,  createdAt: new Date(now - 2 * 24 * 3600000).toISOString() },
  // Transporteur
  { _id: 'd14',userId: 'demo', userRole: 'Transporteur', type: 'info',    title: 'Nouvelle mission assignée',     message: 'Une mission de transport #TRANS-2024-031 vous a été assignée. Départ : Tunis → Sfax, demain 08h00.',      isRead: false, createdAt: new Date(now - 1 * 3600000).toISOString() },
  { _id: 'd15',userId: 'demo', userRole: 'Transporteur', type: 'warning', title: 'Contrôle technique requis',     message: 'Le véhicule immatriculé TN-142-5678 doit passer un contrôle technique avant le 10/06/2024.',             isRead: false, createdAt: new Date(now - 7 * 3600000).toISOString() },
  { _id: 'd16',userId: 'demo', userRole: 'Transporteur', type: 'success', title: 'Mission terminée ✅',           message: 'La mission #TRANS-2024-028 a été marquée comme terminée. Bon de livraison signé.',                       isRead: true,  createdAt: new Date(now - 2 * 24 * 3600000).toISOString() },
];

const ADMIN_NOTIF_ROLES = ['Admin', 'Commercial'];

// Retourne les notifications selon le rôle de l'utilisateur connecté
const getDemoNotifications = (role: string): Notification[] => {
  if (ADMIN_NOTIF_ROLES.includes(role)) {
    return DEMO_ALL_NOTIFICATIONS.filter(n => ADMIN_NOTIF_ROLES.includes(n.userRole));
  }
  return DEMO_ALL_NOTIFICATIONS.filter(n => n.userRole === role);
};

// ========== COMPOSANT PRINCIPAL ==========
export default function NotificationsScreen({ navigation }: any) {
  // ========== ÉTATS ==========
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>({
    type: null,
    isRead: null
  });
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');
  const [showFilter, setShowFilter] = useState(false);

  // ========== ANIMATIONS ==========
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;

  // ========== EFFETS ==========
  useEffect(() => {
    loadNotifications();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      })
    ]).start();
  }, []);

  // ========== CHARGEMENT ==========
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await getNotifications(user.id);
      const raw: Notification[] = (response.data.notifications || []);
      // Filtrer par userId pour les non-admins
      const isAdminRole = ADMIN_NOTIF_ROLES.includes(user.role);
      const filtered = isAdminRole
        ? raw
        : raw.filter((n: Notification) => n.userId === user.id || n.userRole === user.role);
      const sorted = filtered.sort((a: Notification, b: Notification) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(sorted.length > 0 ? sorted : getDemoNotifications(user.role));
    } catch (error: any) {
      console.error('Erreur chargement notifications:', error);
      setNotifications(getDemoNotifications(user.role));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  // ========== FILTRAGE ==========
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Filtrer par type
    if (filter.type) {
      filtered = filtered.filter((n: Notification) => n.type === filter.type);
    }

    // Filtrer par statut lecture
    if (filter.isRead !== null) {
      filtered = filtered.filter((n: Notification) => n.isRead === filter.isRead);
    }

    // Trier
    if (sortBy === 'oldest') {
      filtered.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    return filtered;
  }, [notifications, filter, sortBy]);

  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n: Notification) => !n.isRead).length;
  }, [notifications]);

  // ========== ACTIONS ==========
  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error: any) {
      console.error('Erreur marquage lu:', error);
      Alert.alert('Erreur', 'Impossible de marquer comme lu');
    }
  }, []);

  const handleMarkAllRead = useCallback(() => {
    if (!user) return;

    Alert.alert(
      '✓ Marquer tout comme lu',
      'Confirmer le marquage de toutes les notifications ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await markAllNotificationsRead(user.id);
              setNotifications(prev =>
                prev.map(notif => ({ ...notif, isRead: true }))
              );
              Alert.alert('Succès', 'Toutes les notifications sont marquées comme lues');
            } catch (error: any) {
              console.error('Erreur marquage tout lu:', error);
              Alert.alert('Erreur', 'Impossible de marquer tout comme lu');
            }
          }
        }
      ]
    );
  }, [user]);

  const handleNotificationPress = useCallback((notification: Notification) => {
    if (!notification.isRead) {
      handleMarkRead(notification._id);
    }
    // Naviguer vers le détail si nécessaire
    // navigation.navigate('NotificationDetail', { notification });
  }, [handleMarkRead]);

  // ========== RENDU NOTIFICATION ==========
  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={[
            styles.notifCard,
            !item.isRead && styles.unreadCard
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.notifIconContainer,
              { backgroundColor: getIconBackgroundColor(item.type) }
            ]}
          >
            <Text style={styles.notifIcon}>{getIcon(item.type)}</Text>
          </View>

          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <Text
                style={[
                  styles.notifTitle,
                  !item.isRead && styles.unreadTitle
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.notifDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={styles.notifMessage} numberOfLines={2}>
              {item.message}
            </Text>
          </View>

          {!item.isRead && (
            <View style={styles.unreadIndicator} />
          )}
        </TouchableOpacity>
      </Animated.View>
    ),
    [handleNotificationPress, fadeAnim]
  );

  // ========== RENDU GROUPE ==========
  const renderSectionHeader = useCallback(
    ({ section }: { section: NotificationGroup }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
      </View>
    ),
    []
  );

  // ========== RENDU FILTRE ==========
  const FilterBar = () => (
    <View style={styles.filterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filter.isRead === null && styles.filterChipActive
          ]}
          onPress={() => setFilter({ ...filter, isRead: null })}
        >
          <Text style={[
            styles.filterChipText,
            filter.isRead === null && styles.filterChipTextActive
          ]}>
            Toutes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filter.isRead === false && styles.filterChipActive
          ]}
          onPress={() => setFilter({ ...filter, isRead: false })}
        >
          <Text style={[
            styles.filterChipText,
            filter.isRead === false && styles.filterChipTextActive
          ]}>
            Non lues ({notifications.filter(n => !n.isRead).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filter.type === 'success' && styles.filterChipActive
          ]}
          onPress={() => setFilter({ ...filter, type: filter.type === 'success' ? null : 'success' })}
        >
          <Text style={[
            styles.filterChipText,
            filter.type === 'success' && styles.filterChipTextActive
          ]}>
            ✅ Succès
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filter.type === 'error' && styles.filterChipActive
          ]}
          onPress={() => setFilter({ ...filter, type: filter.type === 'error' ? null : 'error' })}
        >
          <Text style={[
            styles.filterChipText,
            filter.type === 'error' && styles.filterChipTextActive
          ]}>
            ❌ Erreur
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filter.type === 'warning' && styles.filterChipActive
          ]}
          onPress={() => setFilter({ ...filter, type: filter.type === 'warning' ? null : 'warning' })}
        >
          <Text style={[
            styles.filterChipText,
            filter.type === 'warning' && styles.filterChipTextActive
          ]}>
            ⚠️ Alerte
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ========== RENDU VIDE ==========
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>
        {notifications.length === 0 
          ? 'Aucune notification' 
          : 'Aucune notification ne correspond'}
      </Text>
      <Text style={styles.emptyText}>
        {notifications.length === 0
          ? 'Vous êtes à jour avec toutes vos notifications'
          : 'Essayez de modifier les filtres'}
      </Text>
    </View>
  );

  // ========== RENDU LOADING ==========
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a3c5e" />
        <Text style={styles.loadingText}>Chargement des notifications...</Text>
      </View>
    );
  }

  // ========== RENDU PRINCIPAL ==========
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ========== EN-TÊTE ========== */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>🔔 Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {notifications.some((n: Notification) => !n.isRead) && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAllRead}
            >
              <Text style={styles.actionButtonText}>✓</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* ========== FILTRE ========== */}
      {notifications.length > 0 && <FilterBar />}

      {/* ========== LISTE ========== */}
      {filteredNotifications.length > 0 ? (
        <SectionList
          sections={groupedNotifications}
          keyExtractor={(item: Notification) => item._id}
          renderItem={renderNotification}
          renderSectionHeader={renderSectionHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1a3c5e']}
              tintColor="#1a3c5e"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => 'empty'}
          renderItem={() => null}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1a3c5e']}
            />
          }
          contentContainerStyle={styles.emptyListContent}
        />
      )}
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5fb'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f5fb'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b'
  },

  // ========== EN-TÊTE ==========
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4edf7',
    elevation: 3,
    shadowColor: '#0d2b3e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0d2b3e',
    letterSpacing: 0.2
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4edf7'
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1a3c5e'
  },

  // ========== FILTRE ==========
  filterBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4edf7'
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#f0f5fb',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e4edf7'
  },
  filterChipActive: {
    backgroundColor: '#1a3c5e',
    borderColor: '#1a3c5e'
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  filterChipTextActive: {
    color: '#fff'
  },

  // ========== LISTE ==========
  listContent: {
    paddingBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#f0f5fb',
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0d2b3e',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  sectionCount: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600'
  },

  // ========== NOTIFICATION CARD ==========
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 5,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4edf7',
    elevation: 1,
    shadowColor: '#0d2b3e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    alignItems: 'flex-start'
  },
  unreadCard: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#1a3c5e'
  },
  notifIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0
  },
  notifIcon: {
    fontSize: 22
  },
  notifContent: {
    flex: 1
  },
  notifHeader: {
    marginBottom: 5
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155'
  },
  unreadTitle: {
    color: '#1a3c5e',
    fontWeight: '700'
  },
  notifMessage: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19
  },
  notifDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 5,
    fontWeight: '500'
  },
  unreadIndicator: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#1a3c5e',
    marginLeft: 10,
    alignSelf: 'center',
    flexShrink: 0
  },

  // ========== ÉTAT VIDE ==========
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center'
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0d2b3e',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20
  }
});