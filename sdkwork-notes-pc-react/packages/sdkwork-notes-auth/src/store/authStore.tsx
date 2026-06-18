import React, {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  useSdkworkAuthControllerState,
  type SdkworkAuthController,
  type SdkworkAuthUser,
} from '@sdkwork/auth-pc-react';
import { createNotesAuthController } from '../services/sdkworkAuthBridge';

export interface NotesAuthUserProfileInput {
  avatarUrl?: string;
  displayName?: string;
  email: string;
  firstName?: string;
  id?: string;
  lastName?: string;
  username?: string;
}

export interface NotesAuthStoreState {
  isAuthenticated: boolean;
  isSessionReady: boolean;
  signOut: () => Promise<void>;
  syncUserProfile: (profile: NotesAuthUserProfileInput) => void;
  user: ReturnType<typeof useSdkworkAuthControllerState>['user'];
}

const AuthControllerContext = createContext<SdkworkAuthController | null>(null);
const AuthStoreContext = createContext<NotesAuthStoreState | null>(null);

function splitDisplayName(displayName: string) {
  const normalized = displayName.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return {
      firstName: 'Notes',
      lastName: 'User',
    };
  }

  const [firstName, ...rest] = normalized.split(' ');
  return {
    firstName,
    lastName: rest.join(' '),
  };
}

function buildInitials(firstName: string, lastName: string) {
  return [firstName, lastName]
    .map((value) => value.trim().charAt(0))
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'NU';
}

function mergeSdkworkAuthUser(
  currentUser: SdkworkAuthUser | null,
  profile: NotesAuthUserProfileInput,
): SdkworkAuthUser {
  const fallbackName = profile.displayName?.trim()
    || [profile.firstName?.trim(), profile.lastName?.trim()].filter(Boolean).join(' ').trim()
    || currentUser?.displayName
    || profile.email.trim()
    || 'Notes User';
  const displayNameParts = splitDisplayName(fallbackName);
  const firstName = profile.firstName?.trim() || currentUser?.firstName || displayNameParts.firstName;
  const lastName = profile.lastName?.trim() || currentUser?.lastName || displayNameParts.lastName;

  return {
    avatar: profile.avatarUrl?.trim()
      ? {
          kind: 'image',
          source: 'external_url',
          url: profile.avatarUrl.trim(),
        }
      : currentUser?.avatar,
    displayName: fallbackName,
    email: profile.email.trim() || currentUser?.email || '',
    firstName,
    id: profile.id?.trim() || currentUser?.id,
    initials: buildInitials(firstName, lastName),
    lastName,
    username: profile.username?.trim() || currentUser?.username,
  };
}

export function AuthStoreProvider({ children }: PropsWithChildren) {
  const [controller] = useState(() => createNotesAuthController());
  const state = useSdkworkAuthControllerState(controller);

  useEffect(() => {
    void controller.bootstrap().catch((error: unknown) => {
      console.error('[notes-auth] session bootstrap failed', error);
    });
  }, [controller]);

  const value = useMemo<NotesAuthStoreState>(
    () => ({
      isAuthenticated: state.isAuthenticated,
      isSessionReady: state.isBootstrapped,
      async signOut() {
        await controller.signOut();
      },
      syncUserProfile(profile) {
        controller.syncUserProfile(mergeSdkworkAuthUser(state.user, profile));
      },
      user: state.user,
    }),
    [controller, state.isAuthenticated, state.isBootstrapped, state.user],
  );

  return (
    <AuthControllerContext.Provider value={controller}>
      <AuthStoreContext.Provider value={value}>
        {children}
      </AuthStoreContext.Provider>
    </AuthControllerContext.Provider>
  );
}

export function useAuthController(): SdkworkAuthController {
  const controller = useContext(AuthControllerContext);
  if (!controller) {
    throw new Error('useAuthController must be used within AuthStoreProvider');
  }
  return controller;
}

export function useAuthStore<T>(selector: (state: NotesAuthStoreState) => T): T {
  const context = useContext(AuthStoreContext);
  if (!context) {
    throw new Error('useAuthStore must be used within AuthStoreProvider.');
  }

  return selector(context);
}
