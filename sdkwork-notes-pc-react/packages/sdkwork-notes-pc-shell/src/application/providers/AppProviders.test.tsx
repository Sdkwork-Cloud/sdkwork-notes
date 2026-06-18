// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders, __resetAppProvidersBootstrapStateForTests } from './AppProviders';

const {
  bootstrapNotesWorkspaceStoreMock,
  hydratePreferencesMock,
  getCurrentSettingsMock,
  appStoreState,
  resetNotesWorkspaceStoreBootstrapMock,
  authStoreState,
} = vi.hoisted(() => ({
  bootstrapNotesWorkspaceStoreMock: vi.fn(),
  hydratePreferencesMock: vi.fn(),
  getCurrentSettingsMock: vi.fn(async () => ({
    themeMode: 'dark',
    languagePreference: 'en-US',
  })),
  appStoreState: {
    themeMode: 'light',
    hydratePreferences: vi.fn(),
  },
  authStoreState: {
    isAuthenticated: false,
    isSessionReady: true,
    user: null as { email: string } | null,
  },
  resetNotesWorkspaceStoreBootstrapMock: vi.fn(),
}));

appStoreState.hydratePreferences = hydratePreferencesMock;

vi.mock('@sdkwork/notes-pc-core', () => ({
  appUserService: {
    getCurrentSettings: getCurrentSettingsMock,
  },
  useAppStore: <T,>(selector: (state: typeof appStoreState) => T) => selector(appStoreState),
  useAuthStore: () => {
    throw new Error('AppProviders should read auth state from @sdkwork/notes-pc-auth.');
  },
}));

vi.mock('@sdkwork/notes-pc-auth', () => ({
  AuthStoreProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-store-provider">{children}</div>
  ),
  useAuthStore: <T,>(selector: (state: typeof authStoreState) => T) => selector(authStoreState),
}));

vi.mock('@sdkwork/notes-pc-notes', () => ({
  bootstrapNotesWorkspaceStore: bootstrapNotesWorkspaceStoreMock,
  resetNotesWorkspaceStoreBootstrap: resetNotesWorkspaceStoreBootstrapMock,
}));

vi.mock('@sdkwork/notes-pc-i18n', () => ({
  useNotesTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en-US',
      changeLanguage: vi.fn(async () => undefined),
    },
  }),
}));

vi.mock('./LanguageManager', () => ({
  LanguageManager: () => null,
}));

vi.mock('./ThemeManager', () => ({
  ThemeManager: () => null,
}));

describe('AppProviders', () => {
  beforeEach(() => {
    __resetAppProvidersBootstrapStateForTests();
    bootstrapNotesWorkspaceStoreMock.mockClear();
    hydratePreferencesMock.mockClear();
    getCurrentSettingsMock.mockClear();
    resetNotesWorkspaceStoreBootstrapMock.mockClear();
    appStoreState.themeMode = 'light';
    authStoreState.isAuthenticated = false;
    authStoreState.isSessionReady = true;
    authStoreState.user = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('does not trigger auth bootstrap from the shell provider layer when the session is not authenticated', async () => {
    const { getByTestId } = render(
      <AppProviders>
        <div>children</div>
      </AppProviders>,
    );

    expect(getByTestId('auth-store-provider')).toBeInTheDocument();

    await waitFor(() => {
      expect(getCurrentSettingsMock).toHaveBeenCalledTimes(0);
    });
    expect(bootstrapNotesWorkspaceStoreMock).not.toHaveBeenCalled();
    expect(getCurrentSettingsMock).not.toHaveBeenCalled();
    expect(resetNotesWorkspaceStoreBootstrapMock).toHaveBeenCalledTimes(1);
  });

  it('hydrates local theme and language preferences from remote user settings once the session is authenticated', async () => {
    authStoreState.isAuthenticated = true;
    authStoreState.user = { email: 'notes@example.com' };

    const { getByTestId } = render(
      <AppProviders>
        <div>children</div>
      </AppProviders>,
    );

    expect(getByTestId('auth-store-provider')).toBeInTheDocument();

    await waitFor(() => {
      expect(bootstrapNotesWorkspaceStoreMock).toHaveBeenCalledTimes(1);
      expect(getCurrentSettingsMock).toHaveBeenCalledTimes(1);
      expect(hydratePreferencesMock).toHaveBeenCalledWith({
        themeMode: 'dark',
        languagePreference: 'en-US',
      });
      expect(bootstrapNotesWorkspaceStoreMock).toHaveBeenCalledWith({});
    });
  });

  it('avoids duplicate session restore and remote settings hydration under StrictMode remounting', async () => {
    authStoreState.isAuthenticated = true;
    authStoreState.user = { email: 'notes@example.com' };

    const { getByTestId } = render(
      <StrictMode>
        <AppProviders>
          <div>children</div>
        </AppProviders>
      </StrictMode>,
    );

    expect(getByTestId('auth-store-provider')).toBeInTheDocument();

    await waitFor(() => {
      expect(bootstrapNotesWorkspaceStoreMock).toHaveBeenCalledTimes(1);
      expect(getCurrentSettingsMock).toHaveBeenCalledTimes(1);
      expect(hydratePreferencesMock).toHaveBeenCalledTimes(1);
    });
  });

  it('forwards explicit workspace bootstrap options and re-bootstrap when the options reference changes for the same authenticated user', async () => {
    authStoreState.isAuthenticated = true;
    authStoreState.user = { email: 'notes@example.com' };

    const firstBootstrapOptions = {
      apply: vi.fn(async () => ({
        type: 'completed' as const,
        at: '2026-04-14T14:00:00.000Z',
      })),
    };
    const secondBootstrapOptions = {
      apply: vi.fn(async () => ({
        type: 'completed' as const,
        at: '2026-04-14T14:05:00.000Z',
      })),
    };

    const { rerender } = render(
      <AppProviders notesWorkspaceBootstrapOptions={firstBootstrapOptions}>
        <div>children</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(bootstrapNotesWorkspaceStoreMock).toHaveBeenCalledTimes(1);
      expect(bootstrapNotesWorkspaceStoreMock).toHaveBeenLastCalledWith(firstBootstrapOptions);
    });

    rerender(
      <AppProviders notesWorkspaceBootstrapOptions={secondBootstrapOptions}>
        <div>children</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(bootstrapNotesWorkspaceStoreMock).toHaveBeenCalledTimes(2);
      expect(bootstrapNotesWorkspaceStoreMock).toHaveBeenLastCalledWith(secondBootstrapOptions);
    });
  });
});
