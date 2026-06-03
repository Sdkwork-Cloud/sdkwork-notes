import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type AppSdkSessionTokens,
  clearAppSdkSessionTokens,
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

describe('createAppSdkClientConfig', () => {
  it('prefers injected desktop env values when tauri forwards an app mode outside vite runtime mode', () => {
    globalThis.__SDKWORK_NOTES_ENV__ = {
      VITE_APP_ENV: 'test',
      VITE_APP_API_BASE_URL: 'https://api-test.sdkwork.com',
      VITE_APP_PLATFORM: 'desktop',
      VITE_ACCESS_TOKEN: '',
      VITE_TENANT_ID: 'tenant-test',
      VITE_ORGANIZATION_ID: 'org-test',
    };

    const config = createAppSdkClientConfig();

    expect(config.env).toBe('test');
    expect(config.baseUrl).toBe('https://api-test.sdkwork.com');
    expect(config.platform).toBe('desktop');
    expect(config.accessToken).toBeUndefined();
    expect(config.tenantId).toBe('tenant-test');
    expect(config.organizationId).toBe('org-test');
  });

  it('supports owner-scoped organization base urls and access tokens from injected desktop env', () => {
    globalThis.__SDKWORK_NOTES_ENV__ = {
      VITE_APP_ENV: 'development',
      VITE_OWNER_MODE: 'organization',
      VITE_API_BASE_URL: 'https://api-root.sdkwork.com',
      VITE_ORGANIZATION_API_BASE_URL: 'https://api-org.sdkwork.com/',
      VITE_ACCESS_TOKEN: 'root-access-token',
      VITE_ORGANIZATION_ACCESS_TOKEN: 'organization-access-token',
      VITE_PLATFORM: 'desktop',
    };

    const config = createAppSdkClientConfig();

    expect(config.env).toBe('development');
    expect(config.baseUrl).toBe('https://api-org.sdkwork.com');
    expect(config.accessToken).toBe('organization-access-token');
    expect(config.platform).toBe('desktop');
  });

  it('falls back to claw-studio aligned base urls when no explicit env url is provided', () => {
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
  });

  it('normalizes injected desktop env primitives into string values before building the sdk config', () => {
    globalThis.__SDKWORK_NOTES_ENV__ = {
      VITE_APP_ENV: 'development',
      VITE_APP_PLATFORM: 'desktop',
      VITE_ACCESS_TOKEN: true,
      VITE_TENANT_ID: 42,
    };

    const config = createAppSdkClientConfig();

    expect(config.env).toBe('development');
    expect(config.platform).toBe('desktop');
    expect(config.accessToken).toBe('true');
    expect(config.tenantId).toBe('42');
  });

  it('freezes runtime governance with explicit owner mode and source precedence metadata', () => {
    globalThis.__SDKWORK_NOTES_ENV__ = {
      VITE_APP_ENV: 'test',
      VITE_APP_OWNER_MODE: 'tenant',
      VITE_APP_PLATFORM: 'desktop',
      VITE_TENANT_ID: 'tenant-test',
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
