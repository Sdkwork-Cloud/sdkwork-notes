import { describe, expect, it } from 'vitest';
import { resolveRedirectTarget } from './authRouteUtils';

describe('authRouteUtils', () => {
  it('falls back to notes for missing or public auth routes', () => {
    expect(resolveRedirectTarget(null)).toBe('/notes');
    expect(resolveRedirectTarget('/login')).toBe('/notes');
    expect(resolveRedirectTarget('/register')).toBe('/notes');
    expect(resolveRedirectTarget('/forgot-password')).toBe('/notes');
    expect(resolveRedirectTarget('/login/oauth/callback/github')).toBe('/notes');
  });

  it('rejects protocol-relative and malformed external redirect targets', () => {
    expect(resolveRedirectTarget('//evil.example/path')).toBe('/notes');
    expect(resolveRedirectTarget('/\\evil.example/path')).toBe('/notes');
  });

  it('keeps valid in-app redirect targets', () => {
    expect(resolveRedirectTarget('/notes?view=favorites')).toBe('/notes?view=favorites');
    expect(resolveRedirectTarget('/account')).toBe('/account');
  });
});
