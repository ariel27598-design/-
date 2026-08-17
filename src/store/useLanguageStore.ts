import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from '../i18n/translations';

interface LanguageStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      lang: 'he',
      setLang: (lang) => set({ lang }),
      toggleLang: () => set({ lang: get().lang === 'he' ? 'en' : 'he' }),
    }),
    { name: 'boardgame-matcher-language' },
  ),
);
