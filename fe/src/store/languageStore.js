import { create } from 'zustand';
import t, { LANGUAGES } from '../utils/translations';

const STORAGE_KEY = 'app_language';

const saved = localStorage.getItem(STORAGE_KEY);
const initial = (saved === 'fr' || saved === 'en' || saved === 'ar') ? saved : 'fr';

const applyDirection = (code) => {
  const lang = LANGUAGES.find(l => l.code === code);
  const dir = lang?.rtl ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = code;
};

applyDirection(initial);

const useLanguageStore = create((set) => ({
  lang: initial,

  setLanguage: (code) => {
    localStorage.setItem(STORAGE_KEY, code);
    applyDirection(code);
    set({ lang: code });
  },

  tr: (key) => t[useLanguageStore.getState().lang]?.[key] ?? key,
}));

export const useLanguage = () => {
  const { lang, setLanguage } = useLanguageStore();
  const isRTL = LANGUAGES.find(l => l.code === lang)?.rtl ?? false;
  const tr = (key) => t[lang]?.[key] ?? key;
  return { lang, isRTL, setLanguage, tr };
};

export default useLanguageStore;
