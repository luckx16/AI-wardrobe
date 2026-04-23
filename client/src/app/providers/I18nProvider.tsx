'use client';

import { useEffect } from 'react';

import { I18nextProvider } from 'react-i18next';

import { AppLanguage, i18n, isSupportedLanguage } from '@/shared/i18n/config';

const COOKIE_KEY = 'ai-wardrobe-language';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

export function I18nProvider({
  initialLang,
  children,
}: {
  initialLang: AppLanguage;
  children: React.ReactNode;
}) {
  // Apply initial language synchronously so server and client render the same text
  if (i18n.language !== initialLang) {
    void i18n.changeLanguage(initialLang);
  }

  useEffect(() => {
    const savedLang = getCookie(COOKIE_KEY);
    if (isSupportedLanguage(savedLang) && savedLang !== i18n.language) {
      void i18n.changeLanguage(savedLang);
      document.documentElement.lang = savedLang;
    } else {
      document.documentElement.lang = initialLang;
    }
  }, [initialLang]);

  useEffect(() => {
    const updateLang = (lang: string) => {
      if (!isSupportedLanguage(lang)) return;
      setCookie(COOKIE_KEY, lang);
      document.documentElement.lang = lang;
    };

    i18n.on('languageChanged', updateLang);
    return () => {
      i18n.off('languageChanged', updateLang);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
