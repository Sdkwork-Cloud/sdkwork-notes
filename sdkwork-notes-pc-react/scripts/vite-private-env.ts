export const SDKWORK_VITE_PRIVATE_ENV_DEFINE_KEYS = {
  accessToken: 'process.env.SDKWORK_ACCESS_TOKEN',
  apiBaseUrl: 'process.env.SDKWORK_API_BASE_URL',
  timeout: 'process.env.SDKWORK_TIMEOUT',
  platform: 'process.env.SDKWORK_PLATFORM',
} as const;

export function buildSdkworkVitePrivateEnvDefine(
  env: Record<string, string | undefined>,
): Record<string, string> {
  return {
    [SDKWORK_VITE_PRIVATE_ENV_DEFINE_KEYS.accessToken]: JSON.stringify(env.SDKWORK_ACCESS_TOKEN ?? ''),
    [SDKWORK_VITE_PRIVATE_ENV_DEFINE_KEYS.apiBaseUrl]: JSON.stringify(env.SDKWORK_API_BASE_URL ?? ''),
    [SDKWORK_VITE_PRIVATE_ENV_DEFINE_KEYS.timeout]: JSON.stringify(env.SDKWORK_TIMEOUT ?? ''),
    [SDKWORK_VITE_PRIVATE_ENV_DEFINE_KEYS.platform]: JSON.stringify(env.SDKWORK_PLATFORM ?? ''),
  };
}

const FORBIDDEN_CREDENTIAL_ENV_KEY_PATTERN =
  /^(?:SDKWORK_[A-Z0-9_]+_ACCESS_TOKEN|SDKWORK_(?:AUTH|REFRESH)_TOKEN|SDKWORK(?:_[A-Z0-9_]+)?_API_KEY|VITE_(?:[A-Z0-9_]*_)?(?:ACCESS|AUTH|REFRESH|API)_TOKEN|VITE_(?:[A-Z0-9_]+_)?API_KEY|VITE_[A-Z0-9_]*SECRET[A-Z0-9_]*|PORTAL_PUBLIC_.*(?:TOKEN|API_KEY))$/iu;

export function stripForbiddenCredentialEnvEntries<T extends Record<string, unknown>>(
  env: T,
): T {
  return Object.fromEntries(
    Object.entries(env).filter(([key]) => !FORBIDDEN_CREDENTIAL_ENV_KEY_PATTERN.test(key)),
  ) as T;
}
