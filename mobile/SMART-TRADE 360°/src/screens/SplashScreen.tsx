import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,

  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// ========== TYPES ==========
interface SplashScreenProps {
  navigation: {
    replace: (screen: string) => void;
    dispatch?: (action: any) => void;
  };
}

interface AnimationConfig {
  duration: number;
  tension: number;
  friction: number;
  delay: number;
}

// ========== CONSTANTES ==========
const ANIMATION_CONFIGS: Record<string, AnimationConfig> = {
  entrance: {
    duration: 800,
    tension: 40,
    friction: 8,
    delay: 300
  },
  exit: {
    duration: 500,
    tension: 50,
    friction: 7,
    delay: 0
  }
};

const TIMING_CONSTANTS = {
  SPLASH_DURATION: 2500, // 2.5 secondes
  ANIMATION_TOTAL: 3200, // 3.2 secondes
  EXIT_DURATION: 500
} as const;

const COLORS = {
  PRIMARY: '#0a1428',
  WHITE: '#fff',
  ACCENT: '#00d4ff'
} as const;

// ========== UTILITAIRES ==========
const logDebug = (message: string, data?: any) => {
  if (__DEV__) {
    console.log(`[SplashScreen] ${message}`, data || '');
  }
};

// ========== COMPOSANT PRINCIPAL ==========
export default function SplashScreen({ navigation }: SplashScreenProps) {
  // ========== ANIMATIONS ==========
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // ========== REFS ==========
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // ========== CALLBACKS ==========
  const startEntranceAnimation = useCallback(() => {
    logDebug('Starting entrance animations');

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_CONFIGS.entrance.duration,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: ANIMATION_CONFIGS.entrance.tension,
        friction: ANIMATION_CONFIGS.entrance.friction
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: ANIMATION_CONFIGS.entrance.tension,
        friction: ANIMATION_CONFIGS.entrance.friction
      }),
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true
        })
      )
    ]).start();
  }, [fadeAnim, scaleAnim, translateYAnim, spinAnim]);

  const handleNavigation = useCallback(() => {
    if (!isMountedRef.current) {
      logDebug('Component unmounted, skipping navigation');
      return;
    }

    logDebug('Starting exit animation');

    // Animation de sortie
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: TIMING_CONSTANTS.EXIT_DURATION,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (!isMountedRef.current) {
        logDebug('Component unmounted during exit animation');
        return;
      }

      if (finished) {
        logDebug('Navigation to Login screen');
        try {
          navigation.replace('Login');
        } catch (error) {
          logDebug('Navigation error', error);
          // Fallback: Try alternative navigation method
          if (navigation.dispatch) {
            navigation.dispatch(
              // @ts-ignore
              navigation.dispatch({ type: 'RESET' })
            );
          }
        }
      }
    });
  }, [fadeAnim, navigation]);

  // ========== EFFETS ==========
  useEffect(() => {
    logDebug('SplashScreen mounted');

    // Vérifier que le composant est bien monté
    isMountedRef.current = true;

    // Démarrer les animations d'entrée immédiatement
    startEntranceAnimation();

    // Timer pour la redirection
    splashTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        handleNavigation();
      }
    }, TIMING_CONSTANTS.SPLASH_DURATION);

    return () => {
      logDebug('SplashScreen cleanup');
      isMountedRef.current = false;

      // Nettoyer les timers
      if (splashTimerRef.current) {
        clearTimeout(splashTimerRef.current);
        splashTimerRef.current = null;
      }

      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }

      // Arrêter les animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      translateYAnim.setValue(50);
      spinAnim.setValue(0);
    };
  }, [startEntranceAnimation, handleNavigation, fadeAnim, scaleAnim, translateYAnim, spinAnim]);

  // ========== RENDU ==========
  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.PRIMARY} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim }
            ]
          }
        ]}
      >
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={{
              transform: [{ rotate: spinInterpolate }]
            }}
          >
            <Text style={styles.logo}>🛢️</Text>
          </Animated.View>

          <Text style={styles.title}>ETAP</Text>
          <Text style={styles.subtitle}>Mobile</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Company Name */}
        <Text style={styles.companyName}>
          Entreprise Tunisienne d'Activités Pétrolières
        </Text>

        {/* Loading Indicator */}
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.WHITE}
            style={styles.loader}
          />
          <Text style={styles.loadingText}>Initialisation...</Text>
        </View>
      </Animated.View>

      {/* Version Badge */}
      <View style={styles.versionBadge}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center'
  },

  // ========== LOGO SECTION ==========
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  logo: {
    fontSize: 80,
    marginBottom: 10,
    textAlign: 'center'
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.WHITE,
    letterSpacing: 4,
    marginBottom: 4
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.ACCENT,
    fontWeight: '600',
    letterSpacing: 2
  },

  // ========== DIVIDER ==========
  divider: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.ACCENT,
    borderRadius: 2,
    marginVertical: 24,
    opacity: 0.7
  },

  // ========== COMPANY INFO ==========
  companyName: {
    fontSize: 13,
    color: COLORS.WHITE,
    opacity: 0.8,
    textAlign: 'center',
    maxWidth: width * 0.8,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 40
  },

  // ========== LOADER ==========
  loaderContainer: {
    alignItems: 'center',
    marginTop: 20
  },
  loader: {
    marginBottom: 12
  },
  loadingText: {
    fontSize: 11,
    color: COLORS.WHITE,
    opacity: 0.7,
    fontWeight: '500',
    letterSpacing: 0.5
  },

  // ========== VERSION BADGE ==========
  versionBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  versionText: {
    fontSize: 10,
    color: COLORS.WHITE,
    opacity: 0.6,
    fontWeight: '500'
  }
});