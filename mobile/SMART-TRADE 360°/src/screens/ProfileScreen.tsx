import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Switch,
  ActivityIndicator,

  StatusBar
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGES, LangCode } from '../utils/translations';
import LoadingSpinner from '../components/LoadingSpinner';
import QRCodeModal from '../components/QRCodeModal';

// ========== TYPES ==========
type UserRole = 'Admin' | 'Commercial' | 'Client' | 'Transporteur' | 'Fournisseur';

interface FormData {
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  estimatedDays: number;
  userStory: string;
}

interface FeaturesMap {
  [key: string]: Feature[];
}

// ========== CONSTANTES ==========
const ROLES: UserRole[] = ['Admin', 'Commercial', 'Client', 'Transporteur', 'Fournisseur'];

const FEATURES_BY_ROLE: FeaturesMap = {
  Admin: [
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Notifications Auto',
      description: 'Système d\'alertes automatiques pour les événements critiques',
      estimatedDays: 2,
      userStory: 'En tant que système, je veux envoyer des alertes'
    },
    {
      id: 'penalties',
      icon: '⚠️',
      title: 'Pénalités Retard',
      description: 'Calcul automatique des pénalités de retard de livraison',
      estimatedDays: 1,
      userStory: 'En tant que système, je veux calculer les pénalités'
    },
    {
      id: 'history',
      icon: '📜',
      title: 'Historique Actions',
      description: 'Journal complet de toutes les actions système',
      estimatedDays: 2,
      userStory: 'En tant qu\'Admin, je veux voir toutes les actions'
    },
    {
      id: 'chatbot',
      icon: '🤖',
      title: 'Chatbot Assistant',
      description: 'Assistant virtuel pour l\'aide utilisateur',
      estimatedDays: 3,
      userStory: 'En tant qu\'utilisateur, je veux être aidé'
    }
  ],
  Commercial: [
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Notifications Commerciales',
      description: 'Alertes sur les nouveaux contrats et commandes',
      estimatedDays: 2,
      userStory: 'En tant que commercial, je veux recevoir des alertes'
    },
    {
      id: 'chatbot',
      icon: '🤖',
      title: 'Assistant Commercial',
      description: 'Aide pour la gestion des contrats',
      estimatedDays: 3,
      userStory: 'En tant que commercial, je veux être aidé'
    }
  ],
  Client: [
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Notifications Livraisons',
      description: 'Alertes en temps réel sur vos livraisons',
      estimatedDays: 2,
      userStory: 'En tant que client, je veux recevoir des alertes'
    },
    {
      id: 'chatbot',
      icon: '🤖',
      title: 'Support Client',
      description: 'Assistant virtuel pour vos questions',
      estimatedDays: 3,
      userStory: 'En tant que client, je veux être aidé'
    }
  ],
  Transporteur: [
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Alertes Livraison',
      description: 'Notifications des nouvelles livraisons assignées',
      estimatedDays: 2,
      userStory: 'En tant que transporteur, je veux recevoir des alertes'
    },
    {
      id: 'chatbot',
      icon: '🤖',
      title: 'Assistant Logistique',
      description: 'Aide pour les itinéraires',
      estimatedDays: 3,
      userStory: 'En tant que transporteur, je veux être aidé'
    }
  ],
  Fournisseur: [
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Alertes Commandes',
      description: 'Notifications sur les nouvelles commandes reçues',
      estimatedDays: 2,
      userStory: 'En tant que fournisseur, je veux recevoir des alertes'
    },
    {
      id: 'chatbot',
      icon: '🤖',
      title: 'Support Fournisseur',
      description: 'Assistant pour les commandes',
      estimatedDays: 3,
      userStory: 'En tant que fournisseur, je veux être aidé'
    }
  ]
};

// ========== UTILITAIRES ==========
const getUserProperty = (
  user: any | null,
  property: string,
  defaultValue: string = ''
): string => {
  if (!user) return defaultValue;

  const propertyMap: Record<string, string[]> = {
    nom: ['nom', 'name', 'fullName', 'pseudo'],
    email: ['email', 'mail'],
    telephone: ['telephone', 'phone', 'mobile', 'tel'],
    adresse: ['adresse', 'address', 'location']
  };

  const possibleKeys = propertyMap[property] || [property];

  for (const key of possibleKeys) {
    const value = user[key];
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return defaultValue;
};

const isValidRole = (role: any): role is UserRole => {
  return ROLES.includes(role);
};

const getValidRole = (role: any): UserRole => {
  if (isValidRole(role)) {
    return role;
  }
  return 'Client';
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  return phone.length >= 8;
};

// ========== COMPOSANT PRINCIPAL ==========
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { lang, setLanguage, tr } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrModal, setQrModal] = useState<Feature | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});

  const [formData, setFormData] = useState<FormData>({
    nom: getUserProperty(user, 'nom'),
    email: getUserProperty(user, 'email'),
    telephone: getUserProperty(user, 'telephone'),
    adresse: getUserProperty(user, 'adresse')
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    setFormData({
      nom: getUserProperty(user, 'nom'),
      email: getUserProperty(user, 'email'),
      telephone: getUserProperty(user, 'telephone'),
      adresse: getUserProperty(user, 'adresse')
    });
  }, [user]);

  useEffect(() => {
    if (saved) {
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start(() => setSaved(false));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [saved]);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<FormData> = {};

    if (!formData.nom.trim()) {
      errors.nom = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Email invalide';
    }

    if (formData.telephone && !validatePhone(formData.telephone)) {
      errors.telephone = 'Le téléphone doit avoir au moins 8 chiffres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Erreur', 'Veuillez corriger les erreurs du formulaire');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm]);

  const handleCancel = useCallback(() => {
    setFormData({
      nom: getUserProperty(user, 'nom'),
      email: getUserProperty(user, 'email'),
      telephone: getUserProperty(user, 'telephone'),
      adresse: getUserProperty(user, 'adresse')
    });
    setFormErrors({});
    setIsEditing(false);
  }, [user]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          onPress: logout,
          style: 'destructive'
        }
      ]
    );
  }, [logout]);

  const handleChangePassword = useCallback(() => {
    Alert.alert(
      'Changer le mot de passe',
      'Redirection vers la page de changement de mot de passe...',
      [{ text: 'OK' }]
    );
  }, []);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [formErrors]);

  const displayName = useMemo(
    () => formData.nom || getUserProperty(user, 'nom') || 'Utilisateur',
    [formData.nom, user]
  );

  const displayEmail = useMemo(
    () => formData.email || getUserProperty(user, 'email') || '—',
    [formData.email, user]
  );

  const userRole = useMemo(
    () => getValidRole(user?.role),
    [user?.role]
  );

  const features = useMemo(
    () => FEATURES_BY_ROLE[userRole] || [],
    [userRole]
  );

  const avatarLetter = useMemo(
    () => displayName.charAt(0)?.toUpperCase() || 'U',
    [displayName]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LoadingSpinner visible={loading} />

        {saved && (
          <Animated.View
            style={[
              styles.toast,
              { opacity: toastAnim }
            ]}
          >
            <Text style={styles.toastText}>✅ Profil mis à jour avec succès</Text>
          </Animated.View>
        )}

        {qrModal && (
          <QRCodeModal
            visible={!!qrModal}
            onClose={() => setQrModal(null)}
            feature={qrModal}
            role={userRole}
          />
        )}

        <ProfileHeader
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          displayName={displayName}
          displayEmail={displayEmail}
          avatarLetter={avatarLetter}
          userRole={userRole}
        />

        <ProfileInfoCard
          isEditing={isEditing}
          formData={formData}
          formErrors={formErrors}
          onInputChange={handleInputChange}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={handleCancel}
          fadeAnim={fadeAnim}
          loading={loading}
        />

        {features.length > 0 && (
          <AdvancedFeaturesCard
            features={features}
            onQRPress={setQrModal}
            fadeAnim={fadeAnim}
          />
        )}

        <LanguageCard
          currentLang={lang}
          onSelectLang={setLanguage}
          fadeAnim={fadeAnim}
          label={tr('language')}
        />

        <SecurityCard
          notificationsEnabled={notificationsEnabled}
          onNotificationsChange={setNotificationsEnabled}
          onChangePassword={handleChangePassword}
          onLogout={handleLogout}
          fadeAnim={fadeAnim}
        />

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 2.0.0</Text>
          <Text style={styles.copyrightText}>© 2026 ETAP - Tous droits réservés</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== SOUS-COMPOSANTS ==========
interface ProfileHeaderProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  displayName: string;
  displayEmail: string;
  avatarLetter: string;
  userRole: UserRole;
}

const ProfileHeader = React.memo(({
  fadeAnim,
  slideAnim,
  displayName,
  displayEmail,
  avatarLetter,
  userRole
}: ProfileHeaderProps) => (
  <Animated.View
    style={[
      styles.header,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
    ]}
  >
    <View style={styles.avatarContainer}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarLetter}</Text>
      </View>
      <View style={styles.roleBadge}>
        <Text style={styles.roleBadgeText}>{userRole}</Text>
      </View>
    </View>
    <Text style={styles.userName}>{displayName}</Text>
    <Text style={styles.userEmail}>{displayEmail}</Text>
  </Animated.View>
));

interface ProfileInfoCardProps {
  isEditing: boolean;
  formData: FormData;
  formErrors: Partial<FormData>;
  onInputChange: (field: keyof FormData, value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  fadeAnim: Animated.Value;
  loading: boolean;
}

const ProfileInfoCard = React.memo(({
  isEditing,
  formData,
  formErrors,
  onInputChange,
  onEdit,
  onSave,
  onCancel,
  fadeAnim,
  loading
}: ProfileInfoCardProps) => (
  <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>👤 Informations personnelles</Text>
      {!isEditing ? (
        <TouchableOpacity onPress={onEdit}>
          <Text style={styles.editButton}>✏️ Modifier</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.editActions}>
          <TouchableOpacity onPress={onSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#4caf50" />
            ) : (
              <Text style={styles.saveButton}>💾 Enregistrer</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} disabled={loading}>
            <Text style={styles.cancelButton}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>

    <View style={styles.cardBody}>
      {isEditing ? (
        <EditForm
          formData={formData}
          formErrors={formErrors}
          onInputChange={onInputChange}
        />
      ) : (
        <ViewInfo formData={formData} />
      )}
    </View>
  </Animated.View>
));

interface EditFormProps {
  formData: FormData;
  formErrors: Partial<FormData>;
  onInputChange: (field: keyof FormData, value: string) => void;
}

const EditForm = React.memo(({
  formData,
  formErrors,
  onInputChange
}: EditFormProps) => (
  <>
    <FormField
      label="Nom complet"
      placeholder="Votre nom complet"
      value={formData.nom}
      onChangeText={(text) => onInputChange('nom', text)}
      error={formErrors.nom}
    />
    <FormField
      label="Email"
      placeholder="email@exemple.com"
      value={formData.email}
      onChangeText={(text) => onInputChange('email', text)}
      keyboardType="email-address"
      autoCapitalize="none"
      error={formErrors.email}
    />
    <FormField
      label="Téléphone"
      placeholder="+216 XX XXX XXX"
      value={formData.telephone}
      onChangeText={(text) => onInputChange('telephone', text)}
      keyboardType="phone-pad"
      error={formErrors.telephone}
    />
    <FormField
      label="Adresse"
      placeholder="Votre adresse"
      value={formData.adresse}
      onChangeText={(text) => onInputChange('adresse', text)}
      multiline
      numberOfLines={2}
    />
  </>
));

interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
}

const FormField = React.memo(({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1
}: FormFieldProps) => {
  // ✅ FIX: Créer l'objet style de manière type-safe
  const inputErrorStyle = error ? styles.inputError : {};
  
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          inputErrorStyle
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

interface ViewInfoProps {
  formData: FormData;
}

const ViewInfo = React.memo(({ formData }: ViewInfoProps) => (
  <>
    <InfoRow icon="👤" label="Nom complet" value={formData.nom} />
    <InfoRow icon="✉️" label="Email" value={formData.email} />
    <InfoRow icon="📞" label="Téléphone" value={formData.telephone || 'Non renseigné'} />
    <InfoRow icon="📍" label="Adresse" value={formData.adresse || 'Non renseignée'} />
  </>
));

interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
}

const InfoRow = React.memo(({ icon, label, value }: InfoRowProps) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
));

interface AdvancedFeatureCardProps {
  features: Feature[];
  onQRPress: (feature: Feature) => void;
  fadeAnim: Animated.Value;
}

const AdvancedFeaturesCard = React.memo(({
  features,
  onQRPress,
  fadeAnim
}: AdvancedFeatureCardProps) => (
  <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>🚀 Fonctionnalités avancées</Text>
      <View style={styles.devBadge}>
        <Text style={styles.devBadgeText}>En développement</Text>
      </View>
    </View>
    <View style={styles.cardBody}>
      {features.map((feature, index) => (
        <FeatureItem
          key={feature.id}
          feature={feature}
          isLast={index === features.length - 1}
          onQRPress={() => onQRPress(feature)}
        />
      ))}
    </View>
  </Animated.View>
));

interface FeatureItemProps {
  feature: Feature;
  isLast: boolean;
  onQRPress: () => void;
}

const FeatureItem = React.memo(({
  feature,
  isLast,
  onQRPress
}: FeatureItemProps) => (
  <View style={[styles.featureItem, isLast && styles.lastFeatureItem]}>
    <View style={styles.featureHeader}>
      <Text style={styles.featureIcon}>{feature.icon}</Text>
      <View style={styles.featureInfo}>
        <Text style={styles.featureTitle}>{feature.title}</Text>
        <Text style={styles.featureDesc}>{feature.description}</Text>
        <Text style={styles.featureEstimation}>
          ⏱️ {feature.estimatedDays} jour{feature.estimatedDays > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
    <View style={styles.featureFooter}>
      <Text style={styles.userStory}>📋 {feature.userStory}</Text>
      <TouchableOpacity style={styles.qrButton} onPress={onQRPress}>
        <Text style={styles.qrButtonText}>📱 QR Code</Text>
      </TouchableOpacity>
    </View>
  </View>
));

interface SecurityCardProps {
  notificationsEnabled: boolean;
  onNotificationsChange: (value: boolean) => void;
  onChangePassword: () => void;
  onLogout: () => void;
  fadeAnim: Animated.Value;
}

const SecurityCard = React.memo(({
  notificationsEnabled,
  onNotificationsChange,
  onChangePassword,
  onLogout,
  fadeAnim
}: SecurityCardProps) => (
  <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>🛡️ Sécurité</Text>
    </View>
    <View style={styles.cardBody}>
      <SecurityItem
        icon="🔔"
        title="Notifications push"
        subtitle="Recevoir les alertes en temps réel"
        action={
          <Switch
            value={notificationsEnabled}
            onValueChange={onNotificationsChange}
            trackColor={{ false: '#ccc', true: '#1a3c5e' }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        }
      />
      <SecurityItem
        icon="🔑"
        title="Mot de passe"
        subtitle="Modifier votre mot de passe"
        action={
          <TouchableOpacity style={styles.securityButton} onPress={onChangePassword}>
            <Text style={styles.securityButtonText}>Modifier</Text>
          </TouchableOpacity>
        }
      />
      <SecurityItem
        icon="📱"
        title="Session active"
        subtitle="Gérer vos sessions"
        action={
          <TouchableOpacity style={styles.securityButton}>
            <Text style={styles.securityButtonText}>Voir</Text>
          </TouchableOpacity>
        }
      />
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  </Animated.View>
));

interface SecurityItemProps {
  icon: string;
  title: string;
  subtitle: string;
  action: React.ReactNode;
}

const SecurityItem = React.memo(({
  icon,
  title,
  subtitle,
  action
}: SecurityItemProps) => (
  <View style={styles.securityItem}>
    <View style={styles.securityLeft}>
      <Text style={styles.securityIcon}>{icon}</Text>
      <View>
        <Text style={styles.securityTitle}>{title}</Text>
        <Text style={styles.securitySub}>{subtitle}</Text>
      </View>
    </View>
    {action}
  </View>
));

// ========== LANGUAGE CARD ==========
interface LanguageCardProps {
  currentLang: LangCode;
  onSelectLang: (code: LangCode) => Promise<void>;
  fadeAnim: Animated.Value;
  label: string;
}

const LanguageCard = React.memo(({ currentLang, onSelectLang, fadeAnim, label }: LanguageCardProps) => (
  <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>🌐 {label}</Text>
    </View>
    <View style={[styles.cardBody, styles.langRow]}>
      {LANGUAGES.map((l) => {
        const active = l.code === currentLang;
        return (
          <TouchableOpacity
            key={l.code}
            style={[styles.langBtn, active && styles.langBtnActive]}
            onPress={() => onSelectLang(l.code)}
            activeOpacity={0.75}
          >
            <Text style={styles.langFlag}>{l.flag}</Text>
            <Text style={[styles.langLabel, active && styles.langLabelActive]}>{l.label}</Text>
            {active && <Text style={styles.langCheck}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  </Animated.View>
));

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5fb' },

  toast: {
    position: 'absolute',
    top: 70, left: 20, right: 20,
    backgroundColor: '#10b981',
    padding: 14, borderRadius: 12,
    zIndex: 1000, elevation: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8
  },
  toastText: { color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 14 },

  // ── HEADER ──
  header: {
    backgroundColor: '#0d2b3e',
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 10,
    shadowColor: '#0d2b3e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32, shadowRadius: 14
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.28)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22, shadowRadius: 6
  },
  avatarText: { fontSize: 38, fontWeight: '800', color: '#0d2b3e' },
  roleBadge: {
    position: 'absolute', bottom: -4, right: -14,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, elevation: 3,
    borderWidth: 2, borderColor: '#0d2b3e'
  },
  roleBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  userName: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 6, letterSpacing: -0.3 },
  userEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },

  // ── CARDS ──
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#1a3c5e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8,
    borderWidth: 1, borderColor: '#e4edf7',
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f5fb'
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0d2b3e' },
  editButton: { color: '#1a3c5e', fontSize: 14, fontWeight: '600' },
  editActions: { flexDirection: 'row', gap: 14 },
  saveButton: { color: '#10b981', fontSize: 14, fontWeight: '700' },
  cancelButton: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  cardBody: { padding: 16 },

  // ── FORM ──
  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: '#1a3c5e',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6
  },
  input: {
    backgroundColor: '#f8fafc', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, borderWidth: 1.5, borderColor: '#e2e8f0', color: '#0d1b2a'
  },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 5, fontWeight: '500' },

  // ── INFO ──
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f0f5fb'
  },
  infoIcon: { fontSize: 22, marginRight: 14, width: 36 },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 11, color: '#94a3b8', marginBottom: 2,
    fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.4
  },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#0d2b3e' },

  // ── FEATURES ──
  devBadge: { backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  devBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  featureItem: {
    marginBottom: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f5fb'
  },
  lastFeatureItem: { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
  featureHeader: { flexDirection: 'row', marginBottom: 10 },
  featureIcon: { fontSize: 30, marginRight: 12 },
  featureInfo: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#0d2b3e' },
  featureDesc: { fontSize: 13, color: '#5a7080', marginTop: 2, lineHeight: 18 },
  featureEstimation: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  featureFooter: { marginLeft: 42 },
  userStory: { fontSize: 11, color: '#7a90a4', fontStyle: 'italic', marginBottom: 10, lineHeight: 16 },
  qrButton: {
    backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#bfdbfe'
  },
  qrButtonText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },

  // ── SECURITY ──
  securityItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f5fb'
  },
  securityLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  securityIcon: { fontSize: 22, marginRight: 14, width: 36 },
  securityTitle: { fontSize: 14, fontWeight: '700', color: '#0d2b3e' },
  securitySub: { fontSize: 12, color: '#7a90a4', marginTop: 2 },
  securityButton: {
    backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe'
  },
  securityButtonText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  logoutButton: {
    backgroundColor: '#ef4444', padding: 14, borderRadius: 12,
    alignItems: 'center', marginTop: 12,
    elevation: 4, shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 8
  },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // ── LANGUAGE ──
  langRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  langBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc', gap: 4,
  },
  langBtnActive: {
    borderColor: '#1a3c5e', backgroundColor: '#eff6ff',
  },
  langFlag:  { fontSize: 24 },
  langLabel: { fontSize: 12, fontWeight: '600', color: '#5a7080', textAlign: 'center' },
  langLabelActive: { color: '#1a3c5e', fontWeight: '800' },
  langCheck: { fontSize: 11, color: '#1a3c5e', fontWeight: '800' },

  // ── FOOTER ──
  footer: { alignItems: 'center', paddingVertical: 24, marginBottom: 12 },
  versionText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  copyrightText: { fontSize: 11, color: '#b8c9d8', marginTop: 4 }
});