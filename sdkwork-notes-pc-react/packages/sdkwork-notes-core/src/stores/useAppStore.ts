import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LanguagePreference, ThemeColor, ThemeMode } from '@sdkwork/notes-types';

export const APP_STORE_STORAGE_KEY = 'sdkwork-notes-app-storage';

export interface AppStoreState {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  languagePreference: LanguagePreference;
  sidebarCollapsed: boolean;
  inspectorOpen: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
  setLanguagePreference: (language: LanguagePreference) => void;
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
      toggleSidebar() {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      setInspectorOpen(inspectorOpen) {
        set({ inspectorOpen });
      },
    }),
    {
      name: APP_STORE_STORAGE_KEY,
      storage: createJSONStorage(() => globalThis.localStorage),
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
