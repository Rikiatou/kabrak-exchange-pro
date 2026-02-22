import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../i18n/translations';

const LANG_KEY = 'kabrak_language';

const useLanguageStore = create((set, get) => ({
  language: 'fr',
  t: translations['fr'],

  init: async () => {
    try {
      const saved = await AsyncStorage.getItem(LANG_KEY);
      if (saved && (saved === 'fr' || saved === 'en')) {
        set({ language: saved, t: translations[saved] });
      }
    } catch (_) {}
  },

  setLanguage: async (lang) => {
    try {
      await AsyncStorage.setItem(LANG_KEY, lang);
    } catch (_) {}
    set({ language: lang, t: translations[lang] });
  },

  toggleLanguage: async () => {
    const next = get().language === 'fr' ? 'en' : 'fr';
    try {
      await AsyncStorage.setItem(LANG_KEY, next);
    } catch (_) {}
    set({ language: next, t: translations[next] });
  },
}));

export default useLanguageStore;
