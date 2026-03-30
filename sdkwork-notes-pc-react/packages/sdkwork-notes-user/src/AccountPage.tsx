import type { ReactNode } from 'react';
import { LogOut, MoonStar, Palette, SunMedium, UserCircle2, Languages } from 'lucide-react';
import { Button, SurfaceCard } from '@sdkwork/notes-commons';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import { useAppStore, useAuthStore } from '@sdkwork/notes-core';
import type { LanguagePreference, ThemeColor, ThemeMode } from '@sdkwork/notes-types';

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

export function AccountPage() {
  const { t, i18n } = useNotesTranslation();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { themeMode, themeColor, languagePreference, setThemeMode, setThemeColor, setLanguagePreference } =
    useAppStore();

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
                    onClick={() => setThemeMode(value)}
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
                  onClick={() => {
                    setLanguagePreference(value);
                    void i18n.changeLanguage(value);
                  }}
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
