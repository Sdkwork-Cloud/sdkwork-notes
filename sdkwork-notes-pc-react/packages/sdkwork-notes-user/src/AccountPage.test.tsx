// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountPage, __resetAccountPageProfileHydrationForTests } from './AccountPage';

const {
  getCurrentProfileMock,
  updateCurrentProfileMock,
  updateCurrentSettingsMock,
  signOutMock,
  syncUserProfileMock,
  appStoreState,
  authStoreState,
} = vi.hoisted(() => ({
  getCurrentProfileMock: vi.fn(async () => ({
    displayName: 'Remote Notes User',
    email: 'remote@example.com',
    avatarUrl: 'https://cdn.example.com/avatar.png',
  })),
  updateCurrentProfileMock: vi.fn(),
  updateCurrentSettingsMock: vi.fn(),
  signOutMock: vi.fn(async () => undefined),
  syncUserProfileMock: vi.fn(),
  appStoreState: {
    themeMode: 'system',
    themeColor: 'default',
    languagePreference: 'en-US',
    setThemeMode: vi.fn(),
    setThemeColor: vi.fn(),
    setLanguagePreference: vi.fn(),
  },
  authStoreState: {
    user: {
      firstName: 'Fallback',
      lastName: 'User',
      displayName: 'Fallback User',
      email: '',
      avatarUrl: '',
      initials: 'FU',
    },
    signOut: vi.fn(async () => undefined),
    syncUserProfile: vi.fn(),
  },
}));

authStoreState.signOut = signOutMock;
authStoreState.syncUserProfile = syncUserProfileMock;

vi.mock('@sdkwork/notes-core', () => ({
  appUserService: {
    getCurrentProfile: getCurrentProfileMock,
    updateCurrentProfile: updateCurrentProfileMock,
    updateCurrentSettings: updateCurrentSettingsMock,
  },
  useAppStore: () => appStoreState,
}));

vi.mock('@sdkwork/notes-auth', () => ({
  useAuthStore: <T,>(selector: (state: typeof authStoreState) => T) => selector(authStoreState),
}));

vi.mock('@sdkwork/notes-i18n', () => ({
  useNotesTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en-US',
      changeLanguage: vi.fn(async () => undefined),
    },
  }),
}));

vi.mock('@sdkwork/notes-commons', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>{children}</button>
  ),
  SurfaceCard: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('AccountPage', () => {
  beforeEach(() => {
    __resetAccountPageProfileHydrationForTests();
    getCurrentProfileMock.mockClear();
    updateCurrentProfileMock.mockClear();
    updateCurrentSettingsMock.mockClear();
    signOutMock.mockClear();
    syncUserProfileMock.mockClear();
    authStoreState.user = {
      firstName: 'Fallback',
      lastName: 'User',
      displayName: 'Fallback User',
      email: '',
      avatarUrl: '',
      initials: 'FU',
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('hydrates the current profile even when the authenticated user does not have an email yet', async () => {
    render(<AccountPage />);

    await waitFor(() => {
      expect(getCurrentProfileMock).toHaveBeenCalledTimes(1);
    });

    expect(syncUserProfileMock).toHaveBeenCalledWith({
      displayName: 'Remote Notes User',
      email: 'remote@example.com',
      avatarUrl: 'https://cdn.example.com/avatar.png',
    });
    expect(screen.getByDisplayValue('Remote Notes User')).toBeInTheDocument();
  });

  it('avoids duplicate remote profile hydration under StrictMode remounting', async () => {
    render(
      <StrictMode>
        <AccountPage />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(getCurrentProfileMock).toHaveBeenCalledTimes(1);
      expect(syncUserProfileMock).toHaveBeenCalledTimes(1);
    });
  });
});
