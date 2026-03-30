export const SHARED_SDK_MODE_ENV_VAR: string;

export function resolveSharedSdkMode(
  env?: NodeJS.ProcessEnv,
): 'source' | 'git';

export function isSharedSdkSourceMode(
  env?: NodeJS.ProcessEnv,
): boolean;

export function resolvePnpmPackageDistEntry(
  packageName: string,
  workspaceRootDir: string,
): string | null;
