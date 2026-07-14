import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(50)).current;
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start(() => {
      // Pulse continu sur le bouton QR
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const handleQRScan = () => navigation.navigate('QRScannerLogin');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1428" />

      {/* ── HERO SECTION ── */}
      <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>🛢️</Text>
        </View>
        <Text style={styles.appName}>SMART-TRADE 360°</Text>
        <Text style={styles.tagline}>Entreprise Tunisienne d'Activités Pétrolières</Text>
      </Animated.View>

      {/* ── BOTTOM SHEET ── */}
      <Animated.View style={[styles.sheet, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionIcon}>💡</Text>
          <View style={styles.instructionText}>
            <Text style={styles.instructionTitle}>Comment se connecter ?</Text>
            <Text style={styles.instructionDesc}>
              Connectez-vous sur le portail web SMART-TRADE 360° , allez dans votre{' '}
              <Text style={styles.instructionBold}>Profil</Text>, puis scannez
              le QR code affiché.
            </Text>
          </View>
        </View>

        {/* Étapes */}
        <View style={styles.steps}>
          {[
            { num: '1', text: 'Ouvrez le portail SMART-TRADE 360° sur votre ordinateur' },
            { num: '2', text: 'Accédez à votre Profil utilisateur' },
            { num: '3', text: 'Cliquez sur "Accès Mobile" pour afficher le QR' },
            { num: '4', text: 'Scannez le QR code ci-dessous' },
          ].map((step) => (
            <View key={step.num} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.num}</Text>
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Bouton QR principal */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity style={styles.qrBtn} onPress={handleQRScan} activeOpacity={0.88}>
            <View style={styles.qrBtnInner}>
              <Text style={styles.qrBtnIcon}>📷</Text>
              <View>
                <Text style={styles.qrBtnTitle}>Scanner le QR Code</Text>
                <Text style={styles.qrBtnSub}>Ouvrir la caméra pour se connecter</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Rôles supportés */}
        

        <Text style={styles.footer}>v2.0.0 · © 2026 SMART-TRADE 360° </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1428',
  },

  // ── HERO ──
  hero: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(0,212,255,0.3)',
  },
  logoEmoji: { fontSize: 48 },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: width * 0.75,
  },

  // ── SHEET ──
  sheet: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 20,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },

  // ── INSTRUCTION CARD ──
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 12,
  },
  instructionIcon: { fontSize: 22 },
  instructionText: { flex: 1 },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0d2b3e',
    marginBottom: 4,
  },
  instructionDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  instructionBold: { fontWeight: '700', color: '#1a3c5e' },

  // ── STEPS ──
  steps: { gap: 12, marginBottom: 26 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0d2b3e',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  stepText: { fontSize: 13, color: '#334155', flex: 1, lineHeight: 19 },

  // ── QR BUTTON ──
  qrBtn: {
    backgroundColor: '#0d2b3e',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#0d2b3e',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  qrBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  qrBtnIcon: { fontSize: 36 },
  qrBtnTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  qrBtnSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  // ── ROLES ──
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 18,
  },
  roleChip: {
    backgroundColor: '#f0f5fb',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e4edf7',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a3c5e',
  },

  // ── FOOTER ──
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
  },
});
