import { startTransition, useEffect, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import * as QRCode from 'qrcode';
import {
  ArrowRight,
  Chrome,
  Github,
  LoaderCircle,
  Lock,
  Mail,
  MessageCircle,
  Music2,
  QrCode,
  RefreshCw,
  Smartphone,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@sdkwork/notes-commons';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import {
  appAuthService,
  type AppAuthLoginQrCode,
  type AppAuthSocialProvider,
  useAuthStore,
} from '@sdkwork/notes-core';
import { buildOAuthCallbackUri, resolveRedirectTarget } from './authRouteUtils';

type AuthMode = 'login' | 'register' | 'forgot';
type QrPanelState = 'idle' | 'loading' | 'pending' | 'scanned' | 'confirmed' | 'expired' | 'error';

const QR_POLL_INTERVAL_MS = 2_000;

function resolveAuthMode(pathname: string): AuthMode {
  if (pathname === '/register') {
    return 'register';
  }

  if (pathname === '/forgot-password') {
    return 'forgot';
  }

  return 'login';
}

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function ProviderGlyph({ provider }: { provider: AppAuthSocialProvider }) {
  if (provider === 'github') {
    return <Github className="h-5 w-5" />;
  }

  if (provider === 'google') {
    return <Chrome className="h-5 w-5" />;
  }

  if (provider === 'wechat') {
    return <MessageCircle className="h-5 w-5" />;
  }

  return <Music2 className="h-5 w-5" />;
}

function resolveQrStatusCopy(t: (key: string) => string, state: QrPanelState) {
  if (state === 'loading') {
    return t('auth.qrStatus.loading');
  }
  if (state === 'scanned') {
    return t('auth.qrStatus.scanned');
  }
  if (state === 'confirmed') {
    return t('auth.qrStatus.confirmed');
  }
  if (state === 'expired') {
    return t('auth.qrStatus.expired');
  }
  if (state === 'error') {
    return t('auth.qrStatus.error');
  }
  return t('auth.qrStatus.pending');
}

function resolveQrStatusAccent(state: QrPanelState) {
  if (state === 'scanned') {
    return 'text-amber-500';
  }
  if (state === 'confirmed') {
    return 'text-emerald-500';
  }
  if (state === 'expired' || state === 'error') {
    return 'text-rose-500';
  }
  return 'text-[var(--text-secondary)]';
}

const SOCIAL_PROVIDERS: AppAuthSocialProvider[] = ['wechat', 'douyin', 'github', 'google'];

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">{children}</label>;
}

function FieldInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-primary-400 focus:bg-white ${props.className || ''}`}
    />
  );
}

export function AuthPage() {
  const { t } = useNotesTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, signIn, register, sendPasswordReset, applySession } = useAuthStore();
  const mode = resolveAuthMode(location.pathname);
  const redirectTarget = resolveRedirectTarget(searchParams.get('redirect'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOAuthProvider, setActiveOAuthProvider] = useState<AppAuthSocialProvider | null>(null);
  const [qrState, setQrState] = useState<QrPanelState>('idle');
  const [qrCode, setQrCode] = useState<AppAuthLoginQrCode | null>(null);
  const [qrImageSrc, setQrImageSrc] = useState('');
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const [qrReloadNonce, setQrReloadNonce] = useState(0);

  useEffect(() => {
    const nextEmail = searchParams.get('email');
    if (nextEmail) {
      setEmail(nextEmail);
    }
  }, [searchParams]);

  useEffect(() => {
    if (mode !== 'login') {
      setQrState('idle');
      setQrCode(null);
      setQrImageSrc('');
      setQrErrorMessage('');
      return;
    }

    let disposed = false;
    let pollTimer: number | null = null;

    const clearPollTimer = () => {
      if (pollTimer !== null) {
        window.clearTimeout(pollTimer);
        pollTimer = null;
      }
    };

    const schedulePoll = (qrKey: string, delayMs = QR_POLL_INTERVAL_MS) => {
      clearPollTimer();
      pollTimer = window.setTimeout(() => {
        void pollStatus(qrKey);
      }, delayMs);
    };

    const pollStatus = async (qrKey: string) => {
      try {
        const statusResult = await appAuthService.checkLoginQrCodeStatus(qrKey);
        if (disposed) {
          return;
        }

        if (statusResult.status === 'confirmed' && statusResult.session) {
          setQrState('confirmed');
          applySession(statusResult.session);
          startTransition(() => {
            navigate(redirectTarget, { replace: true });
          });
          return;
        }

        setQrState(statusResult.status);

        if (statusResult.status === 'expired') {
          clearPollTimer();
          return;
        }

        schedulePoll(qrKey);
      } catch (error) {
        if (disposed) {
          return;
        }
        setQrState('error');
        setQrErrorMessage(readErrorMessage(error, t('auth.errors.qrStatusFailed')));
        clearPollTimer();
      }
    };

    const loadQrCode = async () => {
      setQrState('loading');
      setQrCode(null);
      setQrImageSrc('');
      setQrErrorMessage('');

      try {
        const nextQrCode = await appAuthService.generateLoginQrCode();
        if (disposed) {
          return;
        }

        let nextImageSrc = '';
        if (nextQrCode.qrUrl) {
          nextImageSrc = nextQrCode.qrUrl;
        } else if (nextQrCode.qrContent) {
          nextImageSrc = await QRCode.toDataURL(nextQrCode.qrContent, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 320,
            color: {
              dark: '#111827',
              light: '#ffffff',
            },
          });
        } else {
          throw new Error(t('auth.errors.invalidQrPayload'));
        }

        if (disposed) {
          return;
        }

        setQrCode(nextQrCode);
        setQrImageSrc(nextImageSrc);
        setQrState('pending');
        schedulePoll(nextQrCode.qrKey);
      } catch (error) {
        if (disposed) {
          return;
        }
        setQrState('error');
        setQrErrorMessage(readErrorMessage(error, t('auth.errors.qrGenerateFailed')));
      }
    };

    void loadQrCode();

    return () => {
      disposed = true;
      clearPollTimer();
    };
  }, [applySession, mode, navigate, qrReloadNonce, redirectTarget, t]);

  const withRedirect = (pathname: string) => {
    const [basePath, rawQuery = ''] = pathname.split('?');
    const params = new URLSearchParams(rawQuery);
    if (redirectTarget !== '/notes') {
      params.set('redirect', redirectTarget);
    }

    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await signIn({ email, password });
        startTransition(() => {
          navigate(redirectTarget, { replace: true });
        });
        return;
      }

      if (mode === 'register') {
        await register({ name, email, password });
        startTransition(() => {
          navigate(redirectTarget, { replace: true });
        });
        return;
      }

      await sendPasswordReset(email);
      startTransition(() => {
        navigate(withRedirect(`/login?email=${encodeURIComponent(email.trim())}`), {
          replace: true,
        });
      });
    } catch (error) {
      toast.error(
        readErrorMessage(
          error,
          mode === 'forgot' ? t('auth.errors.passwordResetFailed') : t('auth.errors.signInFailed'),
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = async (provider: AppAuthSocialProvider) => {
    if (activeOAuthProvider) {
      return;
    }

    setActiveOAuthProvider(provider);
    try {
      const authUrl = await appAuthService.getOAuthAuthorizationUrl({
        provider,
        redirectUri: buildOAuthCallbackUri(provider, redirectTarget),
        state: redirectTarget !== '/notes' ? redirectTarget : undefined,
      });
      window.location.assign(authUrl);
    } catch (error) {
      setActiveOAuthProvider(null);
      toast.error(readErrorMessage(error, t('auth.errors.oauthStartFailed')));
    }
  };

  if (isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="panel-surface relative z-10 flex w-full max-w-5xl overflow-hidden rounded-[32px]">
        <div className="relative hidden w-[42%] overflow-hidden bg-[var(--theme-primary-950)] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(90,139,255,0.26),_transparent_58%)]" />

          <div className="relative z-10 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/12 backdrop-blur-sm">
              <QrCode className="h-8 w-8" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tight">{t('auth.qrLogin')}</h2>
              <p className="max-w-xs text-sm leading-7 text-white/74">
                {qrCode?.description || t('auth.qrDesc')}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-8">
            <div className="rounded-[28px] bg-white/92 p-4 text-zinc-900 shadow-2xl">
              <div className="relative overflow-hidden rounded-2xl bg-white">
                {qrImageSrc ? (
                  <img
                    src={qrImageSrc}
                    alt={t('auth.qrAlt')}
                    className={`h-60 w-full object-contain transition-opacity ${
                      qrState === 'expired' || qrState === 'error' ? 'opacity-40' : 'opacity-100'
                    }`}
                  />
                ) : (
                  <div className="flex h-60 items-center justify-center bg-zinc-100">
                    <LoaderCircle className="h-8 w-8 animate-spin text-zinc-400" />
                  </div>
                )}

                {qrState === 'expired' || qrState === 'error' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/10">
                    <Button
                      type="button"
                      onClick={() => setQrReloadNonce((value) => value + 1)}
                      appearance="primary"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {t('auth.qrRefresh')}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={`mt-5 text-sm font-semibold ${resolveQrStatusAccent(qrState)}`}>
              {resolveQrStatusCopy(t, qrState)}
            </div>
            <p className="mt-2 text-sm leading-6 text-white/72">
              {qrState === 'error'
                ? qrErrorMessage
                : qrState === 'scanned'
                  ? t('auth.qrScannedHint')
                  : t('auth.openApp')}
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-white/58">
              <Smartphone className="h-4 w-4" />
              <span>{t('auth.qrWeChatHint')}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <div className="inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                SDKWork Notes
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)]">
                {mode === 'login'
                  ? t('auth.welcomeBack')
                  : mode === 'register'
                    ? t('auth.createAccount')
                    : t('auth.resetPassword')}
              </h1>
              <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                {mode === 'login'
                  ? t('auth.loginDesc')
                  : mode === 'register'
                    ? t('auth.registerDesc')
                    : t('auth.resetDesc')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'register' ? (
                <div>
                  <FieldLabel>{t('auth.name')}</FieldLabel>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                    <FieldInput
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="pl-12"
                      placeholder={t('auth.placeholders.name')}
                      required
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <FieldLabel>{t('auth.email')}</FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                  <FieldInput
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-12"
                    placeholder={t('auth.placeholders.email')}
                    required
                  />
                </div>
              </div>

              {mode !== 'forgot' ? (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <FieldLabel>{t('auth.password')}</FieldLabel>
                    {mode === 'login' ? (
                      <button
                        type="button"
                        onClick={() => navigate(withRedirect('/forgot-password'))}
                        className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-500"
                      >
                        {t('auth.forgotPassword')}
                      </button>
                    ) : null}
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                    <FieldInput
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-12"
                      placeholder={t('auth.placeholders.password')}
                      required
                    />
                  </div>
                </div>
              ) : null}

              <Button
                type="submit"
                appearance="primary"
                disabled={isSubmitting}
                className="h-auto w-full py-3 font-bold"
              >
                {isSubmitting
                  ? t('common.loading')
                  : mode === 'login'
                    ? t('auth.signIn')
                    : mode === 'register'
                      ? t('auth.signUp')
                      : t('auth.sendResetLink')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {mode === 'login' ? (
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--line-soft)]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-[var(--panel-bg)] px-3 text-[var(--text-muted)]">
                      {t('auth.continueWith')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {SOCIAL_PROVIDERS.map((provider) => {
                    const isBusy = activeOAuthProvider === provider;
                    return (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => {
                          void handleSocialSignIn(provider);
                        }}
                        disabled={Boolean(activeOAuthProvider)}
                        className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-bg)] px-4 py-3 text-left shadow-sm transition hover:bg-[var(--panel-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]">
                          <ProviderGlyph provider={provider} />
                          {t(`auth.providers.${provider}`)}
                        </span>
                        {isBusy ? (
                          <LoaderCircle className="h-4 w-4 animate-spin text-primary-500" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
              {mode === 'login' ? (
                <>
                  {t('auth.noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => navigate(withRedirect('/register'))}
                    className="font-bold text-primary-600 transition-colors hover:text-primary-500"
                  >
                    {t('auth.signUp')}
                  </button>
                </>
              ) : mode === 'register' ? (
                <>
                  {t('auth.hasAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => navigate(withRedirect('/login'))}
                    className="font-bold text-primary-600 transition-colors hover:text-primary-500"
                  >
                    {t('auth.signIn')}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(withRedirect('/login'))}
                  className="mx-auto flex items-center justify-center gap-1 font-bold text-primary-600 transition-colors hover:text-primary-500"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  {t('auth.backToLogin')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
