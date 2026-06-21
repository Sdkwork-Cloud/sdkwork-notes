import { isBlank, trim } from '@sdkwork/utils';

function normalizeBearerToken(value?: string): string {
  const normalized = trim(value ?? '');
  if (isBlank(normalized)) {
    return '';
  }

  return trim(normalized.replace(/^Bearer\s+/i, ''));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJwtPayload(token: string): Record<string, unknown> | undefined {
  const normalizedToken = normalizeBearerToken(token);
  const parts = normalizedToken.split('.');
  if (parts.length < 2) {
    return undefined;
  }

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4 || 4)) % 4),
      '=',
    );
    const json = atob(padded);
    const parsed = JSON.parse(json) as unknown;
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function readJwtClaimString(
  claims: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = trim(String(claims[key] ?? ''));
    if (!isBlank(value)) {
      return value;
    }
  }

  return undefined;
}

function normalizeOrganizationClaim(value?: string): string | undefined {
  if (!value || value === '0') {
    return undefined;
  }

  return value;
}

export function resolveSessionIdentityClaims(session: {
  accessToken?: string;
  authToken?: string;
}): {
  tenantId?: string;
  organizationId?: string;
  userId?: string;
} {
  const accessClaims = session.accessToken ? parseJwtPayload(session.accessToken) : undefined;
  const authClaims = session.authToken ? parseJwtPayload(session.authToken) : undefined;

  const tenantId =
    readJwtClaimString(accessClaims ?? {}, 'tenant_id')
    || readJwtClaimString(authClaims ?? {}, 'tenant_id');
  const organizationId = normalizeOrganizationClaim(
    readJwtClaimString(accessClaims ?? {}, 'organization_id')
      || readJwtClaimString(authClaims ?? {}, 'organization_id'),
  );
  const userId =
    readJwtClaimString(accessClaims ?? {}, 'user_id', 'sub')
    || readJwtClaimString(authClaims ?? {}, 'user_id', 'sub');

  return {
    ...(tenantId ? { tenantId } : {}),
    ...(organizationId ? { organizationId } : {}),
    ...(userId ? { userId } : {}),
  };
}
