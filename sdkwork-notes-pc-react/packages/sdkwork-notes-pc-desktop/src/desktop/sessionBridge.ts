import {
  APP_SDK_SESSION_STORAGE_KEY,
  configureAppSdkSessionStoreAdapter,
  type AppSdkSessionStoreAdapter,
  type AppSdkSessionTokens,
} from '@sdkwork/notes-pc-core';
import {
  clearDesktopSessionState,
  readDesktopSessionState,
  writeDesktopSessionState,
} from './tauriBridge';

const desktopSessionMirror = new Map<string, string>();
let desktopSessionSyncChain: Promise<void> = Promise.resolve();

function normalizeSessionTokens(session?: AppSdkSessionTokens | null): AppSdkSessionTokens {
  const authToken = typeof session?.authToken === 'string' ? session.authToken.trim() : '';
  const accessToken = typeof session?.accessToken === 'string' ? session.accessToken.trim() : '';
  const refreshToken = typeof session?.refreshToken === 'string' ? session.refreshToken.trim() : '';

  return {
    authToken: authToken || undefined,
    accessToken: accessToken || undefined,
    refreshToken: refreshToken || undefined,
  };
}

function hasSessionTokens(session?: AppSdkSessionTokens | null): boolean {
  return Boolean(session?.authToken || session?.accessToken || session?.refreshToken);
}

function resolveSessionMirrorStorage(): Storage {
  if (typeof globalThis.sessionStorage !== 'undefined') {
    return globalThis.sessionStorage;
  }

  return {
    get length() {
      return desktopSessionMirror.size;
    },
    clear() {
      desktopSessionMirror.clear();
    },
    getItem(key) {
      return desktopSessionMirror.get(key) ?? null;
    },
    key(index) {
      return Array.from(desktopSessionMirror.keys())[index] ?? null;
    },
    removeItem(key) {
      desktopSessionMirror.delete(key);
    },
    setItem(key, value) {
      desktopSessionMirror.set(key, value);
    },
  };
}

function readSessionMirror(): AppSdkSessionTokens | null {
  try {
    const raw = resolveSessionMirrorStorage().getItem(APP_SDK_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw) as AppSdkSessionTokens;
    const normalizedSession = normalizeSessionTokens(session);
    return hasSessionTokens(normalizedSession) ? normalizedSession : null;
  } catch {
    return null;
  }
}

function writeSessionMirror(session?: AppSdkSessionTokens | null): void {
  const normalizedSession = normalizeSessionTokens(session);

  try {
    if (!hasSessionTokens(normalizedSession)) {
      resolveSessionMirrorStorage().removeItem(APP_SDK_SESSION_STORAGE_KEY);
      return;
    }

    resolveSessionMirrorStorage().setItem(
      APP_SDK_SESSION_STORAGE_KEY,
      JSON.stringify(normalizedSession),
    );
  } catch {
    // Ignore session mirror errors. The native store remains the source of truth on desktop.
  }
}

function queueDesktopSessionSync(operation: () => Promise<void>): void {
  desktopSessionSyncChain = desktopSessionSyncChain
    .catch(() => {})
    .then(operation)
    .catch(() => {});
}

function createDesktopSessionStoreAdapter(): AppSdkSessionStoreAdapter {
  return {
    kind: 'desktop-native-session',
    clear() {
      writeSessionMirror(null);
      queueDesktopSessionSync(async () => {
        await clearDesktopSessionState();
      });
    },
    read() {
      return readSessionMirror();
    },
    write(session) {
      const normalizedSession = normalizeSessionTokens(session);
      writeSessionMirror(normalizedSession);
      queueDesktopSessionSync(async () => {
        if (!hasSessionTokens(normalizedSession)) {
          await clearDesktopSessionState();
          return;
        }

        await writeDesktopSessionState(normalizedSession);
      });
    },
  };
}

export async function installDesktopSessionStoreBridge(): Promise<void> {
  const nativeSession = normalizeSessionTokens(await readDesktopSessionState());
  const mirroredSession = normalizeSessionTokens(readSessionMirror());
  const initialSession = hasSessionTokens(nativeSession)
    ? nativeSession
    : hasSessionTokens(mirroredSession)
      ? mirroredSession
      : null;

  writeSessionMirror(initialSession);
  configureAppSdkSessionStoreAdapter(createDesktopSessionStoreAdapter());

  if (!hasSessionTokens(nativeSession) && hasSessionTokens(mirroredSession)) {
    queueDesktopSessionSync(async () => {
      await writeDesktopSessionState(mirroredSession);
    });
  }
}
