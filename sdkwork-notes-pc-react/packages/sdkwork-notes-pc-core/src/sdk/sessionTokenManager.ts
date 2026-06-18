import type { AuthTokenManager, AuthTokens } from '@sdkwork/sdk-common';
import {
  applyAppSdkSessionTokens,
  clearAppSdkSessionTokens,
  readAppSdkSessionTokens,
  resetAppSdkClient,
  type AppSdkSessionTokens,
} from './useAppSdkClient';

let notesGlobalTokenManager: AuthTokenManager | null = null;

function createNotesSessionTokenManager(
  readSession: () => AppSdkSessionTokens,
): AuthTokenManager {
  let currentSession = readSession();

  const readCurrentSession = () => currentSession ?? readSession();
  const patchTokens = (tokens: Partial<AppSdkSessionTokens>) => {
    currentSession = {
      ...readCurrentSession(),
      ...tokens,
    };
    applyAppSdkSessionTokens(currentSession);
  };

  return {
    getAuthToken: () => readCurrentSession().authToken,
    getAccessToken: () => readCurrentSession().accessToken,
    getRefreshToken: () => readCurrentSession().refreshToken,
    getTokens: (): AuthTokens => ({
      ...(readCurrentSession().accessToken ? { accessToken: readCurrentSession().accessToken } : {}),
      ...(readCurrentSession().authToken ? { authToken: readCurrentSession().authToken } : {}),
      ...(readCurrentSession().refreshToken ? { refreshToken: readCurrentSession().refreshToken } : {}),
    }),
    setTokens: (tokens: AuthTokens) => {
      patchTokens(tokens);
    },
    setAccessToken: (accessToken: string) => patchTokens({ accessToken }),
    setAuthToken: (authToken: string) => patchTokens({ authToken }),
    setRefreshToken: (refreshToken: string) => patchTokens({ refreshToken }),
    clearTokens: () => {
      currentSession = {};
      clearAppSdkSessionTokens();
      resetAppSdkClient();
    },
    clearAuthToken: () => patchTokens({ authToken: undefined }),
    clearAccessToken: () => patchTokens({ accessToken: undefined }),
    isExpired: () => false,
    isValid: () => Boolean(readCurrentSession().authToken && readCurrentSession().accessToken),
    hasToken: () => Boolean(readCurrentSession().authToken && readCurrentSession().accessToken),
    hasAuthToken: () => Boolean(readCurrentSession().authToken),
    hasAccessToken: () => Boolean(readCurrentSession().accessToken),
    willExpireIn: () => false,
  };
}

export function getNotesGlobalTokenManager(): AuthTokenManager {
  if (!notesGlobalTokenManager) {
    notesGlobalTokenManager = createNotesSessionTokenManager(() => readAppSdkSessionTokens());
  }
  return notesGlobalTokenManager;
}

export function resetNotesGlobalTokenManager(): void {
  notesGlobalTokenManager = null;
}
