import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { I18nManager, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import t, { LangCode, TranslationKey, LANGUAGES } from '../utils/translations';

const STORAGE_KEY = '@app_language';

interface LanguageContextType {
  lang: LangCode;
  isRTL: boolean;
  setLanguage: (code: LangCode) => Promise<void>;
  tr: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  isRTL: false,
  setLanguage: async () => {},
  tr: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<LangCode>('fr');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'fr' || saved === 'en' || saved === 'ar') {
        setLang(saved);
        const langDef = LANGUAGES.find(l => l.code === saved);
        if (langDef && langDef.rtl !== I18nManager.isRTL) {
          I18nManager.forceRTL(langDef.rtl);
        }
      }
    });
  }, []);

  const setLanguage = useCallback(async (code: LangCode) => {
    const langDef = LANGUAGES.find(l => l.code === code);
    if (!langDef) return;

    await AsyncStorage.setItem(STORAGE_KEY, code);
    setLang(code);

    if (langDef.rtl !== I18nManager.isRTL) {
      I18nManager.forceRTL(langDef.rtl);
      Alert.alert(
        t[code].restartRequired,
        t[code].restartMsg,
        [{ text: 'OK' }]
      );
    }
  }, []);

  const tr = useCallback(
    (key: TranslationKey): string => t[lang][key] as string,
    [lang]
  );

  const isRTL = LANGUAGES.find(l => l.code === lang)?.rtl ?? false;

  return (
    <LanguageContext.Provider value={{ lang, isRTL, setLanguage, tr }}>
      {children}
    </LanguageContext.Provider>
  );
};
