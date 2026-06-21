import { isBlank, trim } from '@sdkwork/utils';

export function normalizeString(value: unknown): string {
  if (typeof value === 'string') {
    return trim(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

export function normalizeNullableString(value: unknown): string | null {
  const normalized = normalizeString(value);
  return isBlank(normalized) ? null : normalized;
}

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const values: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const normalized = normalizeString(item);
    if (isBlank(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    values.push(normalized);
  }

  return values;
}

export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && !isBlank(error.message)) {
    return error.message;
  }
  if (typeof error === 'string' && !isBlank(error)) {
    return error;
  }
  return fallback;
}
