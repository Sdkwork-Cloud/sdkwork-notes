import { useEffect } from 'react';
import { useAppStore } from '@sdkwork/notes-core';
import { i18n } from '@sdkwork/notes-i18n';

export function LanguageManager() {
  const languagePreference = useAppStore((state) => state.languagePreference);

  useEffect(() => {
    document.documentElement.setAttribute('lang', languagePreference);
    if (i18n.resolvedLanguage !== languagePreference) {
      void i18n.changeLanguage(languagePreference);
    }
  }, [languagePreference]);

  return null;
}
