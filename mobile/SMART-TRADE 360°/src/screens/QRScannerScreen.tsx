import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Vibration,
  Animated, Dimensions, StatusBar, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ========== TYPES ==========
interface QRScanResult { data: string; type: string; }
interface QRCodeFormat  { featureId: string; role: string; }
interface ScanResult {
  type: 'feature' | 'login' | 'error';
  icon: string;
  title: string;
  subtitle: string;
  route?: string;
  userData?: any;
  token?: string;
}

type UserRole = 'Admin' | 'Commercial' | 'Client' | 'Transporteur' | 'Fournisseur';

// ========== CONSTANTES ==========
const { width } = Dimensions.get('window');
// Capture featureId, role, and optional token (3rd segment)
const QR_CODE_FORMAT_REGEX = /^etap:\/\/([^/]+)\/([^/]+?)(?:\/(.+))?$/;
const SCAN_AREA_SIZE = 250;
const ANIMATION_DURATION = 2000;

const FEATURE_INFO: Record<string, { icon: string; title: string; description: string; route: string; skipRoleCheck?: boolean }> = {
  app:           { icon: '📱', title: 'Accès Mobile ETAP',  description: 'Bienvenue sur votre espace ETAP mobile',             route: 'Accueil',      skipRoleCheck: true },
  notifications: { icon: '🔔', title: 'Notifications',      description: 'Accédez à vos alertes et notifications',            route: 'Notifications' },
  penalties:     { icon: '⚠️', title: 'Pénalités Retard',   description: 'Consultez et payez vos pénalités de retard',         route: 'Penalties'     },
  history:       { icon: '📜', title: 'Historique Actions',  description: 'Journal de toutes vos actions',                      route: 'History'       },
  chatbot:       { icon: '🤖', title: 'Assistant ETAP',      description: 'Posez vos questions à l\'assistant virtuel',         route: 'Assistant'     },
  commandes:     { icon: '📦', title: 'Commandes',           description: 'Gérez vos commandes',                                route: 'Accueil'       },
  factures:      { icon: '💳', title: 'Factures',            description: 'Consultez vos factures',                             route: 'Accueil'       },
  livraisons:    { icon: '🚚', title: 'Livraisons',          description: 'Suivez vos livraisons en temps réel',                route: 'Accueil'       },
  contrats:      { icon: '📋', title: 'Contrats',            description: 'Accédez à vos contrats',                             route: 'Accueil'       },
};

const normalizeRole = (role: string): UserRole => {
  const r = role.toLowerCase();
  const roles: UserRole[] = ['Admin', 'Commercial', 'Client', 'Transporteur', 'Fournisseur'];
  return roles.find(x => x.toLowerCase() === r) || 'Client';
};

// ========== COMPOSANT PRINCIPAL ==========
export default function QRScannerScreen({ navigation }: any) {
  const { login, user } = useAuth();
  const rootNav = useNavigation<any>();

  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning,  setIsScanning]  = useState(true);
  const [isLoading,   setIsLoading]   = useState(false);
  const [torchOn,     setTorchOn]     = useState(false);
  const [lastScanAt,  setLastScanAt]  = useState(0);
  const [result,      setResult]      = useState<ScanResult | null>(null);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const resultAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scanLoop = Animated.loop(Animated.sequence([
      Animated.timing(scanLineAnim, { toValue: 1, duration: ANIMATION_DURATION, useNativeDriver: true }),
      Animated.timing(scanLineAnim, { toValue: 0, duration: ANIMATION_DURATION, useNativeDriver: true }),
    ]));
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
    ]));
    scanLoop.start();
    pulse.start();
    return () => { scanLoop.stop(); pulse.stop(); };
  }, []);

  // Afficher le panneau résultat avec animation
  const showResult = useCallback((r: ScanResult) => {
    setResult(r);
    resultAnim.setValue(0);
    Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  }, [resultAnim]);

  const resetScanner = useCallback(() => {
    setResult(null);
    setIsScanning(true);
    setIsLoading(false);
  }, []);

  const safeGoBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  // ── Navigation vers l'écran de la feature (stack authentifié uniquement) ──
  const navigateToFeature = useCallback((route: string) => {
    safeGoBack();
  }, [safeGoBack]);

  // ── Traitement du QR scanné ──────────────────────────────────
  const handleBarCodeScanned = useCallback(async ({ data }: QRScanResult) => {
    const now = Date.now();
    if (now - lastScanAt < 1500 || !isScanning) return;
    setLastScanAt(now);
    setIsScanning(false);
    setIsLoading(true);
    Vibration.vibrate(200);

    try {
      const match = data.match(QR_CODE_FORMAT_REGEX);
      if (match) {
        const featureId = match[1];
        const role      = match[2];
        const info      = FEATURE_INFO[featureId];

        if (!info) {
          showResult({ type: 'error', icon: '❌', title: 'QR Code inconnu', subtitle: `Fonctionnalité inconnue: ${featureId}` });
          setIsLoading(false);
          return;
        }

        if (!user) {
          setIsLoading(false);
          safeGoBack();
          return;
        }

        if (!info.skipRoleCheck) {
          const requiredRole = normalizeRole(role);
          const userRole     = normalizeRole(user.role || '');
          if (requiredRole !== userRole && user.role !== 'Admin') {
            showResult({ type: 'error', icon: '🚫', title: 'Accès refusé', subtitle: `Réservé aux ${requiredRole}.` });
            setIsLoading(false);
            return;
          }
        }

        Vibration.vibrate([0, 100, 50, 100]);
        setIsLoading(false);
        setTimeout(() => safeGoBack(), 250);
        return;
      }

      // QR brut (JWT) → envoi au backend
      const response = await api.post('/auth/qr-login', { qrData: data });
      const { user: userData, token } = response.data;
      if (!userData || !token) throw new Error('Réponse invalide du serveur');

      Vibration.vibrate([0, 150, 100, 150]);

      if (user) {
        setIsLoading(false);
        setTimeout(() => safeGoBack(), 250);
        return;
      }

      await login(userData, token);
      setIsLoading(false);

    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors du scan';
      showResult({ type: 'error', icon: '❌', title: 'Erreur', subtitle: msg });
      setIsLoading(false);
    }
  }, [isScanning, lastScanAt, user, login, showResult, safeGoBack]);

  // ── Action du bouton principal du résultat ───────────────────
  const handleResultAction = useCallback(async () => {
    if (!result) return;
    if (result.type === 'feature' && result.route) {
      navigateToFeature(result.route);
    } else if (result.type === 'login' && result.userData && result.token) {
      await login(result.userData, result.token);
      // AppNavigator gère la redirection automatiquement
    } else {
      resetScanner();
    }
  }, [result, navigateToFeature, login, resetScanner]);

  const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SCAN_AREA_SIZE - 2] });

  // ── Permissions ──────────────────────────────────────────────
  if (!permission) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color="#1a3c5e" />
      </SafeAreaView>
    );
  }
  if (!permission.granted) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={s.center}>
          <Text style={s.bigIcon}>📷</Text>
          <Text style={s.errTitle}>Accès caméra refusé</Text>
          <Text style={s.errMsg}>L'application a besoin d'accès à votre caméra.</Text>
          <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
            <Text style={s.permBtnText}>Accorder l'accès</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.permBtn, { backgroundColor: '#555' }]} onPress={() => safeGoBack()}>
            <Text style={s.permBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <CameraView
        style={s.camera}
        facing="back"
        onBarcodeScanned={isScanning && !isLoading ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        enableTorch={torchOn}
      >
        {/* Overlay scan */}
        <View style={s.overlay}>
          <View style={s.topDark} />
          <View style={s.middle}>
            <View style={s.sideDark} />
            <View style={s.scanArea}>
              <Animated.View style={[s.frame, { transform: [{ scale: pulseAnim }] }]} />
              <Animated.View style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]} />
              <View style={[s.corner, s.tl]} /><View style={[s.corner, s.tr]} />
              <View style={[s.corner, s.bl]} /><View style={[s.corner, s.br]} />
              {!result && !isLoading && (
                <Text style={s.hint}>Pointez vers un QR code ETAP</Text>
              )}
            </View>
            <View style={s.sideDark} />
          </View>
          <View style={s.bottomDark}>
            <TouchableOpacity style={s.ctrlBtn} onPress={() => { setTorchOn(v => !v); Vibration.vibrate(50); }}>
              <Text style={s.ctrlIcon}>{torchOn ? '💡' : '🔅'}</Text>
              <Text style={s.ctrlLabel}>{torchOn ? 'Lampe On' : 'Lampe Off'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ctrlBtn} onPress={() => safeGoBack()}>
              <Text style={s.ctrlIcon}>✕</Text>
              <Text style={s.ctrlLabel}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={s.loadingText}>Traitement...</Text>
          </View>
        )}
      </CameraView>

      {/* ── Panneau résultat ─────────────────────────────────── */}
      {result && (
        <Animated.View style={[s.resultPanel, { transform: [{ translateY: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }]}>
          <View style={[s.resultIconWrap, result.type === 'error' ? s.iconError : result.type === 'login' ? s.iconLogin : s.iconFeature]}>
            <Text style={s.resultIcon}>{result.icon}</Text>
          </View>
          <Text style={s.resultTitle}>{result.title}</Text>
          <Text style={s.resultSubtitle}>{result.subtitle}</Text>

          <View style={s.resultActions}>
            {result.type === 'feature' && (
              <>
                <TouchableOpacity style={s.btnPrimary} onPress={handleResultAction}>
                  <Text style={s.btnPrimaryText}>→ Ouvrir {result.title}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnSecondary} onPress={resetScanner}>
                  <Text style={s.btnSecondaryText}>🔄 Scanner un autre QR</Text>
                </TouchableOpacity>
              </>
            )}
            {result.type === 'login' && (
              <>
                <TouchableOpacity style={s.btnPrimary} onPress={handleResultAction}>
                  <Text style={s.btnPrimaryText}>🚀 Se connecter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnSecondary} onPress={resetScanner}>
                  <Text style={s.btnSecondaryText}>🔄 Réessayer</Text>
                </TouchableOpacity>
              </>
            )}
            {result.type === 'error' && result.route === 'Login' && (
              <>
                <TouchableOpacity style={s.btnPrimary} onPress={() => safeGoBack()}>
                  <Text style={s.btnPrimaryText}>🏠 Retour</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnSecondary} onPress={resetScanner}>
                  <Text style={s.btnSecondaryText}>🔄 Réessayer</Text>
                </TouchableOpacity>
              </>
            )}
            {result.type === 'error' && result.route !== 'Login' && (
              <TouchableOpacity style={s.btnSecondary} onPress={resetScanner}>
                <Text style={s.btnSecondaryText}>🔄 Réessayer</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0a1428' },
  camera:     { flex: 1 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18, padding: 28 },
  bigIcon:    { fontSize: 72 },
  errTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.3 },
  errMsg:     { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 20 },
  permBtn:    { backgroundColor: '#1a3c5e', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, width: 230, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  permBtnText:{ color: '#fff', fontSize: 16, fontWeight: '700' },

  // Overlay
  overlay:    { flex: 1 },
  topDark:    { flex: 1.5, backgroundColor: 'rgba(10,20,40,0.72)' },
  middle:     { flexDirection: 'row', height: SCAN_AREA_SIZE },
  sideDark:   { flex: 1, backgroundColor: 'rgba(10,20,40,0.72)' },
  bottomDark: { flex: 1.5, backgroundColor: 'rgba(10,20,40,0.72)', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 20 },

  // Scan area
  scanArea:   { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE, alignItems: 'center', justifyContent: 'center' },
  frame:      { position: 'absolute', width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE, borderWidth: 1.5, borderColor: 'rgba(0,212,255,0.45)', borderRadius: 16 },
  scanLine:   { position: 'absolute', width: SCAN_AREA_SIZE - 20, height: 2, backgroundColor: '#00d4ff', shadowColor: '#00d4ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 8 },
  corner:     { position: 'absolute', width: 26, height: 26, borderColor: '#00d4ff', borderWidth: 3.5 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  hint:       { position: 'absolute', bottom: -44, color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', fontWeight: '500', letterSpacing: 0.2 },

  // Contrôles
  ctrlBtn:    { alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(26,60,94,0.9)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)' },
  ctrlIcon:   { fontSize: 24 },
  ctrlLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600', marginTop: 3, letterSpacing: 0.3 },

  // Loading
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,20,40,0.75)', justifyContent: 'center', alignItems: 'center' },
  loadingText:    { color: '#fff', marginTop: 14, fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },

  // Résultat
  resultPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 30, alignItems: 'center',
    elevation: 24,
    shadowColor: '#0a1428', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.25, shadowRadius: 18,
  },
  resultIconWrap: { width: 86, height: 86, borderRadius: 43, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  iconFeature:    { backgroundColor: '#eff6ff', borderWidth: 2, borderColor: '#dbeafe' },
  iconLogin:      { backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0' },
  iconError:      { backgroundColor: '#fef2f2', borderWidth: 2, borderColor: '#fecaca' },
  resultIcon:     { fontSize: 38 },
  resultTitle:    { fontSize: 22, fontWeight: '800', color: '#0d2b3e', marginBottom: 8, textAlign: 'center', letterSpacing: -0.3 },
  resultSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 26, lineHeight: 21 },

  resultActions:  { width: '100%', gap: 10 },
  btnPrimary:     { backgroundColor: '#1a3c5e', paddingVertical: 15, borderRadius: 14, alignItems: 'center', elevation: 2, shadowColor: '#1a3c5e', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  btnSecondary:   { backgroundColor: '#f0f5fb', paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#e4edf7' },
  btnSecondaryText: { color: '#1a3c5e', fontSize: 15, fontWeight: '700' },
});
