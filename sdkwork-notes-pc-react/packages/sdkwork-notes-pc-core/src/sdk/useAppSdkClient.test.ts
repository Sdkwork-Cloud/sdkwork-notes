import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type AppSdkSessionTokens,
  clearAppSdkSessionTokens,
  configureAppSdkClientFactory,
  configureAppSdkSessionStoreAdapter,
  createAppSdkClientConfig,
  readAppSdkSessionTokens,
  resolveAppSdkRuntimeContext,
  resetAppSdkClient,
  persistAppSdkSessionTokens,
} from './useAppSdkClient';

declare global {
  // eslint-disable-next-line no-var
  var __SDKWORK_NOTES_ENV__: Record<string, unknown> | undefined;
}

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

beforeEach(() => {
  resetAppSdkClient();
  configureAppSdkClientFactory(null);
  clearAppSdkSessionTokens();
  configureAppSdkSessionStoreAdapter(null);
  globalThis.__SDKWORK_NOTES_ENV__ = undefined;
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createMemoryStorage(),
    configurable: true,
  });
});

afterEach(() => {
  globalThis.__SDKWORK_NOTES_ENV__ = undefined;
});

function createTestAccessToken(claims: Record<string, unknown>): string {
  const body = btoa(JSON.stringify(claims)).replace(/=+$/g, '');
  return `header.${body}.signature`;
}

describe('createAppSdkClientConfig', () => {
  it('prefers injected desktop env values when tauri forwards an app mode outside vite runtime mode', () => {
    const accessToken = createTestAccessToken({
      tenant_id: '100001',
      organization_id: '0',
      user_id: 'user-test',
    });
    globalThis.__SDKWORK_NOTES_ENV__ = {
      VITE_APP_ENV: 'test',
      VITE_SDKWORK_NOTES_APPLICATION_PUBLIC_HTTP_URL: 'https://api-test.sdkwork.com',
      VITE_APP_PLATFORM: 'desktop',
      SDKWORK_ACCESS_TOKEN: accessToken,
    };

    const config = createAppSdkClientConfig();

    expect(config.env).toBe('test');
    expect(config.baseUrl).toBe('https://api-test.sdkwork.com');
    expect(config.platform).toBe('desktop');
    expect(config.accessToken).toBe(accessToken);
    expect(config.tenantId).toBe('100001');
    expect(config.organizationId).toBe('0');
  });

  it('supports owner-scoped organization base urls with unified deployment access token', () => {
    const organizationAccessToken = createTestAccessToken({
      tenant_id: '100001',
      organization_id: '300001',
    });
    globalThis.__SDKWORK_NOTES_ENV__ = {
      VITE_APP_ENV: 'development',
      VITE_OWNER_MODE: 'organization',
      VITE_SDKWORK_NOTES_APPLICATION_PUBLIC_HTTP_URL: 'https://api-root.sdkwork.com',
      VITE_ORGANIZATION_API_BASE_URL: 'https://api-org.sdkwork.com/',
      SDKWORK_ACCESS_TOKEN: organizationAccessToken,
      VITE_PLATFORM: 'desktop',
    };

    const config = createAppSdkClientConfig();

    expect(config.env).toBe('development');
    expect(config.baseUrl).toBe('https://api-org.sdkwork.com');
    expect(config.accessToken).toBe(organizationAccessToken);
    expect(config.platform).toBe('desktop');
  });

  it('falls back to topology-aligned base urls when no explicit env url is provided', () => {
    globalThis.__SDKWORK_NOTES_ENV__ = {
      VITE_APP_ENV: 'test',
      VITE_APP_PLATFORM: 'desktop',
    };

    const testConfig = createAppSdkClientConfig();

    expect(testConfig.env).toBe('test');
    expect(testConfig.baseUrl).toBe('https://api-test.sdkwork.com');
    expect(testConfig.accessToken).toBeUndefined();

    globalThis.__SDKWORK_NOTES_ENV__ = {
      VITE_APP_ENV: 'development',
      VITE_APP_PLATFORM: 'desktop',
    };

    const developmentConfig = createAppSdkClientConfig();

    expect(developmentConfig.env).toBe('development');
    expect(developmentConfig.baseUrl).toBe('https://api-dev.sdkwork.com');
    expect(developmentConfig.accessToken).toBeUndefined();

    globalThis.__SDKWORK_NOTES_ENV__ = {
      VITE_APP_ENV: 'production',
      VITE_APP_PLATFORM: 'desktop',
    };

    const productionConfig = createAppSdkClientConfig();

    expect(productionConfig.baseUrl).toBe('https://notes.sdkwork.com');
  });

  it('rejects forbidden browser credential env keys from injected desktop env', () => {
    globalThis.__SDKWORK_NOTES_ENV__ = {
      VITE_APP_ENV: 'development',
      VITE_APP_PLATFORM: 'desktop',
      VITE_ACCESS_TOKEN: 'browser-access-token',
    };

    expect(() => createAppSdkClientConfig()).toThrow(/Forbidden credential environment variables/);
  });

  it('freezes runtime governance with explicit owner mode and source precedence metadata', () => {
    globalThis.__SDKWORK_NOTES_ENV__ = {
      VITE_APP_ENV: 'test',
      VITE_APP_OWNER_MODE: 'tenant',
      VITE_APP_PLATFORM: 'desktop',
    };

    const runtimeContext = resolveAppSdkRuntimeContext();

    expect(runtimeContext.env).toBe('test');
    expect(runtimeContext.ownerMode).toBe('tenant');
    expect(runtimeContext.platform).toBe('desktop');
    expect(runtimeContext.sourcePriority).toEqual([
      '__SDKWORK_NOTES_ENV__',
      'import.meta.env',
      'process.env',
    ]);
  });

  it('ignores legacy auth storage keys because notes only uses the shared auth session contract', () => {
    globalThis.localStorage.setItem('sdkwork_token', 'legacy-auth-token');
    globalThis.localStorage.setItem('sdkwork_access_token', 'legacy-access-token');
    globalThis.localStorage.setItem('sdkwork_refresh_token', 'legacy-refresh-token');

    expect(readAppSdkSessionTokens()).toEqual({
      authToken: undefined,
      accessToken: undefined,
      refreshToken: undefined,
    });
  });

  it('migrates notes session secrets out of localStorage into the controlled session store', () => {
    globalThis.localStorage.setItem('sdkwork-notes-auth-session', JSON.stringify({
      authToken: 'stored-auth-token',
      accessToken: 'stored-access-token',
      refreshToken: 'stored-refresh-token',
    }));
    globalThis.localStorage.setItem('sdkwork.core.pc-react.auth-token', 'stored-auth-token');
    globalThis.localStorage.setItem('sdkwork.core.pc-react.access-token', 'stored-access-token');
    globalThis.localStorage.setItem('sdkwork.core.pc-react.refresh-token', 'stored-refresh-token');

    expect(readAppSdkSessionTokens()).toEqual({
      authToken: 'stored-auth-token',
      accessToken: 'stored-access-token',
      refreshToken: 'stored-refresh-token',
    });
    expect(globalThis.localStorage.getItem('sdkwork-notes-auth-session')).toBeNull();
    expect(globalThis.localStorage.getItem('sdkwork.core.pc-react.auth-token')).toBeNull();
    expect(globalThis.localStorage.getItem('sdkwork.core.pc-react.access-token')).toBeNull();
    expect(globalThis.localStorage.getItem('sdkwork.core.pc-react.refresh-token')).toBeNull();
    expect(globalThis.sessionStorage.getItem('sdkwork-notes-auth-session')).toContain('stored-refresh-token');
  });

  it('allows a platform session adapter to control persistence without exposing secrets to browser localStorage', () => {
    const adapterState = {
      value: null as { authToken?: string; accessToken?: string; refreshToken?: string } | null,
    };

    configureAppSdkSessionStoreAdapter({
      clear() {
        adapterState.value = null;
      },
      kind: 'test-adapter',
      read() {
        return adapterState.value;
      },
      write(session: AppSdkSessionTokens) {
        adapterState.value = session;
      },
    });

    persistAppSdkSessionTokens({
      authToken: 'adapter-auth-token',
      accessToken: 'adapter-access-token',
      refreshToken: 'adapter-refresh-token',
    });

    expect(readAppSdkSessionTokens()).toEqual({
      authToken: 'adapter-auth-token',
      accessToken: 'adapter-access-token',
      refreshToken: 'adapter-refresh-token',
    });
    expect(globalThis.localStorage.getItem('sdkwork-notes-auth-session')).toBeNull();

    clearAppSdkSessionTokens();

    expect(adapterState.value).toBeNull();
  });
});
