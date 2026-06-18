import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      themeMode: 'system',
      themeColor: 'default',
      languagePreference: 'zh-CN',
      sidebarCollapsed: false,
      inspectorOpen: true,
    });
  });

  it('hydrates remote preferences without clobbering local-only theme color or layout state', () => {
    useAppStore.getState().setThemeColor('forest');
    useAppStore.getState().toggleSidebar();
    useAppStore.getState().setInspectorOpen(false);

    useAppStore.getState().hydratePreferences({
      themeMode: 'dark',
      languagePreference: 'en-US',
    });

    expect(useAppStore.getState()).toMatchObject({
      themeMode: 'dark',
      themeColor: 'forest',
      languagePreference: 'en-US',
      sidebarCollapsed: true,
      inspectorOpen: false,
    });
  });
});
