import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getUserHistory } from '../services/api';

const { width, height } = Dimensions.get('window');

interface HistoryItem {
  _id: string;
  userId: string;
  userRole: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface FilterOptions {
  action: string;
  entityType: string;
  startDate: string;
  endDate: string;
}

// ─── Données de démonstration par rôle ───────────────────────────────────────
const _histNow = Date.now();
const DEMO_HISTORY_ALL: HistoryItem[] = [
  // Admin
  { _id: 'h1',  userId: 'u_admin',        userRole: 'Admin',        userEmail: 'admin@etap.tn',           action: 'login',    entityType: 'user',        entityId: 'u_admin',    details: null,                                              ipAddress: '192.168.1.10', userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 5 * 60000).toISOString() },
  { _id: 'h2',  userId: 'u_admin',        userRole: 'Admin',        userEmail: 'admin@etap.tn',           action: 'validate', entityType: 'facture',     entityId: 'fac-089',    details: { montant: 1250, devise: 'TND' },                  ipAddress: '192.168.1.10', userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 12 * 60000).toISOString() },
  { _id: 'h3',  userId: 'u_admin',        userRole: 'Admin',        userEmail: 'admin@etap.tn',           action: 'view',     entityType: 'commande',    entityId: 'cmd-087',    details: { numero: 'CMD-2024-087' },                        ipAddress: '192.168.1.10', userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 24 * 3600000).toISOString() },
  // Commercial
  { _id: 'h4',  userId: 'u_commercial',   userRole: 'Commercial',   userEmail: 'commercial@etap.tn',      action: 'create',   entityType: 'contrat',     entityId: 'cont-012',   details: { montant: 45000, client: 'Sté Pétrogazelle' },    ipAddress: '192.168.1.25', userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 2 * 3600000).toISOString() },
  { _id: 'h5',  userId: 'u_commercial',   userRole: 'Commercial',   userEmail: 'commercial@etap.tn',      action: 'export',   entityType: 'facture',     entityId: 'fac-085',    details: { format: 'PDF', pages: 3 },                      ipAddress: '192.168.1.25', userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 3 * 24 * 3600000).toISOString() },
  { _id: 'h6',  userId: 'u_commercial',   userRole: 'Commercial',   userEmail: 'commercial@etap.tn',      action: 'update',   entityType: 'commande',    entityId: 'cmd-091',    details: { statut: 'confirmee' },                           ipAddress: '192.168.1.25', userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 4 * 24 * 3600000).toISOString() },
  // Client
  { _id: 'h7',  userId: 'u_client',       userRole: 'Client',       userEmail: 'client@petrogazelle.tn',  action: 'create',   entityType: 'commande',    entityId: 'cmd-088',    details: { produits: ['Huile moteur 5L'], montant: 3200 },   ipAddress: '41.231.5.100', userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 2 * 24 * 3600000).toISOString() },
  { _id: 'h8',  userId: 'u_client',       userRole: 'Client',       userEmail: 'client@petrogazelle.tn',  action: 'view',     entityType: 'facture',     entityId: 'fac-082',    details: { numero: 'FAC-2024-082' },                        ipAddress: '41.231.5.100', userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 3 * 24 * 3600000).toISOString() },
  { _id: 'h9',  userId: 'u_client',       userRole: 'Client',       userEmail: 'client@petrogazelle.tn',  action: 'login',    entityType: 'user',        entityId: 'u_client',   details: null,                                              ipAddress: '41.231.5.100', userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 5 * 3600000).toISOString() },
  // Fournisseur
  { _id: 'h10', userId: 'u_fournisseur',  userRole: 'Fournisseur',  userEmail: 'fourn@abclogistique.tn',  action: 'update',   entityType: 'livraison',   entityId: 'liv-045',    details: { statut: 'en transit', adresse: 'Sfax' },          ipAddress: '41.230.8.5',   userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 5 * 3600000).toISOString() },
  { _id: 'h11', userId: 'u_fournisseur',  userRole: 'Fournisseur',  userEmail: 'fourn@abclogistique.tn',  action: 'login',    entityType: 'user',        entityId: 'u_fournisseur', details: null,                                           ipAddress: '41.230.8.5',   userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 4 * 24 * 3600000).toISOString() },
  { _id: 'h12', userId: 'u_fournisseur',  userRole: 'Fournisseur',  userEmail: 'fourn@abclogistique.tn',  action: 'create',   entityType: 'livraison',   entityId: 'liv-047',    details: { quantite: 200, destination: 'Bizerte' },         ipAddress: '41.230.8.5',   userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 5 * 24 * 3600000).toISOString() },
  // Transporteur
  { _id: 'h13', userId: 'u_transporteur', userRole: 'Transporteur', userEmail: 'trans@fasttransport.tn',  action: 'update',   entityType: 'livraison',   entityId: 'liv-046',    details: { statut: 'livree', km: 215 },                     ipAddress: '41.229.3.22',  userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 1 * 3600000).toISOString() },
  { _id: 'h14', userId: 'u_transporteur', userRole: 'Transporteur', userEmail: 'trans@fasttransport.tn',  action: 'login',    entityType: 'user',        entityId: 'u_transporteur', details: null,                                        ipAddress: '41.229.3.22',  userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 6 * 3600000).toISOString() },
  { _id: 'h15', userId: 'u_transporteur', userRole: 'Transporteur', userEmail: 'trans@fasttransport.tn',  action: 'view',     entityType: 'commande',    entityId: 'cmd-090',    details: { numero: 'CMD-2024-090' },                        ipAddress: '41.229.3.22',  userAgent: 'ETAP Mobile v2.0', createdAt: new Date(_histNow - 2 * 24 * 3600000).toISOString() },
];

const ADMIN_HIST_ROLES = ['Admin', 'Commercial'];

// Retourne l'historique selon le rôle
const getDemoHistory = (role: string): HistoryItem[] => {
  if (ADMIN_HIST_ROLES.includes(role)) return DEMO_HISTORY_ALL;
  return DEMO_HISTORY_ALL.filter(h => h.userRole === role);
};

// ─── Module-level pure helpers ───────────────────────────────────────────────

const getActionIcon = (action: string) => {
  const icons: Record<string, string> = {
    'create': '➕', 'update': '✏️', 'delete': '🗑️', 'login': '🔑',
    'logout': '🚪', 'view': '👁️', 'export': '📤', 'validate': '✅',
    'reject': '❌', 'upload': '📎', 'download': '📥'
  };
  return icons[action] || '📋';
};

const getActionColor = (action: string) => {
  const colors: Record<string, string> = {
    'create': '#4caf50', 'update': '#2196f3', 'delete': '#f44336',
    'login': '#1a3c5e', 'logout': '#ff9800', 'view': '#9c27b0',
    'export': '#00bcd4', 'validate': '#8bc34a', 'reject': '#ff5722'
  };
  return colors[action] || '#757575';
};

const getEntityIcon = (entityType: string) => {
  const icons: Record<string, string> = {
    'contrat': '📄', 'commande': '🛒', 'livraison': '🚚', 'facture': '💰',
    'user': '👤', 'tiers': '🏢', 'produit': '📦', 'notification': '🔔'
  };
  return icons[entityType] || '📋';
};

const getRoleIcon = (role: string) => {
  const icons: Record<string, string> = {
    'Admin': '👨‍💼', 'Commercial': '💼', 'Client': '👤',
    'Transporteur': '🚚', 'Fournisseur': '🏭'
  };
  return icons[role] || '👤';
};

const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    'Admin': '#d32f2f', 'Commercial': '#1976d2', 'Client': '#388e3c',
    'Transporteur': '#f57c00', 'Fournisseur': '#7b1fa2'
  };
  return colors[role] || '#757575';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return 'à l\'instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours} h`;
  if (days < 7) return `il y a ${days} j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem`;
  return formatDate(dateString);
};

// ─── Proper sub-component fixes hooks-in-render violation ─────────────────────

const HistoryItemCard = React.memo(({
  item,
  index,
  onPress,
}: {
  item: HistoryItem;
  index: number;
  onPress: (item: HistoryItem) => void;
}) => {
  const itemFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(itemFadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: itemFadeAnim }}>
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.itemIcon, { backgroundColor: getActionColor(item.action) + '20' }]}>
          <Text style={styles.itemIconText}>{getActionIcon(item.action)}</Text>
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemAction}>{item.action.toUpperCase()}</Text>
            <Text style={styles.itemTime}>{getRelativeTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.itemEntity}>
            {getEntityIcon(item.entityType)} {item.entityType}
          </Text>
          {item.details && (
            <Text style={styles.itemDetails} numberOfLines={1}>
              {typeof item.details === 'string'
                ? item.details
                : JSON.stringify(item.details).substring(0, 100)}
            </Text>
          )}
          <View style={styles.itemFooter}>
            <Text style={styles.itemUser}>👤 {item.userEmail}</Text>
            <Text style={styles.itemRole}>{item.userRole}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── InlineSelect — composant standalone (ne pas imbriquer dans HistoryScreen) ─

const InlineSelect = React.memo(({
  label, value, onValueChange, options,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { label: string; value: string }[];
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <View style={styles.customSelectContainer}>
      <TouchableOpacity style={styles.customSelectButton} onPress={() => setOpen(o => !o)}>
        <Text style={styles.customSelectText}>{selected?.label || label}</Text>
        <Text style={styles.customSelectArrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.customSelectOptions}>
          <ScrollView style={styles.customSelectScroll} nestedScrollEnabled>
            {options.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.customSelectOption, value === opt.value && styles.customSelectOptionActive]}
                onPress={() => { onValueChange(opt.value); setOpen(false); }}
              >
                <Text style={[styles.customSelectOptionText, value === opt.value && styles.customSelectOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────

const HistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  const [filters, setFilters] = useState<FilterOptions>({
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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

  const loadHistory = useCallback(async (page = 1, shouldAppend = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 🔧 Filtrer automatiquement par rôle de l'utilisateur connecté
      const params: any = {
        limit: pagination.limit,
        page,
        userRole: user.role  // ← NOUVEAU: Filtrer par rôle
      };
      
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await getUserHistory(user.id, params);
      const newHistory = response.data.history;
      const newPagination = response.data.pagination;
      
      if (shouldAppend) {
        setHistory(prev => [...prev, ...newHistory]);
      } else {
        setHistory(newHistory.length > 0 ? newHistory : getDemoHistory(user.role));
      }
      
      setPagination(newPagination);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      setHistory(getDemoHistory(user.role));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, filters, pagination.limit]);

  useEffect(() => {
    loadHistory(1, false);
  }, [filters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory(1, false);
  }, [loadHistory]);

  const loadMore = () => {
    if (!loading && pagination.page < pagination.pages) {
      loadHistory(pagination.page + 1, true);
    }
  };

  const renderHistoryItem = ({ item, index }: { item: HistoryItem; index: number }) => (
    <HistoryItemCard
      item={item}
      index={index}
      onPress={(i) => {
        setSelectedItem(i);
        setDetailModalVisible(true);
      }}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>Aucun historique</Text>
      <Text style={styles.emptyText}>
        Aucune action n'a été enregistrée pour le moment
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading && pagination.page >= pagination.pages) return null;
    if (!loading && history.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1a3c5e" />
        <Text style={styles.footerText}>Chargement...</Text>
      </View>
    );
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    loadHistory(1, false);
  };

  const resetFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      startDate: '',
      endDate: ''
    });
    setFilterModalVisible(false);
  };

  const actionOptions = [
    { label: 'Toutes les actions', value: '' },
    { label: '➕ Création', value: 'create' },
    { label: '✏️ Modification', value: 'update' },
    { label: '🗑️ Suppression', value: 'delete' },
    { label: '🔑 Connexion', value: 'login' },
    { label: '🚪 Déconnexion', value: 'logout' },
    { label: '👁️ Consultation', value: 'view' },
    { label: '📤 Export', value: 'export' },
    { label: '✅ Validation', value: 'validate' },
    { label: '❌ Rejet', value: 'reject' }
  ];

  const entityOptions = [
    { label: 'Toutes les entités', value: '' },
    { label: '📄 Contrats', value: 'contrat' },
    { label: '🛒 Commandes', value: 'commande' },
    { label: '🚚 Livraisons', value: 'livraison' },
    { label: '💰 Factures', value: 'facture' },
    { label: '👤 Utilisateurs', value: 'user' },
    { label: '🏢 Tiers', value: 'tiers' },
    { label: '📦 Produits', value: 'produit' },
    { label: '🔔 Notifications', value: 'notification' }
  ];


  // Statistiques
  const stats = {
    total: history.length,
    byAction: history.reduce((acc: Record<string, number>, item: HistoryItem) => {
      acc[item.action] = (acc[item.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byEntity: history.reduce((acc: Record<string, number>, item: HistoryItem) => {
      acc[item.entityType] = (acc[item.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return (
    <View style={styles.container}>
      {/* ── Filter Modal ─────────────────────────────────── */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔍 Filtrer l'historique</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Action</Text>
                <InlineSelect
                  label="Sélectionner une action"
                  value={filters.action}
                  onValueChange={(v) => setFilters(f => ({ ...f, action: v }))}
                  options={actionOptions}
                />
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Entité</Text>
                <InlineSelect
                  label="Sélectionner une entité"
                  value={filters.entityType}
                  onValueChange={(v) => setFilters(f => ({ ...f, entityType: v }))}
                  options={entityOptions}
                />
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Date de début</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                  value={filters.startDate}
                  onChangeText={(t) => setFilters(f => ({ ...f, startDate: t }))}
                />
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Date de fin</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                  value={filters.endDate}
                  onChangeText={(t) => setFilters(f => ({ ...f, endDate: t }))}
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Detail Modal ─────────────────────────────────── */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Détails de l'action</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedItem && (
              <ScrollView style={styles.detailBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>🔖 Informations générales</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Action:</Text>
                    <View style={[styles.detailBadge, { backgroundColor: getActionColor(selectedItem.action) + '20' }]}>
                      <Text style={[styles.detailBadgeText, { color: getActionColor(selectedItem.action) }]}>
                        {getActionIcon(selectedItem.action)} {selectedItem.action}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Entité:</Text>
                    <View style={styles.detailBadge}>
                      <Text style={styles.detailBadgeText}>
                        {getEntityIcon(selectedItem.entityType)} {selectedItem.entityType}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ID entité:</Text>
                    <Text style={styles.detailValue} selectable>{selectedItem.entityId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedItem.createdAt)}</Text>
                  </View>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>👤 Utilisateur</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedItem.userEmail}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rôle:</Text>
                    <View style={[styles.detailBadge, { backgroundColor: getRoleColor(selectedItem.userRole) + '20' }]}>
                      <Text style={[styles.detailBadgeText, { color: getRoleColor(selectedItem.userRole) }]}>
                        {getRoleIcon(selectedItem.userRole)} {selectedItem.userRole}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>ID:</Text>
                    <Text style={styles.detailValue} selectable>{selectedItem.userId}</Text>
                  </View>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>🌐 Informations techniques</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>IP:</Text>
                    <Text style={styles.detailValue}>{selectedItem.ipAddress || '—'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User Agent:</Text>
                    <Text style={styles.detailValue} numberOfLines={3}>{selectedItem.userAgent || '—'}</Text>
                  </View>
                </View>
                {selectedItem.details && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>📝 Détails supplémentaires</Text>
                    <View style={styles.detailsContainer}>
                      <Text style={styles.detailsText}>
                        {typeof selectedItem.details === 'string'
                          ? selectedItem.details
                          : JSON.stringify(selectedItem.details, null, 2)}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.closeModalButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* En-tête avec Badge Rôle */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>📜 Historique</Text>
          {user && (
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '20' }]}>
              <Text style={[styles.roleBadgeText, { color: getRoleColor(user.role) }]}>
                {getRoleIcon(user.role)} {user.role}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.filterButtonText}>🔍 Filtrer</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Cartes de statistiques */}
      <Animated.View style={[styles.statsContainer, { opacity: fadeAnim }]}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pagination.total}</Text>
          <Text style={styles.statLabel}>Total actions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Object.keys(stats.byAction).length}</Text>
          <Text style={styles.statLabel}>Types d'actions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Object.keys(stats.byEntity).length}</Text>
          <Text style={styles.statLabel}>Entités</Text>
        </View>
      </Animated.View>

      {/* Liste */}
      <FlatList
        data={history}
        keyExtractor={(item: HistoryItem) => item._id}
        renderItem={renderHistoryItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5fb'
  },
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
    flexDirection: 'column',
    gap: 6
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0d2b3e',
    letterSpacing: 0.2
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start'
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700'
  },
  filterButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e4edf7'
  },
  filterButtonText: {
    color: '#1a3c5e',
    fontSize: 13,
    fontWeight: '600'
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4edf7',
    elevation: 1,
    shadowColor: '#0d2b3e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a3c5e'
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center'
  },
  listContent: {
    paddingBottom: 24
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4edf7',
    elevation: 1,
    shadowColor: '#0d2b3e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  itemIconText: {
    fontSize: 22
  },
  itemContent: {
    flex: 1
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  itemAction: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a3c5e',
    letterSpacing: 0.5
  },
  itemTime: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500'
  },
  itemEntity: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 4,
    fontWeight: '500'
  },
  itemDetails: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemUser: {
    fontSize: 11,
    color: '#94a3b8'
  },
  itemRole: {
    fontSize: 10,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    color: '#1a3c5e',
    fontWeight: '600'
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 50
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0d2b3e',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center'
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13,43,62,0.55)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden'
  },
  detailModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    width: '90%',
    maxHeight: '85%',
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e4edf7'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0d2b3e'
  },
  modalClose: {
    fontSize: 20,
    color: '#94a3b8',
    padding: 5
  },
  modalBody: {
    padding: 18,
    maxHeight: 400
  },
  detailBody: {
    padding: 18
  },
  filterGroup: {
    marginBottom: 18
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0d2b3e',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  dateInput: {
    backgroundColor: '#f0f5fb',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e4edf7',
    color: '#0d2b3e'
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e4edf7',
    gap: 12
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f0f5fb',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4edf7'
  },
  resetButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600'
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#1a3c5e',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  closeModalButton: {
    flex: 1,
    backgroundColor: '#f0f5fb',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4edf7'
  },
  closeModalButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600'
  },
  detailSection: {
    marginBottom: 20
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3c5e',
    marginBottom: 12,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e4edf7'
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start'
  },
  detailLabel: {
    width: 100,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500'
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#0d2b3e',
    fontWeight: '500'
  },
  detailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  detailBadgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  detailsContainer: {
    backgroundColor: '#f0f5fb',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e4edf7'
  },
  detailsText: {
    fontSize: 12,
    color: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  customSelectContainer: {
    position: 'relative',
    zIndex: 1000
  },
  customSelectButton: {
    backgroundColor: '#f0f5fb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e4edf7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  customSelectText: {
    fontSize: 14,
    color: '#0d2b3e',
    fontWeight: '500'
  },
  customSelectArrow: {
    fontSize: 11,
    color: '#94a3b8'
  },
  customSelectOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4edf7',
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1001,
    elevation: 6,
    shadowColor: '#0d2b3e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6
  },
  customSelectScroll: {
    maxHeight: 200
  },
  customSelectOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f5fb'
  },
  customSelectOptionActive: {
    backgroundColor: '#eff6ff'
  },
  customSelectOptionText: {
    fontSize: 14,
    color: '#334155'
  },
  customSelectOptionTextActive: {
    color: '#1a3c5e',
    fontWeight: '700'
  }
});

export default HistoryScreen;