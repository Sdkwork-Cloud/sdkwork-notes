export const SHELL_DOMAIN_PACKAGES = [
  '@sdkwork/notes-auth',
  '@sdkwork/notes-notes',
  '@sdkwork/notes-user',
] as const;

export const SHELL_FOUNDATION_PACKAGES = [
  '@sdkwork/notes-core',
  '@sdkwork/notes-commons',
  '@sdkwork/notes-i18n',
  '@sdkwork/notes-types',
] as const;

export const FUTURE_CAPABILITY_PACKAGES = [
  '@sdkwork/notes-local',
  '@sdkwork/notes-search',
  '@sdkwork/notes-sync',
  '@sdkwork/notes-observability',
  '@sdkwork/notes-updater',
] as const;

export const PLATFORM_SHELL_PACKAGES = [
  '@sdkwork/notes-shell',
  '@sdkwork/notes-desktop',
] as const;

export const APP_PROVIDER_BOUNDARY = {
  authStore: '@sdkwork/notes-auth',
  appState: '@sdkwork/notes-core',
  themeManager: '@sdkwork/notes-shell',
  languageManager: '@sdkwork/notes-shell',
  router: '@sdkwork/notes-shell',
} as const;
