import { isBlank, trim } from '@sdkwork/utils';
import { normalizeString } from '@sdkwork/notes-pc-commons';

export const SDKWORK_ACCESS_TOKEN_ENV_KEY = 'SDKWORK_ACCESS_TOKEN';

const FORBIDDEN_CREDENTIAL_ENV_KEY_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  reason: string;
}> = [
  {
    pattern: /^SDKWORK_[A-Z0-9_]+_ACCESS_TOKEN$/u,
    reason: 'use unified SDKWORK_ACCESS_TOKEN without app prefix',
  },
  {
    pattern: /^SDKWORK_.*_AUTH_TOKEN$/u,
    reason: 'auth tokens must come from login, not environment variables',
  },
  {
    pattern: /^SDKWORK_AUTH_TOKEN$/u,
    reason: 'auth tokens must come from login, not environment variables',
  },
  {
    pattern: /^SDKWORK_.*_REFRESH_TOKEN$/u,
    reason: 'refresh tokens must not be configured in environment variables',
  },
  {
    pattern: /^SDKWORK_REFRESH_TOKEN$/u,
    reason: 'refresh tokens must not be configured in environment variables',
  },
  {
    pattern: /^SDKWORK_.*_API_KEY$/u,
    reason: 'API keys must not be configured in environment variables',
  },
  {
    pattern: /^SDKWORK_API_KEY$/u,
    reason: 'API keys must not be configured in environment variables',
  },
  {
    pattern: /^VITE_.*TOKEN$/iu,
    reason: 'browser-visible token environment variables are forbidden',
  },
  {
    pattern: /^VITE_API_KEY$/iu,
    reason: 'browser-visible API key environment variables are forbidden',
  },
  {
    pattern: /^PORTAL_PUBLIC_.*TOKEN$/iu,
    reason: 'public runtime token environment variables are forbidden',
  },
  {
    pattern: /^PORTAL_PUBLIC_.*API_KEY$/iu,
    reason: 'public runtime API key environment variables are forbidden',
  },
];

function hasNonEmptyEnvValue(value: unknown): boolean {
  return typeof value === 'string' && !isBlank(value);
}

export function listForbiddenCredentialEnvViolations(
  source: Record<string, unknown>,
): Array<{ key: string; reason: string }> {
  const violations: Array<{ key: string; reason: string }> = [];

  for (const [key, value] of Object.entries(source)) {
    if (!hasNonEmptyEnvValue(value)) {
      continue;
    }

    for (const { pattern, reason } of FORBIDDEN_CREDENTIAL_ENV_KEY_PATTERNS) {
      if (pattern.test(key)) {
        violations.push({ key, reason });
        break;
      }
    }
  }

  return violations;
}

export function assertNoForbiddenCredentialEnv(source: Record<string, unknown>): void {
  const violations = listForbiddenCredentialEnvViolations(source);
  if (violations.length === 0) {
    return;
  }

  const details = violations
    .map((violation) => `${violation.key} (${violation.reason})`)
    .join('; ');
  throw new Error(`Forbidden credential environment variables: ${details}`);
}

function normalizeBearerToken(value: unknown): string {
  const normalized = normalizeString(value);
  if (isBlank(normalized)) {
    return '';
  }

  return trim(normalized.replace(/^Bearer\s+/i, ''));
}

export function resolveSdkworkAccessTokenFromEnv(source: Record<string, unknown>): string {
  return normalizeBearerToken(source[SDKWORK_ACCESS_TOKEN_ENV_KEY]);
}
