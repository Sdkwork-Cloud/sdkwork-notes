import { useMemo } from 'react';
import {
  createClient,
  type SdkworkAppClient,
  type SdkworkAppConfig,
} from '@sdkwork/app-sdk';

export type AppRuntimeEnv = 'development' | 'test' | 'production';

export interface AppSdkClientConfig extends SdkworkAppConfig {
  env: AppRuntimeEnv;
}

export interface AppSdkSessionTokens {
  authToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_DEV_BASE_URL = 'http://127.0.0.1:18080';
const DEFAULT_TEST_BASE_URL = 'http://127.0.0.1:18080';
const DEFAULT_PROD_BASE_URL = 'https://api.sdkwork.com';

export const APP_SDK_SESSION_STORAGE_KEY = 'sdkwork-notes-auth-session';

let appSdkClient: SdkworkAppClient | null = null;
let appSdkConfig: AppSdkClientConfig | null = null;

function readEnv(name: string): string | undefined {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return env?.[name];
}

function firstDefined(...values: Array<string | undefined>) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
}

function getStorage(): Storage | null {
  if (typeof globalThis.localStorage !== 'undefined') {
    return globalThis.localStorage;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return null;
}

function readStorage(key: string): string | undefined {
  const storage = getStorage();
  if (!storage) {
    return undefined;
  }

  try {
    return storage.getItem(key) || undefined;
  } catch {
    return undefined;
  }
}

function writeStorage(key: string, value?: string) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    if (value && value.trim()) {
      storage.setItem(key, value.trim());
      return;
    }

    storage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

function removeStorage(key: string) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

function normalizeAuthToken(value?: string) {
  const normalized = (value || '').trim();
  if (!normalized) {
    return '';
  }

  if (normalized.toLowerCase().startsWith('bearer ')) {
    return normalized.slice(7).trim();
  }

  return normalized;
}

function resolveRuntimeEnv(): AppRuntimeEnv {
  const env = firstDefined(readEnv('VITE_APP_ENV'), readEnv('MODE'), readEnv('NODE_ENV'))?.toLowerCase();
  if (env === 'production') {
    return 'production';
  }
  if (env === 'test') {
    return 'test';
  }
  return 'development';
}

function resolveDefaultBaseUrl(env: AppRuntimeEnv) {
  if (env === 'production') {
    return DEFAULT_PROD_BASE_URL;
  }
  if (env === 'test') {
    return DEFAULT_TEST_BASE_URL;
  }
  return DEFAULT_DEV_BASE_URL;
}

function normalizeBaseUrl(baseUrl?: string, env: AppRuntimeEnv = 'development') {
  const safe = (baseUrl || resolveDefaultBaseUrl(env)).trim();
  return safe.replace(/\/+$/g, '');
}

function readPersistedSession(): Pick<AppSdkSessionTokens, 'authToken' | 'refreshToken'> {
  const rawValue = readStorage(APP_SDK_SESSION_STORAGE_KEY);
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AppSdkSessionTokens>;
    return {
      authToken: normalizeAuthToken(parsed.authToken),
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken.trim() : undefined,
    };
  } catch {
    return {};
  }
}

function writePersistedSession(tokens: Pick<AppSdkSessionTokens, 'authToken' | 'refreshToken'>) {
  const authToken = normalizeAuthToken(tokens.authToken);
  const refreshToken = (tokens.refreshToken || '').trim();

  if (!authToken) {
    removeStorage(APP_SDK_SESSION_STORAGE_KEY);
    return;
  }

  writeStorage(
    APP_SDK_SESSION_STORAGE_KEY,
    JSON.stringify({
      authToken,
      refreshToken: refreshToken || undefined,
    }),
  );
}

function applySessionTokensToClient(client: SdkworkAppClient, tokens: AppSdkSessionTokens) {
  client.setAuthToken(normalizeAuthToken(tokens.authToken));
  client.setAccessToken((tokens.accessToken ?? resolveAppSdkAccessToken()).trim());
}

export function createAppSdkClientConfig(
  overrides: Partial<SdkworkAppConfig> = {},
): AppSdkClientConfig {
  const env = resolveRuntimeEnv();

  return {
    env,
    baseUrl: normalizeBaseUrl(
      firstDefined(overrides.baseUrl, readEnv('VITE_APP_API_BASE_URL'), readEnv('VITE_API_BASE_URL')),
      env,
    ),
    timeout: overrides.timeout ?? DEFAULT_TIMEOUT,
    apiKey: overrides.apiKey ?? firstDefined(readEnv('VITE_API_KEY')),
    authToken: overrides.authToken,
    accessToken: overrides.accessToken ?? firstDefined(readEnv('VITE_APP_ACCESS_TOKEN'), readEnv('VITE_ACCESS_TOKEN')),
    tenantId: overrides.tenantId ?? firstDefined(readEnv('VITE_TENANT_ID')),
    organizationId: overrides.organizationId ?? firstDefined(readEnv('VITE_ORGANIZATION_ID')),
    platform: overrides.platform ?? firstDefined(readEnv('VITE_APP_PLATFORM')) ?? 'web',
    tokenManager: overrides.tokenManager,
    authMode: overrides.authMode,
    headers: overrides.headers,
  };
}

export function initAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}) {
  appSdkConfig = createAppSdkClientConfig(overrides);
  appSdkClient = createClient(appSdkConfig);
  return appSdkClient;
}

export function getAppSdkClient() {
  if (!appSdkClient) {
    return initAppSdkClient();
  }

  return appSdkClient;
}

export function getAppSdkClientConfig() {
  return appSdkConfig;
}

export function resolveAppSdkAccessToken() {
  return (firstDefined(getAppSdkClientConfig()?.accessToken, readEnv('VITE_APP_ACCESS_TOKEN'), readEnv('VITE_ACCESS_TOKEN')) || '').trim();
}

export function resetAppSdkClient() {
  appSdkClient = null;
  appSdkConfig = null;
}

export function applyAppSdkSessionTokens(tokens: AppSdkSessionTokens) {
  const client = getAppSdkClient();
  applySessionTokensToClient(client, tokens);
}

export function readAppSdkSessionTokens(): AppSdkSessionTokens {
  const stored = readPersistedSession();
  const accessToken = resolveAppSdkAccessToken();

  return {
    authToken: stored.authToken || undefined,
    accessToken: accessToken || undefined,
    refreshToken: stored.refreshToken || undefined,
  };
}

export function persistAppSdkSessionTokens(tokens: AppSdkSessionTokens) {
  const authToken = normalizeAuthToken(tokens.authToken);
  const refreshToken = (tokens.refreshToken || '').trim();
  const accessToken = (tokens.accessToken ?? resolveAppSdkAccessToken()).trim();

  writePersistedSession({
    authToken,
    refreshToken: refreshToken || undefined,
  });

  applyAppSdkSessionTokens({
    authToken,
    accessToken,
    refreshToken,
  });
}

export function clearAppSdkSessionTokens() {
  removeStorage(APP_SDK_SESSION_STORAGE_KEY);
  const configuredAccessToken = resolveAppSdkAccessToken();
  if (appSdkClient) {
    applySessionTokensToClient(appSdkClient, {
      authToken: '',
      accessToken: configuredAccessToken,
    });
  }
  resetAppSdkClient();
}

function createScopedAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}) {
  const config = createAppSdkClientConfig(overrides);
  const client = createClient(config);
  applySessionTokensToClient(client, readAppSdkSessionTokens());
  return client;
}

export function getAppSdkClientWithSession(
  overrides: Partial<SdkworkAppConfig> = {},
) {
  if (Object.keys(overrides).length > 0) {
    return createScopedAppSdkClient(overrides);
  }

  const client = getAppSdkClient();
  applySessionTokensToClient(client, readAppSdkSessionTokens());
  return client;
}

export function useAppSdkClient(overrides: Partial<SdkworkAppConfig> = {}) {
  const key = JSON.stringify(overrides || {});
  return useMemo(() => getAppSdkClientWithSession(overrides), [key]);
}
