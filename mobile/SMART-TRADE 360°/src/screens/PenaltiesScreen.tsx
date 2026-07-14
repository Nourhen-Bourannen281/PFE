import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, Animated,
  Dimensions, Alert, ScrollView, StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getPenalties, payPenalty } from '../services/api';

const { width } = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────────────────────────
interface PenaltyUser  { _id: string; nom: string; prenom?: string; email: string; role: string; }
interface PenaltyContrat { _id: string; numero?: string; montantTotal?: number; }

interface Penalty {
  _id: string;
  contratId: PenaltyContrat | null;
  userId: PenaltyUser | null;
  type: string;
  montant: number;
  statut: 'en_attente' | 'appliquee' | 'conteste';
  description?: string;
  dateCreation: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUT_INFO: Record<string, { icon: string; text: string; color: string; bg: string }> = {
  en_attente: { icon: '⚠️', text: 'En attente',  color: '#f44336', bg: '#ffebee' },
  appliquee:  { icon: '✅', text: 'Appliquée',   color: '#4caf50', bg: '#e8f5e9' },
  conteste:   { icon: '⏳', text: 'Contestée',   color: '#ff9800', bg: '#fff3e0' },
};
const ROLE_COLOR: Record<string, string> = {
  Commercial: '#1565c0', Client: '#2e7d32', Transporteur: '#e65100', Fournisseur: '#6a1b9a',
};
const ROLE_ICON: Record<string, string> = {
  Commercial: '💼', Client: '🏢', Transporteur: '🚛', Fournisseur: '🏭',
};

const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const fmtCur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND';

// ── Rôles admin (voient toutes les pénalités) ──────────────────────────────────
const ADMIN_ROLES = ['Admin', 'Commercial'];

// ── Demo data par rôle ─────────────────────────────────────────────────────────
const DEMO_ALL: Penalty[] = [
  { _id: 'd1', contratId: { _id: 'c1', numero: 'CT-2024-001', montantTotal: 45000 }, userId: { _id: 'u_client_1',       nom: 'Ben Ali',   prenom: 'Sami',  email: 'sami@etap.tn',    role: 'Client'       }, type: 'retard_livraison', montant: 810,  statut: 'en_attente', description: 'Retard livraison 18 jours', dateCreation: new Date(Date.now() - 10*86400000).toISOString() },
  { _id: 'd2', contratId: { _id: 'c2', numero: 'CT-2024-015', montantTotal: 78000 }, userId: { _id: 'u_fournisseur_1',  nom: 'Trabelsi',  prenom: 'Hedi',  email: 'hedi@abc.tn',     role: 'Fournisseur'  }, type: 'retard_livraison', montant: 2730, statut: 'en_attente', description: 'Retard livraison 35 jours', dateCreation: new Date(Date.now() - 14*86400000).toISOString() },
  { _id: 'd3', contratId: { _id: 'c3', numero: 'CT-2024-008', montantTotal: 22500 }, userId: { _id: 'u_client_2',       nom: 'Chaabane',  prenom: 'Rim',   email: 'rim@etap.tn',     role: 'Client'       }, type: 'retard_livraison', montant: 112,  statut: 'appliquee',  description: 'Retard 5 jours payé',       dateCreation: new Date(Date.now() - 20*86400000).toISOString() },
  { _id: 'd4', contratId: { _id: 'c4', numero: 'CT-2024-022', montantTotal: 60000 }, userId: { _id: 'u_transporteur_1', nom: 'Mansouri',  prenom: 'Khaled',email: 'khaled@trans.tn', role: 'Transporteur' }, type: 'retard_livraison', montant: 1500, statut: 'conteste',   description: 'Retard 25 jours contesté',  dateCreation: new Date(Date.now() - 5*86400000).toISOString()  },
  { _id: 'd5', contratId: { _id: 'c5', numero: 'CT-2024-030', montantTotal: 33000 }, userId: { _id: 'u_client_1',       nom: 'Ben Ali',   prenom: 'Sami',  email: 'sami@etap.tn',    role: 'Client'       }, type: 'retard_livraison', montant: 330,  statut: 'appliquee',  description: 'Retard 10 jours',           dateCreation: new Date(Date.now() - 30*86400000).toISOString() },
];

// Retourne les démos filtrées selon le rôle et l'ID de l'utilisateur connecté
const getDemoForUser = (userId: string, role: string): Penalty[] => {
  if (ADMIN_ROLES.includes(role)) return DEMO_ALL;
  return DEMO_ALL.filter(p => p.userId?._id === userId || p.userId?.role === role);
};

// ── PenaltyCard ────────────────────────────────────────────────────────────────
const PenaltyCard = React.memo(({ item, index, onPress }: { item: Penalty; index: number; onPress: (i: Penalty) => void }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const si   = STATUT_INFO[item.statut] || STATUT_INFO.en_attente;
  const rc   = ROLE_COLOR[item.userId?.role || ''] || '#607d8b';
  const ri   = ROLE_ICON[item.userId?.role || ''] || '👤';

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim }}>
      <TouchableOpacity style={[s.card, { borderLeftColor: si.color }]} onPress={() => onPress(item)} activeOpacity={0.75}>

        {/* Row 1: qui + statut */}
        <View style={s.cardTop}>
          <View style={[s.rolePill, { backgroundColor: rc + '18' }]}>
            <Text style={[s.rolePillText, { color: rc }]}>{ri} {item.userId?.role || '—'}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: si.bg }]}>
            <Text style={[s.statusText, { color: si.color }]}>{si.icon} {si.text}</Text>
          </View>
        </View>

        {/* Row 2: nom utilisateur */}
        <Text style={s.userName} numberOfLines={1}>
          {item.userId ? `${item.userId.nom} ${item.userId.prenom || ''}`.trim() : '—'}
        </Text>
        <Text style={s.userEmail} numberOfLines={1}>{item.userId?.email || '—'}</Text>

        {/* Row 3: contrat + montant */}
        <View style={s.cardBottom}>
          <View>
            <Text style={s.cardLabel}>Contrat</Text>
            <Text style={s.cardContrat}>{item.contratId?.numero || '—'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.cardLabel}>Montant pénalité</Text>
            <Text style={[s.cardAmount, { color: si.color }]}>{fmtCur(item.montant)}</Text>
          </View>
        </View>

        {/* Row 4: description + date */}
        {item.description && <Text style={s.cardDesc} numberOfLines={1}>📝 {item.description}</Text>}
        <Text style={s.cardDate}>📅 {fmt(item.dateCreation)}</Text>

      </TouchableOpacity>
    </Animated.View>
  );
});

// ── Ecran principal ────────────────────────────────────────────────────────────
export default function PenaltiesScreen() {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role || '');

  const [penalties,  setPenalties]  = useState<Penalty[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected,   setSelected]   = useState<Penalty | null>(null);
  const [modalVis,   setModalVis]   = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [filterStat, setFilterStat] = useState('all');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    load();
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getPenalties(user.id);
      const raw: Penalty[] = res.data?.data || res.data?.penalties || [];
      if (raw.length > 0) {
        // Filtrage selon le rôle : admin voit tout, autres voient leurs propres pénalités
        const data = isAdmin ? raw : raw.filter(p => p.userId?._id === user.id);
        setPenalties(data);
      } else {
        // Données démo filtrées par rôle
        setPenalties(getDemoForUser(user.id, user.role));
      }
    } catch {
      // En cas d'erreur réseau, afficher les démos filtrées par rôle
      setPenalties(getDemoForUser(user.id, user.role));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, isAdmin]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const filtered = useMemo(() => {
    if (filterStat === 'all') return penalties;
    return penalties.filter(p => p.statut === filterStat);
  }, [penalties, filterStat]);

  // stats
  const total      = penalties.reduce((s, p) => s + p.montant, 0);
  const enAttente  = penalties.filter(p => p.statut === 'en_attente');
  const appliquees = penalties.filter(p => p.statut === 'appliquee');
  const contestees = penalties.filter(p => p.statut === 'conteste');

  const handlePay = useCallback(async () => {
    if (!selected) return;
    Alert.alert('💳 Confirmation', `Payer ${fmtCur(selected.montant)} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Payer', onPress: async () => {
        setPayLoading(true);
        try {
          await payPenalty(selected._id);
          Alert.alert('✅ Succès', 'Paiement effectué');
          setModalVis(false);
          load();
        } catch (e: any) {
          Alert.alert('Erreur', e.response?.data?.message || 'Paiement impossible');
        } finally { setPayLoading(false); }
      }},
    ]);
  }, [selected, load]);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#1a3c5e" />
      <Text style={s.loadingText}>Chargement...</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Detail Modal ────────────────────────────────── */}
      <Modal visible={modalVis} transparent animationType="slide" onRequestClose={() => setModalVis(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>📋 Détail Pénalité</Text>
              <TouchableOpacity onPress={() => setModalVis(false)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {selected && (() => {
              const si = STATUT_INFO[selected.statut] || STATUT_INFO.en_attente;
              const rc = ROLE_COLOR[selected.userId?.role || ''] || '#607d8b';
              const ri = ROLE_ICON[selected.userId?.role || ''] || '👤';
              return (
                <ScrollView style={s.modalBody}>
                  {/* Statut */}
                  <View style={[s.statusBlock, { backgroundColor: si.bg }]}>
                    <Text style={[s.statusBlockText, { color: si.color }]}>{si.icon} {si.text}</Text>
                  </View>
                  {/* Montant */}
                  <View style={s.amountBlock}>
                    <Text style={s.amountBlockLabel}>Montant pénalité</Text>
                    <Text style={s.amountBlockValue}>{fmtCur(selected.montant)}</Text>
                  </View>
                  {/* Utilisateur */}
                  <View style={s.section}>
                    <Text style={s.secTitle}>👤 Utilisateur concerné</Text>
                    <Row label="Nom"   value={`${selected.userId?.nom || '—'} ${selected.userId?.prenom || ''}`.trim()} />
                    <Row label="Email" value={selected.userId?.email || '—'} />
                    <Row label="Rôle"  value={`${ri} ${selected.userId?.role || '—'}`} color={rc} />
                  </View>
                  {/* Contrat */}
                  <View style={s.section}>
                    <Text style={s.secTitle}>📄 Contrat</Text>
                    <Row label="Numéro"  value={selected.contratId?.numero || '—'} />
                    {selected.contratId?.montantTotal != null && (
                      <Row label="Montant" value={fmtCur(selected.contratId.montantTotal)} />
                    )}
                  </View>
                  {/* Pénalité */}
                  <View style={s.section}>
                    <Text style={s.secTitle}>⚠️ Pénalité</Text>
                    <Row label="Type"        value="Retard livraison" />
                    <Row label="Description" value={selected.description || '—'} />
                    <Row label="Date"        value={fmt(selected.dateCreation)} />
                  </View>
                  {selected.statut === 'en_attente' && (
                    <TouchableOpacity style={s.payBtn} onPress={handlePay} disabled={payLoading}>
                      {payLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.payBtnText}>💳 Payer maintenant</Text>}
                    </TouchableOpacity>
                  )}
                </ScrollView>
              );
            })()}
            <View style={s.modalFooter}>
              <TouchableOpacity style={s.closeBtn} onPress={() => setModalVis(false)}>
                <Text style={s.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Header ──────────────────────────────────────── */}
      <Animated.View style={[s.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>⚠️ Pénalités retard</Text>
          {user?.role ? (
            <View style={[s.roleBadge, { backgroundColor: (ROLE_COLOR[user.role] || '#607d8b') + '18' }]}>
              <Text style={[s.roleBadgeText, { color: ROLE_COLOR[user.role] || '#607d8b' }]}>
                {ROLE_ICON[user.role] || '👤'} {user.role}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={s.headerSub}>
          {isAdmin
            ? `${penalties.length} pénalité(s) — toutes les parties`
            : `${penalties.length} pénalité(s) pour ${user?.nom || 'vous'}`}
        </Text>
      </Animated.View>

      {/* ── Résumé ──────────────────────────────────────── */}
      <Animated.View style={[s.summary, { opacity: fadeAnim }]}>
        <View style={s.summaryMain}>
          <Text style={s.summaryTotal}>{fmtCur(total)}</Text>
          <Text style={s.summaryLabel}>Montant total</Text>
        </View>
        <View style={s.summaryRow}>
          <SummaryCard count={enAttente.length}  label="En attente" color="#f44336" bg="#ffebee" />
          <SummaryCard count={appliquees.length} label="Appliquées" color="#4caf50" bg="#e8f5e9" />
          <SummaryCard count={contestees.length} label="Contestées" color="#ff9800" bg="#fff3e0" />
        </View>
      </Animated.View>

      {/* ── Filtres ─────────────────────────────────────── */}
      <View style={s.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { v: 'all',        l: 'Toutes' },
            { v: 'en_attente', l: '⚠️ En attente' },
            { v: 'appliquee',  l: '✅ Appliquées' },
            { v: 'conteste',   l: '⏳ Contestées' },
          ].map(o => (
            <TouchableOpacity
              key={o.v}
              style={[s.chip, filterStat === o.v && s.chipActive]}
              onPress={() => setFilterStat(o.v)}
            >
              <Text style={[s.chipText, filterStat === o.v && s.chipTextActive]}>{o.l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Liste ───────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={i => i._id}
        renderItem={({ item, index }) => (
          <PenaltyCard item={item} index={index} onPress={p => { setSelected(p); setModalVis(true); }} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a3c5e']} />}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>✅</Text>
            <Text style={s.emptyTitle}>Aucune pénalité</Text>
            <Text style={s.emptyText}>
              {filterStat !== 'all'
                ? 'Aucune pénalité avec ce statut'
                : isAdmin
                  ? 'Aucun retard enregistré dans le système'
                  : `Aucun retard enregistré pour votre compte`}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ── Petits composants ──────────────────────────────────────────────────────────
const SummaryCard = ({ count, label, color, bg }: { count: number; label: string; color: string; bg: string }) => (
  <View style={[s.summaryCard, { backgroundColor: bg }]}>
    <Text style={[s.summaryCardCount, { color }]}>{count}</Text>
    <Text style={[s.summaryCardLabel, { color }]}>{label}</Text>
  </View>
);

const Row = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={s.row}>
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={[s.rowValue, color ? { color } : {}]} numberOfLines={2}>{value}</Text>
  </View>
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5fb' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f5fb' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },

  header: {
    paddingHorizontal: 18, paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e4edf7',
    elevation: 3, shadowColor: '#0d2b3e', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  headerRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  headerTitle:     { fontSize: 22, fontWeight: '800', color: '#0d2b3e' },
  headerSub:       { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  roleBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleBadgeText:   { fontSize: 12, fontWeight: '700' },

  summary: {
    padding: 14, backgroundColor: '#fff', marginBottom: 6,
    borderBottomWidth: 1, borderBottomColor: '#e4edf7',
  },
  summaryMain:  { backgroundColor: '#0d2b3e', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  summaryTotal: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '500' },
  summaryRow:   { flexDirection: 'row', gap: 10 },
  summaryCard:  { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  summaryCardCount: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  summaryCardLabel: { fontSize: 10, fontWeight: '600' },

  filters: {
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff',
    marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e4edf7',
  },
  chip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#f0f5fb', marginHorizontal: 4, borderWidth: 1, borderColor: '#e4edf7' },
  chipActive:   { backgroundColor: '#1a3c5e', borderColor: '#1a3c5e' },
  chipText:     { fontSize: 13, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  list: { paddingHorizontal: 14, paddingVertical: 8, paddingBottom: 24 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginVertical: 6,
    borderLeftWidth: 4, borderWidth: 1, borderColor: '#e4edf7',
    elevation: 2, shadowColor: '#0d2b3e', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rolePill:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  rolePillText: { fontSize: 12, fontWeight: '700' },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  userName:     { fontSize: 14, fontWeight: '700', color: '#0d2b3e', marginBottom: 2 },
  userEmail:    { fontSize: 11, color: '#94a3b8', marginBottom: 10 },
  cardBottom:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  cardLabel:    { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.4, marginBottom: 3 },
  cardContrat:  { fontSize: 13, fontWeight: '600', color: '#1a3c5e' },
  cardAmount:   { fontSize: 17, fontWeight: '800' },
  cardDesc:     { fontSize: 11, color: '#64748b', marginBottom: 4 },
  cardDate:     { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

  overlay: { flex: 1, backgroundColor: 'rgba(13,43,62,0.55)', justifyContent: 'center', alignItems: 'center' },
  modal:   { backgroundColor: '#fff', borderRadius: 22, width: '92%', maxHeight: '88%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#e4edf7' },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: '#0d2b3e' },
  modalClose:  { fontSize: 20, color: '#94a3b8', padding: 4 },
  modalBody:   { padding: 18 },
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#e4edf7' },

  statusBlock:     { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 14 },
  statusBlockText: { fontSize: 15, fontWeight: '700' },

  amountBlock:      { backgroundColor: '#f0f5fb', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#e4edf7' },
  amountBlockLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '500', marginBottom: 6 },
  amountBlockValue: { fontSize: 30, fontWeight: '800', color: '#1a3c5e' },

  section:  { marginBottom: 16 },
  secTitle: { fontSize: 14, fontWeight: '700', color: '#1a3c5e', marginBottom: 10, paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: '#e4edf7' },

  row:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f0f5fb' },
  rowLabel:  { fontSize: 13, color: '#64748b', flex: 1 },
  rowValue:  { fontSize: 13, fontWeight: '600', color: '#0d2b3e', flex: 2, textAlign: 'right' },

  payBtn:     { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  closeBtn:     { backgroundColor: '#f0f5fb', borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e4edf7' },
  closeBtnText: { color: '#64748b', fontSize: 14, fontWeight: '600' },

  empty:      { alignItems: 'center', paddingVertical: 80 },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0d2b3e', marginBottom: 8 },
  emptyText:  { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});
