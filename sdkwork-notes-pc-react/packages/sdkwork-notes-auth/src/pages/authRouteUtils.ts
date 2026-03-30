import type { AppAuthSocialProvider } from '@sdkwork/notes-core';

export function resolveRedirectTarget(rawTarget: string | null) {
  const target = (rawTarget || '').trim();

  if (!target || !target.startsWith('/')) {
    return '/notes';
  }

  if (target.startsWith('//') || target.startsWith('/\\')) {
    return '/notes';
  }

  if (
    target === '/auth' ||
    target === '/login' ||
    target === '/register' ||
    target === '/forgot-password' ||
    target.startsWith('/login/oauth/callback')
  ) {
    return '/notes';
  }

  return target;
}

export function buildOAuthCallbackUri(
  provider: AppAuthSocialProvider,
  redirectTarget: string,
) {
  if (typeof window === 'undefined' || !window.location?.origin) {
    throw new Error('OAuth callback URL is unavailable in the current runtime.');
  }

  const callbackUrl = new URL(`/login/oauth/callback/${provider}`, window.location.origin);
  if (redirectTarget !== '/notes') {
    callbackUrl.searchParams.set('redirect', redirectTarget);
  }
  return callbackUrl.toString();
}
