// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authStoreTestState = vi.hoisted(() => {
  const controller = {
    bootstrap: vi.fn(async () => ({
      isAuthenticated: true,
      isBootstrapped: true,
      isBusy: false,
      session: null,
      status: 'authenticated',
      user: {
        displayName: 'Restored Notes User',
        email: 'restored@example.com',
        firstName: 'Restored',
        id: 'restored-user',
        initials: 'RN',
        lastName: 'User',
        username: 'restored-user',
      },
    })),
    signOut: vi.fn(async () => undefined),
    subscribe: vi.fn(() => () => {}),
    syncUserProfile: vi.fn(),
  };

  return {
    controller,
    controllerState: {
      isAuthenticated: false,
      isBootstrapped: false,
      isBusy: false,
      session: null,
      status: 'anonymous',
      user: {
        avatar: {
          kind: 'image',
          source: 'external_url',
          url: 'https://example.com/old.png',
        },
        displayName: 'Existing Person',
        email: 'existing@example.com',
        firstName: 'Existing',
        id: 'existing-user',
        initials: 'EP',
        lastName: 'Person',
        username: 'existing-person',
      },
    },
  };
});

vi.mock('@sdkwork/auth-pc-react', () => ({
  useSdkworkAuthControllerState: vi.fn(() => authStoreTestState.controllerState),
}));

vi.mock('../services/sdkworkAuthBridge', () => ({
  createNotesAuthController: vi.fn(() => authStoreTestState.controller),
}));

import { AuthStoreProvider, useAuthController, useAuthStore } from './authStore';

function AuthStoreConsumer() {
  useAuthController();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionReady = useAuthStore((state) => state.isSessionReady);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const syncUserProfile = useAuthStore((state) => state.syncUserProfile);

  return (
    <div>
      <div data-testid="auth-state">{String(isAuthenticated)}</div>
      <div data-testid="session-ready">{String(isSessionReady)}</div>
      <div data-testid="user-display-name">{user?.displayName ?? 'none'}</div>
      <button
        onClick={() => {
          void signOut();
        }}
        type="button"
      >
        signout
      </button>
      <button
        onClick={() => {
          syncUserProfile({
            email: 'refined@example.com',
            firstName: 'Refined',
            username: 'refined-notes-user',
          });
        }}
        type="button"
      >
        sync
      </button>
    </div>
  );
}

function MissingProviderConsumer() {
  useAuthStore((state) => state.isAuthenticated);
  return null;
}

describe('notes auth store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStoreTestState.controllerState.isAuthenticated = false;
    authStoreTestState.controllerState.isBootstrapped = false;
    authStoreTestState.controllerState.user = {
      avatar: {
        kind: 'image',
        source: 'external_url',
        url: 'https://example.com/old.png',
      },
      displayName: 'Existing Person',
      email: 'existing@example.com',
      firstName: 'Existing',
      id: 'existing-user',
      initials: 'EP',
      lastName: 'Person',
      username: 'existing-person',
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('bootstraps the shared auth controller when the provider mounts and still delegates sign-out', async () => {
    render(
      <AuthStoreProvider>
        <AuthStoreConsumer />
      </AuthStoreProvider>,
    );

    expect(screen.getByTestId('auth-state')).toHaveTextContent('false');
    expect(screen.getByTestId('session-ready')).toHaveTextContent('false');
    expect(screen.getByTestId('user-display-name')).toHaveTextContent('Existing Person');

    await act(async () => {
      screen.getByRole('button', { name: 'signout' }).click();
    });

    expect(authStoreTestState.controller.bootstrap).toHaveBeenCalledTimes(1);
    expect(authStoreTestState.controller.signOut).toHaveBeenCalledTimes(1);
  });

  it('merges profile updates into the shared auth user shape before syncing to the controller', async () => {
    render(
      <AuthStoreProvider>
        <AuthStoreConsumer />
      </AuthStoreProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'sync' }).click();
    });

    expect(authStoreTestState.controller.syncUserProfile).toHaveBeenCalledWith({
      avatar: {
        kind: 'image',
        source: 'external_url',
        url: 'https://example.com/old.png',
      },
      displayName: 'Refined',
      email: 'refined@example.com',
      firstName: 'Refined',
      id: 'existing-user',
      initials: 'RP',
      lastName: 'Person',
      username: 'refined-notes-user',
    });
  });

  it('throws when useAuthStore is called outside AuthStoreProvider', () => {
    expect(() => render(<MissingProviderConsumer />)).toThrow(
      'useAuthStore must be used within AuthStoreProvider.',
    );
  });
});
