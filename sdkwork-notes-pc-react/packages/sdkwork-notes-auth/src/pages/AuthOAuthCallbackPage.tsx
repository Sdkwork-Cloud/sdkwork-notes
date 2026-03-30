import { startTransition, useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@sdkwork/notes-commons';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import {
  useAuthStore,
  type AppAuthSocialProvider,
} from '@sdkwork/notes-core';
import { resolveRedirectTarget } from './authRouteUtils';

type CallbackState = 'loading' | 'error';

function isSocialProvider(value: string | undefined): value is AppAuthSocialProvider {
  return value === 'wechat' || value === 'douyin' || value === 'github' || value === 'google';
}

function buildLoginPath(redirectTarget: string) {
  if (redirectTarget === '/notes') {
    return '/login';
  }
  return `/login?redirect=${encodeURIComponent(redirectTarget)}`;
}

export function AuthOAuthCallbackPage() {
  const { t } = useNotesTranslation();
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const signInWithOAuth = useAuthStore((state) => state.signInWithOAuth);
  const redirectTarget = resolveRedirectTarget(searchParams.get('redirect'));
  const [callbackState, setCallbackState] = useState<CallbackState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isSocialProvider(provider)) {
      setCallbackState('error');
      setErrorMessage(t('auth.oauth.invalidProvider'));
      return;
    }

    const providerError =
      (searchParams.get('error_description') || searchParams.get('error') || '').trim();
    if (providerError) {
      setCallbackState('error');
      setErrorMessage(providerError);
      return;
    }

    const code = (searchParams.get('code') || '').trim();
    if (!code) {
      setCallbackState('error');
      setErrorMessage(t('auth.oauth.missingCode'));
      return;
    }

    let disposed = false;

    void (async () => {
      try {
        await signInWithOAuth({
          provider,
          code,
          state: (searchParams.get('state') || '').trim() || undefined,
          deviceType: 'web',
        });
        if (disposed) {
          return;
        }
        startTransition(() => {
          navigate(redirectTarget, { replace: true });
        });
      } catch (error) {
        if (disposed) {
          return;
        }
        const message =
          error instanceof Error && error.message
            ? error.message
            : t('auth.oauth.failed');
        toast.error(message);
        setCallbackState('error');
        setErrorMessage(message);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [navigate, provider, redirectTarget, searchParams, signInWithOAuth, t]);

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="panel-surface relative z-10 w-full max-w-lg overflow-hidden rounded-3xl">
        <div className="border-b border-[var(--line-soft)] bg-[var(--theme-primary-950)] px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600/90">
              {callbackState === 'loading' ? (
                <LoaderCircle className="h-6 w-6 animate-spin" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-200">
                {t('auth.oauth.badge')}
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-tight">
                {callbackState === 'loading'
                  ? t('auth.oauth.processingTitle')
                  : t('auth.oauth.failedTitle')}
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-8 py-8">
          {callbackState === 'loading' ? (
            <>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                {t('auth.oauth.processingDesc')}
              </p>
              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-muted)] p-4">
                <div className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                  <ShieldCheck className="h-5 w-5 text-primary-500" />
                  <span>{t('auth.oauth.processingHint')}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">{errorMessage}</p>
              <Button
                type="button"
                onClick={() => navigate(buildLoginPath(redirectTarget), { replace: true })}
                appearance="primary"
                className="h-auto w-full py-3 font-bold"
              >
                {t('auth.backToLogin')}
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
