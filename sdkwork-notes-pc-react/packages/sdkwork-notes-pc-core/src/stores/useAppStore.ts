import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LanguagePreference, ThemeColor, ThemeMode } from '@sdkwork/notes-pc-types';

export const APP_STORE_STORAGE_KEY = 'sdkwork-notes-app-storage';
const fallbackAppStoreStorage = createMemoryStorage();

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.get(key) ?? null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

function getAppStoreStorage() {
  if (typeof globalThis.localStorage !== 'undefined') {
    return globalThis.localStorage;
  }

  return fallbackAppStoreStorage;
}

export interface AppStoreState {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  languagePreference: LanguagePreference;
  sidebarCollapsed: boolean;
  inspectorOpen: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
  setLanguagePreference: (language: LanguagePreference) => void;
  hydratePreferences: (preferences: {
    themeMode: ThemeMode;
    languagePreference: LanguagePreference;
  }) => void;
  toggleSidebar: () => void;
  setInspectorOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      themeColor: 'default',
      languagePreference: 'zh-CN',
      sidebarCollapsed: false,
      inspectorOpen: true,
      setThemeMode(themeMode) {
        set({ themeMode });
      },
      setThemeColor(themeColor) {
        set({ themeColor });
      },
      setLanguagePreference(languagePreference) {
        set({ languagePreference });
      },
      hydratePreferences(preferences) {
        set({
          themeMode: preferences.themeMode,
          languagePreference: preferences.languagePreference,
        });
      },
      toggleSidebar() {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      setInspectorOpen(inspectorOpen) {
        set({ inspectorOpen });
      },
    }),
    {
      name: APP_STORE_STORAGE_KEY,
      storage: createJSONStorage(getAppStoreStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        themeColor: state.themeColor,
        languagePreference: state.languagePreference,
        sidebarCollapsed: state.sidebarCollapsed,
        inspectorOpen: state.inspectorOpen,
      }),
    },
  ),
);
