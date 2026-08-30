export const SHELL_DOMAIN_PACKAGES = [
  '@sdkwork/notes-pc-auth',
  '@sdkwork/notes-pc-notes',
  '@sdkwork/notes-pc-user',
] as const;

export const SHELL_FOUNDATION_PACKAGES = [
  '@sdkwork/notes-pc-core',
  '@sdkwork/notes-pc-commons',
  '@sdkwork/notes-pc-i18n',
  '@sdkwork/notes-pc-types-commons',
] as const;

export const FUTURE_CAPABILITY_PACKAGES = [
  '@sdkwork/notes-pc-local',
  '@sdkwork/notes-pc-search',
  '@sdkwork/notes-pc-sync-commons',
  '@sdkwork/notes-pc-observability',
  '@sdkwork/notes-pc-updater',
] as const;

export const PLATFORM_SHELL_PACKAGES = [
  '@sdkwork/notes-pc-shell',
  '@sdkwork/notes-pc-desktop',
] as const;

export const APP_PROVIDER_BOUNDARY = {
  authStore: '@sdkwork/notes-pc-auth',
  appState: '@sdkwork/notes-pc-core',
  themeManager: '@sdkwork/notes-pc-shell',
  languageManager: '@sdkwork/notes-pc-shell',
  router: '@sdkwork/notes-pc-shell',
} as const;
