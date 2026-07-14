export type LangCode = 'fr' | 'en' | 'ar';

export const LANGUAGES: { code: LangCode; label: string; flag: string; rtl: boolean }[] = [
  { code: 'fr', label: 'Français',  flag: '🇫🇷', rtl: false },
  { code: 'en', label: 'English',   flag: '🇬🇧', rtl: false },
  { code: 'ar', label: 'العربية',   flag: '🇹🇳', rtl: true  },
];

const t = {
  fr: {
    // Navigation tabs
    home:          'Accueil',
    notifications: 'Notifications',
    assistant:     'Assistant',
    penalties:     'Pénalités',
    history:       'Historique',
    profile:       'Profil',

    // Common actions
    save:    'Enregistrer',
    cancel:  'Annuler',
    edit:    'Modifier',
    confirm: 'Confirmer',
    close:   'Fermer',
    retry:   'Réessayer',
    back:    'Retour',
    yes:     'Oui',
    no:      'Non',

    // Auth / Login
    scanQR:        'Scanner le QR Code',
    scanQRSub:     'Ouvrir la caméra pour se connecter',
    howToLogin:    'Comment se connecter ?',
    loginStep1:    'Ouvrez le portail SMART-TRADE 360° sur votre ordinateur',
    loginStep2:    'Accédez à votre Profil utilisateur',
    loginStep3:    'Cliquez sur "Accès Mobile" pour afficher le QR',
    loginStep4:    'Scannez le QR code ci-dessous',
    loginInstDesc: 'Connectez-vous sur le portail web SMART-TRADE 360°, allez dans votre Profil, puis scannez le QR code affiché.',

    // Profile
    personalInfo:  'Informations personnelles',
    fullName:      'Nom complet',
    email:         'Email',
    phone:         'Téléphone',
    address:       'Adresse',
    notFilled:     'Non renseigné',
    notFilledF:    'Non renseignée',
    profileUpdated:'✅ Profil mis à jour avec succès',

    // Language
    language:         'Langue',
    chooseLanguage:   'Choisir la langue',
    restartRequired:  'Redémarrage requis',
    restartMsg:       "Le changement de direction (RTL) sera appliqué au prochain démarrage de l'application.",

    // Security
    security:         'Sécurité',
    pushNotifs:       'Notifications push',
    pushNotifsDesc:   'Recevoir les alertes en temps réel',
    password:         'Mot de passe',
    passwordDesc:     'Modifier votre mot de passe',
    activeSession:    'Session active',
    sessionDesc:      'Gérer vos sessions',
    changePassword:   'Modifier',
    view:             'Voir',
    logout:           'Se déconnecter',
    logoutTitle:      'Déconnexion',
    logoutConfirm:    'Êtes-vous sûr de vouloir vous déconnecter ?',
    logoutAction:     'Déconnecter',

    // Home
    welcome:      'Bienvenue',
    goodMorning:  'Bonjour',
    goodAfternoon:'Bon après-midi',
    goodEvening:  'Bonsoir',

    // Notifications
    noNotifications: 'Aucune notification',
    markAllRead:     'Tout marquer comme lu',

    // Penalties
    noPenalties: 'Aucune pénalité',
    pay:         'Payer',
    paid:        'Payée',
    pending:     'En attente',

    // History
    noHistory: 'Aucun historique',

    // Chatbot
    typeMessage:  'Tapez un message...',
    send:         'Envoyer',
    chatWelcome:  'Bonjour ! Comment puis-je vous aider ?',

    // Errors
    networkError: 'Erreur réseau',
    serverError:  'Erreur serveur',
    formError:    'Veuillez corriger les erreurs du formulaire',
    nameRequired: 'Le nom est requis',
    emailRequired:'L\'email est requis',
    emailInvalid: 'Email invalide',
    phoneMin:     'Le téléphone doit avoir au moins 8 chiffres',
  },

  en: {
    home:          'Home',
    notifications: 'Notifications',
    assistant:     'Assistant',
    penalties:     'Penalties',
    history:       'History',
    profile:       'Profile',

    save:    'Save',
    cancel:  'Cancel',
    edit:    'Edit',
    confirm: 'Confirm',
    close:   'Close',
    retry:   'Retry',
    back:    'Back',
    yes:     'Yes',
    no:      'No',

    scanQR:        'Scan QR Code',
    scanQRSub:     'Open camera to sign in',
    howToLogin:    'How to sign in?',
    loginStep1:    'Open the SMART-TRADE 360° portal on your computer',
    loginStep2:    'Go to your user Profile',
    loginStep3:    'Click "Mobile Access" to display the QR',
    loginStep4:    'Scan the QR code below',
    loginInstDesc: 'Sign in to the SMART-TRADE 360° web portal, go to your Profile, then scan the displayed QR code.',

    personalInfo:  'Personal information',
    fullName:      'Full name',
    email:         'Email',
    phone:         'Phone',
    address:       'Address',
    notFilled:     'Not provided',
    notFilledF:    'Not provided',
    profileUpdated:'✅ Profile updated successfully',

    language:        'Language',
    chooseLanguage:  'Choose language',
    restartRequired: 'Restart required',
    restartMsg:      'The layout direction change (RTL) will apply on the next app start.',

    security:       'Security',
    pushNotifs:     'Push notifications',
    pushNotifsDesc: 'Receive real-time alerts',
    password:       'Password',
    passwordDesc:   'Change your password',
    activeSession:  'Active session',
    sessionDesc:    'Manage your sessions',
    changePassword: 'Change',
    view:           'View',
    logout:         'Sign out',
    logoutTitle:    'Sign out',
    logoutConfirm:  'Are you sure you want to sign out?',
    logoutAction:   'Sign out',

    welcome:      'Welcome',
    goodMorning:  'Good morning',
    goodAfternoon:'Good afternoon',
    goodEvening:  'Good evening',

    noNotifications: 'No notifications',
    markAllRead:     'Mark all as read',

    noPenalties: 'No penalties',
    pay:         'Pay',
    paid:        'Paid',
    pending:     'Pending',

    noHistory: 'No history',

    typeMessage: 'Type a message...',
    send:        'Send',
    chatWelcome: 'Hello! How can I help you?',

    networkError: 'Network error',
    serverError:  'Server error',
    formError:    'Please correct the form errors',
    nameRequired: 'Name is required',
    emailRequired:'Email is required',
    emailInvalid: 'Invalid email',
    phoneMin:     'Phone must have at least 8 digits',
  },

  ar: {
    home:          'الرئيسية',
    notifications: 'الإشعارات',
    assistant:     'المساعد',
    penalties:     'الغرامات',
    history:       'السجل',
    profile:       'الملف الشخصي',

    save:    'حفظ',
    cancel:  'إلغاء',
    edit:    'تعديل',
    confirm: 'تأكيد',
    close:   'إغلاق',
    retry:   'إعادة المحاولة',
    back:    'رجوع',
    yes:     'نعم',
    no:      'لا',

    scanQR:        'مسح رمز QR',
    scanQRSub:     'افتح الكاميرا لتسجيل الدخول',
    howToLogin:    'كيفية تسجيل الدخول؟',
    loginStep1:    'افتح بوابة SMART-TRADE 360° على حاسوبك',
    loginStep2:    'انتقل إلى ملفك الشخصي',
    loginStep3:    'انقر على "الوصول عبر الجوال" لعرض رمز QR',
    loginStep4:    'امسح رمز QR أدناه',
    loginInstDesc: 'سجّل الدخول إلى بوابة SMART-TRADE 360°، انتقل إلى ملفك الشخصي، ثم امسح رمز QR المعروض.',

    personalInfo:  'المعلومات الشخصية',
    fullName:      'الاسم الكامل',
    email:         'البريد الإلكتروني',
    phone:         'الهاتف',
    address:       'العنوان',
    notFilled:     'غير محدد',
    notFilledF:    'غير محددة',
    profileUpdated:'✅ تم تحديث الملف الشخصي بنجاح',

    language:        'اللغة',
    chooseLanguage:  'اختر اللغة',
    restartRequired: 'إعادة التشغيل مطلوبة',
    restartMsg:      'سيتم تطبيق تغيير اتجاه النص (RTL) عند بدء التطبيق التالي.',

    security:       'الأمان',
    pushNotifs:     'الإشعارات الفورية',
    pushNotifsDesc: 'استلام التنبيهات في الوقت الفعلي',
    password:       'كلمة المرور',
    passwordDesc:   'تغيير كلمة المرور',
    activeSession:  'الجلسة النشطة',
    sessionDesc:    'إدارة جلساتك',
    changePassword: 'تغيير',
    view:           'عرض',
    logout:         'تسجيل الخروج',
    logoutTitle:    'تسجيل الخروج',
    logoutConfirm:  'هل أنت متأكد أنك تريد تسجيل الخروج؟',
    logoutAction:   'خروج',

    welcome:      'مرحباً',
    goodMorning:  'صباح الخير',
    goodAfternoon:'مساء الخير',
    goodEvening:  'مساء الخير',

    noNotifications: 'لا توجد إشعارات',
    markAllRead:     'تحديد الكل كمقروء',

    noPenalties: 'لا توجد غرامات',
    pay:         'دفع',
    paid:        'مدفوعة',
    pending:     'قيد الانتظار',

    noHistory: 'لا يوجد سجل',

    typeMessage: 'اكتب رسالة...',
    send:        'إرسال',
    chatWelcome: 'مرحباً! كيف يمكنني مساعدتك؟',

    networkError: 'خطأ في الشبكة',
    serverError:  'خطأ في الخادم',
    formError:    'يرجى تصحيح أخطاء النموذج',
    nameRequired: 'الاسم مطلوب',
    emailRequired:'البريد الإلكتروني مطلوب',
    emailInvalid: 'بريد إلكتروني غير صالح',
    phoneMin:     'يجب أن يحتوي الهاتف على 8 أرقام على الأقل',
  },
} as const;

export type TranslationKey = keyof typeof t.fr;
export type Translations = typeof t.fr;

export default t;
