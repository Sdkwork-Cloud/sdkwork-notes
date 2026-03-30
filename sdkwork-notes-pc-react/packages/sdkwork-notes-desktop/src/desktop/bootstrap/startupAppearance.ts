import { APP_STORE_STORAGE_KEY } from '@sdkwork/notes-core';

type ThemeMode = 'light' | 'dark' | 'system';
type ThemeColor = 'default' | 'forest' | 'amber' | 'ink';
type LanguagePreference = 'zh-CN' | 'en-US';

const LIGHT_BACKGROUND = '#f3f5f9';
const LIGHT_FOREGROUND = '#122033';
const DARK_BACKGROUND = '#0d111a';
const DARK_FOREGROUND = '#f4f7ff';

const THEME_MODES = new Set<ThemeMode>(['light', 'dark', 'system']);
const THEME_COLORS = new Set<ThemeColor>(['default', 'forest', 'amber', 'ink']);
const LANGUAGES = new Set<LanguagePreference>(['zh-CN', 'en-US']);

interface PersistedAppStoreSnapshot {
  state?: {
    themeMode?: unknown;
    themeColor?: unknown;
    languagePreference?: unknown;
  };
}

export interface StartupAppearanceSnapshot {
  language: LanguagePreference;
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  resolvedColorScheme: 'light' | 'dark';
  backgroundColor: string;
  foregroundColor: string;
}

interface ReadStartupAppearanceSnapshotOptions {
  storageValue: string | null;
  browserLanguage: string;
  prefersDark: boolean;
}

function normalizeLanguagePreference(value: unknown, fallback: string): LanguagePreference {
  if (typeof value === 'string' && LANGUAGES.has(value as LanguagePreference)) {
    return value as LanguagePreference;
  }

  return fallback.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}

function normalizeThemeMode(value: unknown): ThemeMode {
  if (typeof value === 'string' && THEME_MODES.has(value as ThemeMode)) {
    return value as ThemeMode;
  }

  return 'system';
}

function normalizeThemeColor(value: unknown): ThemeColor {
  if (typeof value === 'string' && THEME_COLORS.has(value as ThemeColor)) {
    return value as ThemeColor;
  }

  return 'default';
}

function resolveStoredSnapshot(storageValue: string | null): PersistedAppStoreSnapshot['state'] {
  if (typeof storageValue !== 'string' || storageValue.trim().length === 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(storageValue) as PersistedAppStoreSnapshot;
    if (parsed && typeof parsed === 'object' && parsed.state && typeof parsed.state === 'object') {
      return parsed.state;
    }
  } catch {
    // Ignore invalid localStorage payloads and fall back to defaults.
  }

  return undefined;
}

export function readStartupAppearanceSnapshot({
  storageValue,
  browserLanguage,
  prefersDark,
}: ReadStartupAppearanceSnapshotOptions): StartupAppearanceSnapshot {
  const storedState = resolveStoredSnapshot(storageValue);
  const themeMode = normalizeThemeMode(storedState?.themeMode);
  const themeColor = normalizeThemeColor(storedState?.themeColor);
  const language = normalizeLanguagePreference(storedState?.languagePreference, browserLanguage);
  const resolvedColorScheme =
    themeMode === 'dark' || (themeMode === 'system' && prefersDark) ? 'dark' : 'light';

  return {
    language,
    themeMode,
    themeColor,
    resolvedColorScheme,
    backgroundColor: resolvedColorScheme === 'dark' ? DARK_BACKGROUND : LIGHT_BACKGROUND,
    foregroundColor: resolvedColorScheme === 'dark' ? DARK_FOREGROUND : LIGHT_FOREGROUND,
  };
}

export function readCurrentStartupAppearanceSnapshot(): StartupAppearanceSnapshot {
  if (typeof window === 'undefined') {
    return readStartupAppearanceSnapshot({
      storageValue: null,
      browserLanguage: 'en-US',
      prefersDark: false,
    });
  }

  let storageValue: string | null = null;

  try {
    storageValue = window.localStorage.getItem(APP_STORE_STORAGE_KEY);
  } catch {
    storageValue = null;
  }

  return readStartupAppearanceSnapshot({
    storageValue,
    browserLanguage: window.navigator.language,
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
  });
}

export function applyStartupAppearanceHints(snapshot: StartupAppearanceSnapshot) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.setAttribute('lang', snapshot.language);
  root.setAttribute('data-app-platform', 'desktop');
  root.setAttribute('data-theme', snapshot.themeColor);
  root.setAttribute('data-desktop-theme-mode', snapshot.themeMode);
  root.setAttribute('data-desktop-theme-color', snapshot.themeColor);
  root.classList.toggle('dark', snapshot.resolvedColorScheme === 'dark');
  root.style.colorScheme = snapshot.resolvedColorScheme;

  document.body.style.margin = '0';
  document.body.style.backgroundColor = snapshot.backgroundColor;
  document.body.style.color = snapshot.foregroundColor;
}
