'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';

import { AppLanguage, i18n, supportedLngs } from '@/shared/i18n/config';

const STORAGE_KEY = 'ai-wardrobe-language';

const isSupportedLanguage = (value: string | null): value is AppLanguage =>
  value !== null && supportedLngs.includes(value as AppLanguage);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedLang = localStorage.getItem(STORAGE_KEY);
    if (isSupportedLanguage(savedLang)) {
      void i18n.changeLanguage(savedLang);
      document.documentElement.lang = savedLang;
      return;
    }

    document.documentElement.lang = 'ru';
  }, []);

  useEffect(() => {
    const updateLang = (lang: string) => {
      if (!isSupportedLanguage(lang)) {
        return;
      }

      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    };

    i18n.on('languageChanged', updateLang);
    return () => {
      i18n.off('languageChanged', updateLang);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
