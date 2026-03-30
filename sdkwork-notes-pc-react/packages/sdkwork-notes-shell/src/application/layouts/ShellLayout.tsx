import { LogOut, NotebookPen, UserCircle2 } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '@sdkwork/notes-commons';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import { useAuthStore } from '@sdkwork/notes-core';

function navClassName({ isActive }: { isActive: boolean }) {
  return `rounded-2xl px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-primary-50 text-primary-700'
      : 'text-[var(--text-secondary)] hover:bg-[var(--panel-muted)]'
  }`;
}

export function ShellLayout() {
  const { t } = useNotesTranslation();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <header
        className="border-b border-[var(--line-soft)] bg-[var(--panel-bg)]/90 backdrop-blur-xl"
        data-tauri-drag-region
      >
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-[0_18px_32px_rgba(51,103,246,0.25)]">
                <NotebookPen className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {t('shell.layout.badge')}
                </div>
                <div className="text-lg font-black text-[var(--text-primary)]">
                  {t('shell.layout.brand')}
                </div>
              </div>
            </div>

            <nav className="flex items-center gap-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-muted)] p-1.5">
              <NavLink to="/notes" className={navClassName}>
                {t('shell.layout.notes')}
              </NavLink>
              <NavLink to="/account" className={navClassName}>
                {t('shell.layout.account')}
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-muted)] px-3 py-2 md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {user?.displayName || t('user.guest')}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {user?.email || t('shell.layout.accountHint')}
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut className="h-4 w-4" />
              {t('user.signOut')}
            </Button>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
