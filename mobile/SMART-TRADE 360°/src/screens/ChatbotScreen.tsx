import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { STORAGE_KEYS } from '../services/storage';

// ========== TYPES ==========
interface Action {
  type: 'navigate' | 'pdf' | 'data' | 'table';
  screen?: string;
  params?: Record<string, any>;
  base64?: string;
  filename?: string;
  items?: any[];
  user?: any;
  // table
  title?: string;
  columns?: string[];
  rows?: string[][];
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
  action?: Action;
}

interface User {
  id: string;
  _id?: string;
  nom: string;
  email: string;
  role: 'Admin' | 'Commercial' | 'Client' | 'Transporteur' | 'Fournisseur';
}

// ========== CONFIG ==========
const API_BASE_URL = 'http://172.16.27.20:5001/api';
const STORAGE_KEY_PREFIX = STORAGE_KEYS.CHAT_HISTORY + '_';
const MAX_STORED = 100;

const apiClient = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ========== SUGGESTIONS PAR RÔLE ==========
const SUGGESTIONS: Record<string, string[]> = {
  Admin:        ['Tiers', 'Liste utilisateurs', 'Notifications admin', 'Contrats expirés'],
  Commercial:   ['Mes commandes en attente', 'Contrats bientôt expirés', 'Générer facture PDF', 'Mes notifications'],
  Client:       ['Mes commandes en attente', 'Contrats expirés', 'Générer facture PDF', 'Mes notifications'],
  Transporteur: ['Mes livraisons', 'Générer facture PDF', 'Contrats bientôt expirés', 'Mes notifications livraison'],
  Fournisseur:  ['Mes commandes en attente', 'Contrats expirés', 'Générer facture PDF', 'Mes notifications'],
};

// ========== COMPOSANT ==========
export default function ChatbotScreen() {
  const navigation = useNavigation<any>();
  const [user,    setUser]    = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [init,    setInit]    = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // ── Init ──────────────────────────────────────────────────────
  useEffect(() => { bootstrap(); }, []);
  useEffect(() => {
    if (messages.length > 0)
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages]);

  const bootstrap = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (!raw) { setInit(false); return; }
      const u: User = JSON.parse(raw);
      setUser(u);
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${u.id || u._id}`);
      if (stored) {
        const parsed = JSON.parse(stored).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        setMessages(parsed);
      } else {
        setMessages([welcome(u)]);
      }
    } finally { setInit(false); }
  };

  const WELCOME_TEXT: Record<string, string> = {
    Admin: `Bonjour ${'{nom}'} 👑 Je suis votre assistant ETAP Admin.\n\nJe peux :\n• 📋 Afficher le tableau des Tiers (Clients type 0 / Fournisseurs type 1)\n• 👥 Lister tous les utilisateurs avec leur rôle\n• 🔔 Voir les notifications système\n• 📑 Consulter les contrats expirés`,
    Commercial: `Bonjour ${'{nom}'} 💼 Je suis votre assistant ETAP.\n\nJe peux :\n• 📦 Voir vos commandes en attente\n• 📄 Générer des factures PDF\n• 📋 Consulter les contrats bientôt expirés\n• 🔔 Voir vos notifications`,
    Client: `Bonjour ${'{nom}'} 🏢 Je suis votre assistant ETAP.\n\nJe peux :\n• 📦 Voir vos commandes en attente\n• 📄 Générer des factures PDF\n• 📋 Voir vos contrats expirés\n• 🔔 Consulter vos notifications`,
    Transporteur: `Bonjour ${'{nom}'} 🚛 Je suis votre assistant ETAP.\n\nJe peux :\n• 🚚 Voir vos notifications de livraison\n• 📋 Consulter les contrats bientôt expirés\n• 🗺️ Naviguer vers l'historique\n• ❓ Répondre à vos questions`,
    Fournisseur: `Bonjour ${'{nom}'} 🏭 Je suis votre assistant ETAP.\n\nJe peux :\n• 📦 Voir vos commandes reçues\n• 📄 Générer des factures PDF\n• 📋 Voir vos contrats expirés\n• 🔔 Consulter vos notifications`,
  };

  const welcome = (u: User): Message => ({
    id: '0', isUser: false, timestamp: new Date(),
    text: (WELCOME_TEXT[u.role] || WELCOME_TEXT.Client).replace('{nom}', u.nom),
    suggestions: SUGGESTIONS[u.role] || SUGGESTIONS.Client,
  });

  // ── Envoi message ─────────────────────────────────────────────
  const send = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || !user || loading) return;

    const userMsg: Message = { id: Date.now().toString(), text: msg, isUser: true, timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      // Essayer d'abord l'endpoint action intelligent
      let res;
      try {
        res = await apiClient.post('/chatbot/action', { message: msg });
      } catch {
        // Fallback vers l'endpoint classique
        res = await apiClient.post('/chatbot', { message: msg, userRole: user.role });
      }

      const { response, action, suggestions } = res.data;
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response || 'Je n\'ai pas pu répondre.',
        isUser: false,
        timestamp: new Date(),
        suggestions: suggestions || SUGGESTIONS[user.role],
        action,
      };

      const final = [...updated, botMsg];
      setMessages(final);
      await AsyncStorage.setItem(
        `${STORAGE_KEY_PREFIX}${user.id || user._id}`,
        JSON.stringify(final.slice(-MAX_STORED))
      );
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `❌ ${err?.response?.data?.message || err.message || 'Erreur de connexion'}`,
        isUser: false, timestamp: new Date(),
        suggestions: SUGGESTIONS[user.role],
      };
      setMessages([...updated, errMsg]);
    } finally { setLoading(false); }
  }, [messages, user, loading]);

  // ── Mapping noms chatbot → vrais screens de l'app ─────────────
  const SCREEN_MAP: Record<string, string> = {
    // Tabs (dans Main)
    'Accueil':       'Accueil',
    'Notifications': 'Notifications',
    'Assistant':     'Assistant',
    'History':       'History',
    'Historique':    'History',
    'Profil':        'Profil',
    // Stack
    'Penalties':     'Penalties',
    'Penalites':     'Penalties',
    'QRScanner':     'QRScanner',
    // Pas de screen dédié → Accueil
    'Commandes':     'Accueil',
    'Contrats':      'Accueil',
    'Factures':      'Accueil',
    'Livraisons':    'Accueil',
    'Contrat':       'Accueil',
    'Commande':      'Accueil',
    'Facture':       'Accueil',
    'Livraison':     'Accueil',
  };

  // ── Action navigation ─────────────────────────────────────────
  const handleNavigate = useCallback((action: Action) => {
    if (!action.screen) return;
    const realScreen = SCREEN_MAP[action.screen] || 'Accueil';
    const tabScreens = ['Accueil', 'Notifications', 'Assistant', 'History', 'Profil'];
    try {
      if (tabScreens.includes(realScreen)) {
        // Tabs imbriqués dans Main → navigation.navigate('Main', { screen: '...' })
        navigation.navigate('Main' as never, { screen: realScreen } as never);
      } else {
        navigation.navigate(realScreen as never);
      }
    } catch {
      Alert.alert('Navigation', `Page "${action.screen}" non disponible.`);
    }
  }, [navigation]);

  // ── Action PDF — sauvegarder sur le téléphone ─────────────────
  const handlePDF = useCallback(async (action: Action) => {
    if (!action.base64 || !action.filename) return;
    try {
      // 1. Sauvegarder dans le répertoire permanent de l'app
      const permanentPath = `${FileSystem.documentDirectory}${action.filename}`;
      await FileSystem.writeAsStringAsync(
        permanentPath,
        action.base64,
        { encoding: FileSystem.EncodingType.Base64 }
      );

      // 2. Sur Android : copier vers le dossier Downloads via SAF
      if (Platform.OS === 'android') {
        try {
          const SAF = FileSystem.StorageAccessFramework;
          const permissions = await SAF.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const destUri = await SAF.createFileAsync(
              permissions.directoryUri,
              action.filename,
              'application/pdf'
            );
            const content = await FileSystem.readAsStringAsync(permanentPath, {
              encoding: FileSystem.EncodingType.Base64,
            });
            await SAF.writeAsStringAsync(destUri, content, {
              encoding: FileSystem.EncodingType.Base64,
            });
            Alert.alert(
              '✅ PDF sauvegardé',
              `"${action.filename}" a été sauvegardé dans le dossier sélectionné.`,
              [
                { text: 'OK' },
                { text: '📤 Partager', onPress: () => Sharing.shareAsync(permanentPath, { mimeType: 'application/pdf' }) },
              ]
            );
          } else {
            // Pas de permission SAF → partager directement
            await Sharing.shareAsync(permanentPath, { mimeType: 'application/pdf', dialogTitle: 'Enregistrer la facture' });
          }
        } catch {
          // Fallback partage
          await Sharing.shareAsync(permanentPath, { mimeType: 'application/pdf', dialogTitle: 'Enregistrer la facture' });
        }
      } else {
        // iOS : partager avec option "Enregistrer dans Fichiers"
        await Sharing.shareAsync(permanentPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Enregistrer la facture',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (e: any) {
      Alert.alert('❌ Erreur', `Impossible de sauvegarder le PDF : ${e.message}`);
    }
  }, []);

  // ── Clear ─────────────────────────────────────────────────────
  const clearChat = () => {
    Alert.alert('Effacer', 'Effacer la conversation ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: () => {
        if (user) {
          AsyncStorage.removeItem(`${STORAGE_KEY_PREFIX}${user.id || user._id}`);
          setMessages([welcome(user)]);
        }
      }},
    ]);
  };

  // ── Rendu message ─────────────────────────────────────────────
  const renderMessage = ({ item: msg }: { item: Message }) => (
    <View style={[s.row, msg.isUser ? s.rowUser : s.rowBot]}>
      {!msg.isUser && (
        <View style={s.avatar}><Text style={s.avatarText}>🤖</Text></View>
      )}
      <View style={{ flex: 1, maxWidth: '85%' }}>
        <View style={[s.bubble, msg.isUser ? s.bubbleUser : s.bubbleBot]}>
          <Text style={[s.text, msg.isUser ? s.textUser : s.textBot]}>{msg.text}</Text>
          <Text style={s.time}>
            {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Tableau de données */}
        {!msg.isUser && msg.action?.type === 'table' && msg.action.rows && (
          <View style={s.tableWrap}>
            {msg.action.title && (
              <View style={s.tableHeader}>
                <Text style={s.tableTitle}>{msg.action.title}</Text>
              </View>
            )}
            {/* Colonnes */}
            {msg.action.columns && (
              <View style={[s.tableRow, s.tableColRow]}>
                {msg.action.columns.map((col, i) => (
                  <Text key={i} style={[s.tableCell, s.tableCellHeader, { flex: i === 0 ? 2 : 1 }]}>{col}</Text>
                ))}
              </View>
            )}
            {/* Lignes */}
            {msg.action.rows.slice(0, 20).map((row, ri) => (
              <View key={ri} style={[s.tableRow, ri % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}>
                {row.map((cell, ci) => (
                  <Text key={ci} style={[s.tableCell, { flex: ci === 0 ? 2 : 1 }]}
                    numberOfLines={1}>{cell}</Text>
                ))}
              </View>
            ))}
            {msg.action.rows.length > 20 && (
              <Text style={s.tableMore}>+{msg.action.rows.length - 20} autres lignes</Text>
            )}
          </View>
        )}

        {/* Bouton action */}
        {!msg.isUser && msg.action && msg.action.type !== 'table' && (
          <View style={s.actionWrap}>
            {msg.action.type === 'navigate' && (
              <TouchableOpacity style={s.actionBtn} onPress={() => handleNavigate(msg.action!)}>
                <Text style={s.actionIcon}>🗺️</Text>
                <Text style={s.actionLabel}>Ouvrir {msg.action.screen}</Text>
              </TouchableOpacity>
            )}
            {msg.action.type === 'pdf' && (
              <TouchableOpacity style={[s.actionBtn, s.actionPDF]} onPress={() => handlePDF(msg.action!)}>
                <Text style={s.actionIcon}>📥</Text>
                <Text style={s.actionLabel}>Sauvegarder PDF sur le téléphone</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Suggestions */}
        {!msg.isUser && msg.suggestions && msg.suggestions.length > 0 && (
          <View style={s.chips}>
            {msg.suggestions.map((sug, i) => (
              <TouchableOpacity key={i} style={s.chip} onPress={() => send(sug)} activeOpacity={0.7}>
                <Text style={s.chipText}>{sug}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  // ── Loading initial ───────────────────────────────────────────
  if (init) return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <View style={s.header}><Text style={s.headerTitle}>🤖 Assistant ETAP</Text></View>
      <View style={s.center}><ActivityIndicator size="large" color="#1a3c5e" /></View>
    </SafeAreaView>
  );

  // ── Rendu principal ───────────────────────────────────────────
  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>🤖 Assistant ETAP</Text>
          {user && <Text style={s.headerSub}>{user.nom} · {user.role}</Text>}
        </View>
        <TouchableOpacity onPress={clearChat} style={s.iconBtn}>
          <Text style={{ fontSize: 20 }}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={s.list}
        />

        {loading && (
          <View style={s.typing}>
            <ActivityIndicator size="small" color="#1a3c5e" />
            <Text style={s.typingText}>L'assistant réfléchit...</Text>
          </View>
        )}

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Posez une question ou donnez un ordre..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={500}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnOff]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
          >
            <Text style={{ fontSize: 22 }}>{loading ? '⏳' : '📤'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5fb' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    backgroundColor: '#0d2b3e', paddingHorizontal: 18, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headerSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  iconBtn:     { padding: 8 },

  // List
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8 },

  // Messages
  row:     { flexDirection: 'row', marginBottom: 16, gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowBot:  { justifyContent: 'flex-start', alignItems: 'flex-end' },

  avatar:     { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e4edf7', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18 },

  bubble:     { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  bubbleUser: { backgroundColor: '#1a3c5e', borderBottomRightRadius: 4 },
  bubbleBot:  { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e4edf7', elevation: 2, shadowColor: '#0d2b3e', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },

  text:     { fontSize: 14, lineHeight: 21 },
  textUser: { color: '#fff' },
  textBot:  { color: '#0d1b2a' },
  time:     { fontSize: 10, color: 'rgba(100,116,139,0.8)', marginTop: 5, textAlign: 'right' },

  // Tableau
  tableWrap:       { marginTop: 10, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e4edf7', backgroundColor: '#fff' },
  tableHeader:     { backgroundColor: '#0d2b3e', paddingHorizontal: 12, paddingVertical: 8 },
  tableTitle:      { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },
  tableColRow:     { backgroundColor: '#1a3c5e' },
  tableRow:        { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 7 },
  tableRowEven:    { backgroundColor: '#f0f5fb' },
  tableRowOdd:     { backgroundColor: '#fff' },
  tableCell:       { fontSize: 11, color: '#0d1b2a', paddingHorizontal: 3 },
  tableCellHeader: { color: '#fff', fontWeight: '700', fontSize: 11 },
  tableMore:       { textAlign: 'center', fontSize: 11, color: '#64748b', padding: 6, backgroundColor: '#f8fafc' },

  // Action buttons
  actionWrap: { marginTop: 8 },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a3c5e', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, gap: 8, alignSelf: 'flex-start' },
  actionPDF:  { backgroundColor: '#10b981' },
  actionIcon: { fontSize: 18 },
  actionLabel:{ color: '#fff', fontWeight: '700', fontSize: 13 },

  // Chips suggestions
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip:     { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe' },
  chipText: { fontSize: 12, color: '#1d4ed8', fontWeight: '600' },

  // Input
  typing:     { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e4edf7', gap: 8 },
  typingText: { color: '#64748b', fontSize: 12, fontStyle: 'italic' },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e4edf7', gap: 8 },
  input:    { flex: 1, backgroundColor: '#f8fafc', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 14, color: '#0d1b2a', borderWidth: 1.5, borderColor: '#e4edf7' },
  sendBtn:  { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1a3c5e', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#1a3c5e', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5 },
  sendBtnOff: { backgroundColor: '#cbd5e1', elevation: 0 },
});
