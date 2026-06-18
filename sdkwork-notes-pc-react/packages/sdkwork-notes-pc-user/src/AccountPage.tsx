import { useEffect, useMemo, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import {
  Languages,
  LoaderCircle,
  LogOut,
  Mail,
  MoonStar,
  Palette,
  SunMedium,
  User,
  UserCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@sdkwork/notes-pc-auth';
import { Button, SurfaceCard } from '@sdkwork/notes-pc-commons';
import { useNotesTranslation } from '@sdkwork/notes-pc-i18n';
import { appUserService, useAppStore } from '@sdkwork/notes-pc-core';
import type { LanguagePreference, ThemeColor, ThemeMode } from '@sdkwork/notes-pc-types';

const themeModes: Array<{ value: ThemeMode; icon: typeof SunMedium }> = [
  { value: 'light', icon: SunMedium },
  { value: 'dark', icon: MoonStar },
  { value: 'system', icon: Palette },
];

const themeColors: ThemeColor[] = ['default', 'forest', 'amber', 'ink'];
const languages: LanguagePreference[] = ['zh-CN', 'en-US'];
const themeColorPreview: Record<ThemeColor, [string, string]> = {
  default: ['#5d8bff', '#1f53d7'],
  forest: ['#49aa71', '#186d41'],
  amber: ['#f5af1b', '#b77004'],
  ink: ['#8795d2', '#3f4984'],
};

const remoteProfileHydrationState = {
  key: null as string | null,
  promise: null as Promise<Awaited<ReturnType<typeof appUserService.getCurrentProfile>>> | null,
};

function SelectionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
        active
          ? 'border-[var(--accent-soft-border)] bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)]'
          : 'border-[var(--line-soft)] bg-[var(--panel-muted)] text-[var(--text-secondary)] hover:bg-[var(--panel-bg)]'
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">{children}</label>;
}

function FieldInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-primary-400 focus:bg-[var(--surface-raised-strong)] ${props.className || ''}`}
    />
  );
}

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function buildRemoteProfileHydrationKey(user: {
  displayName?: string;
  email?: string;
  initials?: string;
} | null) {
  if (!user) {
    return null;
  }

  const email = (user.email || '').trim().toLowerCase();
  const displayName = (user.displayName || '').trim().toLowerCase();
  const initials = (user.initials || '').trim().toLowerCase();
  return [email, displayName, initials].filter(Boolean).join('::') || '__authenticated__';
}

function ensureRemoteProfileHydrated(key: string) {
  if (remoteProfileHydrationState.key === key && remoteProfileHydrationState.promise) {
    return remoteProfileHydrationState.promise;
  }

  const promise = appUserService.getCurrentProfile().finally(() => {
    if (remoteProfileHydrationState.key === key && remoteProfileHydrationState.promise === promise) {
      remoteProfileHydrationState.key = null;
      remoteProfileHydrationState.promise = null;
    }
  });

  remoteProfileHydrationState.key = key;
  remoteProfileHydrationState.promise = promise;
  return promise;
}

export function __resetAccountPageProfileHydrationForTests() {
  remoteProfileHydrationState.key = null;
  remoteProfileHydrationState.promise = null;
}

export function AccountPage() {
  const { t, i18n } = useNotesTranslation();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const syncUserProfile = useAuthStore((state) => state.syncUserProfile);
  const { themeMode, themeColor, languagePreference, setThemeMode, setThemeColor, setLanguagePreference } =
    useAppStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const remoteProfileHydrationKeyRef = useRef<string | null>(null);
  const hasUser = Boolean(user);

  if (!hasUser) {
    remoteProfileHydrationKeyRef.current = null;
  } else if (!remoteProfileHydrationKeyRef.current) {
    remoteProfileHydrationKeyRef.current = buildRemoteProfileHydrationKey(user);
  }

  const remoteProfileHydrationKey = remoteProfileHydrationKeyRef.current;

  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user?.displayName]);

  useEffect(() => {
    if (!hasUser || !remoteProfileHydrationKey) {
      setIsProfileLoading(false);
      return;
    }
    let disposed = false;
    setIsProfileLoading(true);

    void (async () => {
      try {
        const profile = await ensureRemoteProfileHydrated(remoteProfileHydrationKey);
        if (disposed) {
          return;
        }
        setDisplayName(profile.displayName);
        syncUserProfile(profile);
      } catch {
        // The auth store already contains the latest known profile; keep rendering it if refresh fails.
      } finally {
        if (!disposed) {
          setIsProfileLoading(false);
        }
      }
    })();

    return () => {
      disposed = true;
    };
  }, [hasUser, remoteProfileHydrationKey, syncUserProfile]);

  const normalizedDisplayName = displayName.trim();
  const isProfileDirty = normalizedDisplayName !== (user?.displayName || '').trim();

  const persistRemoteSettings = async (nextSettings: {
    themeMode: ThemeMode;
    languagePreference: LanguagePreference;
  }) => {
    try {
      await appUserService.updateCurrentSettings(nextSettings);
    } catch (error) {
      toast.error(readErrorMessage(error, t('user.settingsSaveFailed')));
      throw error;
    }
  };

  const handleThemeModeChange = (value: ThemeMode) => {
    if (themeMode === value) {
      return;
    }

    const previousThemeMode = themeMode;
    setThemeMode(value);

    void persistRemoteSettings({
      themeMode: value,
      languagePreference,
    }).catch(() => {
      setThemeMode(previousThemeMode);
    });
  };

  const handleLanguageChange = (value: LanguagePreference) => {
    if (languagePreference === value) {
      return;
    }

    const previousLanguage = languagePreference;
    setLanguagePreference(value);
    void i18n.changeLanguage(value);

    void persistRemoteSettings({
      themeMode,
      languagePreference: value,
    }).catch(() => {
      setLanguagePreference(previousLanguage);
      void i18n.changeLanguage(previousLanguage);
    });
  };

  const handleProfileSave = async () => {
    if (!normalizedDisplayName || !isProfileDirty || isProfileSaving) {
      return;
    }

    setIsProfileSaving(true);
    try {
      const profile = await appUserService.updateCurrentProfile({
        displayName: normalizedDisplayName,
      });
      syncUserProfile(profile);
      setDisplayName(profile.displayName);
      toast.success(t('user.profileSaved'));
    } catch (error) {
      toast.error(readErrorMessage(error, t('user.profileSaveFailed')));
    } finally {
      setIsProfileSaving(false);
    }
  };

  const profileStatusText = useMemo(() => {
    if (isProfileLoading) {
      return t('common.loading');
    }

    return t('user.emailReadonly');
  }, [isProfileLoading, t]);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 lg:p-8">
        <SurfaceCard>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)]">
                <UserCircle2 className="h-8 w-8" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {t('user.account')}
                </div>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--text-primary)]">
                  {user?.displayName || t('user.guest')}
                </h1>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                  {user?.email || t('user.accountDesc')}
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut className="h-4 w-4" />
              {t('user.signOut')}
            </Button>
          </div>
        </SurfaceCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <SurfaceCard>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary-500" />
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('user.profile')}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{t('user.profileDesc')}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <FieldLabel>{t('user.displayName')}</FieldLabel>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                  <FieldInput
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="pl-12"
                    placeholder={t('auth.placeholders.name')}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>{t('user.emailLabel')}</FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
                  <FieldInput
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    className="cursor-not-allowed pl-12 text-[var(--text-secondary)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-muted)] px-4 py-3">
                <p className="text-sm text-[var(--text-secondary)]">{profileStatusText}</p>
                <Button
                  type="button"
                  appearance="primary"
                  disabled={!normalizedDisplayName || !isProfileDirty || isProfileSaving || isProfileLoading}
                  onClick={() => {
                    void handleProfileSave();
                  }}
                >
                  {isProfileSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {isProfileSaving ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-primary-500" />
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('user.theme')}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{t('user.themeDesc')}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-3">
                {themeModes.map(({ value, icon: Icon }) => (
                  <SelectionButton
                    key={value}
                    active={themeMode === value}
                    onClick={() => handleThemeModeChange(value)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{t(`user.themeMode.${value}`)}</span>
                    </div>
                  </SelectionButton>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {themeColors.map((value) => (
                  <SelectionButton
                    key={value}
                    active={themeColor === value}
                    onClick={() => setThemeColor(value)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{t(`user.themeColor.${value}`)}</span>
                      <span
                        className="inline-flex h-4 w-10 rounded-full border border-[var(--line-soft)] shadow-sm"
                        style={{
                          background: `linear-gradient(90deg, ${themeColorPreview[value][0]}, ${themeColorPreview[value][1]})`,
                        }}
                      />
                    </div>
                  </SelectionButton>
                ))}
              </div>

              <p className="text-xs leading-6 text-[var(--text-muted)]">{t('user.themeColorHint')}</p>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-primary-500" />
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('user.language')}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{t('user.languageDesc')}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {languages.map((value) => (
                <SelectionButton
                  key={value}
                  active={languagePreference === value}
                  onClick={() => handleLanguageChange(value)}
                >
                  {t(`user.languageOption.${value}`)}
                </SelectionButton>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
