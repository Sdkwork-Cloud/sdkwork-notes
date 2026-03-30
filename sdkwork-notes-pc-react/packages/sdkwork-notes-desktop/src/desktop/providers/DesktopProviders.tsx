import { useEffect, type ReactNode } from 'react';
import { useAppStore } from '@sdkwork/notes-core';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import { setAppLanguage } from '../tauriBridge';

interface DesktopProvidersProps {
  children: ReactNode;
}

export function DesktopProviders({ children }: DesktopProvidersProps) {
  const { t } = useNotesTranslation();
  const languagePreference = useAppStore((state) => state.languagePreference);
  const themeMode = useAppStore((state) => state.themeMode);
  const themeColor = useAppStore((state) => state.themeColor);

  useEffect(() => {
    document.documentElement.setAttribute('data-app-platform', 'desktop');
    document.documentElement.setAttribute('data-desktop-theme-mode', themeMode);
    document.documentElement.setAttribute('data-desktop-theme-color', themeColor);
    document.title = t('shell.layout.brand');
  }, [t, themeColor, themeMode]);

  useEffect(() => {
    void setAppLanguage(languagePreference).catch(() => {
      // Tray localization sync is best-effort.
    });
  }, [languagePreference]);

  return <>{children}</>;
}
