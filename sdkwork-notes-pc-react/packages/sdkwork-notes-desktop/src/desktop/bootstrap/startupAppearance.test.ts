// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { APP_STORE_STORAGE_KEY } from '@sdkwork/notes-core';
import {
  applyStartupAppearanceHints,
  readStartupAppearanceSnapshot,
} from './startupAppearance';

describe('desktop startup appearance', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('lang');
    document.documentElement.removeAttribute('data-app-platform');
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('style');
    document.documentElement.style.colorScheme = '';
  });

  it('reads persisted startup appearance from the zustand app store snapshot', () => {
    const snapshot = readStartupAppearanceSnapshot({
      storageValue: JSON.stringify({
        state: {
          themeMode: 'dark',
          themeColor: 'amber',
          languagePreference: 'en-US',
        },
      }),
      browserLanguage: 'zh-CN',
      prefersDark: false,
    });

    expect(snapshot.language).toBe('en-US');
    expect(snapshot.themeMode).toBe('dark');
    expect(snapshot.themeColor).toBe('amber');
    expect(snapshot.resolvedColorScheme).toBe('dark');
    expect(snapshot.backgroundColor).toBe('#0d111a');
    expect(snapshot.foregroundColor).toBe('#f4f7ff');
  });

  it('applies startup hints that match the persisted theme snapshot before the app mounts', () => {
    const snapshot = readStartupAppearanceSnapshot({
      storageValue: JSON.stringify({
        state: {
          themeMode: 'dark',
          themeColor: 'forest',
          languagePreference: 'zh-CN',
        },
      }),
      browserLanguage: 'en-US',
      prefersDark: false,
    });

    applyStartupAppearanceHints(snapshot);

    expect(document.documentElement.getAttribute('lang')).toBe('zh-CN');
    expect(document.documentElement.getAttribute('data-app-platform')).toBe('desktop');
    expect(document.documentElement.getAttribute('data-theme')).toBe('forest');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(document.body.style.backgroundColor).toBe('rgb(13, 17, 26)');
    expect(document.body.style.color).toBe('rgb(244, 247, 255)');
  });

  it('documents the storage key used by the startup bootstrap contract', () => {
    expect(APP_STORE_STORAGE_KEY).toBe('sdkwork-notes-app-storage');
  });
});
