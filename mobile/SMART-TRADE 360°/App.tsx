import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { Text, View, ActivityIndicator, StyleSheet, Platform } from 'react-native';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import PenaltiesScreen from './src/screens/PenaltiesScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Accueil:       { active: '🏠',  inactive: '🏠'  },
  Notifications: { active: '🔔',  inactive: '🔔'  },
  Assistant:     { active: '🤖',  inactive: '🤖'  },
  Penalties:     { active: '⚠️',  inactive: '⚠️'  },
  History:       { active: '📜',  inactive: '📜'  },
  Profil:        { active: '👤',  inactive: '👤'  },
};

function MainTabs() {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;
          return (
            <Text style={{ fontSize: focused ? size + 2 : size, opacity: focused ? 1 : 0.6 }}>
              {focused ? icons.active : icons.inactive}
            </Text>
          );
        },
        tabBarActiveTintColor:   '#1a3c5e',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 10,
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          elevation: 24,
          shadowColor: '#0d2b3e',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
          letterSpacing: 0.3,
        },
        tabBarItemStyle: { paddingVertical: 6 },
        tabBarHideOnKeyboard: true,
      })}
    >
      {/* ── Accueil — tous ── */}
      <Tab.Screen name="Accueil" component={HomeScreen} />

      {/* ── Notifications — tous ── */}
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarBadgeStyle: { backgroundColor: '#ef4444' } }}
      />

      {/* ── Assistant (Chatbot) — tous ── */}
      <Tab.Screen name="Assistant" component={ChatbotScreen} />

      {/* ── Pénalités — tous les rôles ── */}
      <Tab.Screen
        name="Penalties"
        component={PenaltiesScreen}
        options={{ tabBarLabel: 'Pénalités' }}
      />

      {/* ── Historique — tous ── */}
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: 'Historique' }}
      />

      {/* ── Profil — tous ── */}
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#1a3c5e" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Splash"         component={SplashScreen} />
          <Stack.Screen name="Login"          component={LoginScreen} />
          <Stack.Screen name="QRScannerLogin" component={QRScannerScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main"      component={MainTabs} />
          <Stack.Screen name="Penalties" component={PenaltiesScreen} />
          <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f5fb',
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
