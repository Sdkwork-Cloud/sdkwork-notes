import { CircleUserRound, NotebookPen, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import { useAuthStore } from '@sdkwork/notes-core';
import { DesktopWindowControls } from './DesktopWindowControls';

function BrandMark() {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary-600 text-white shadow-[0_10px_24px_rgba(51,103,246,0.24)]">
      <NotebookPen className="h-4 w-4" />
    </div>
  );
}

function HeaderNavLink({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      data-tauri-drag-region="false"
      className={({ isActive }) =>
        `flex h-9 items-center rounded-2xl px-3 text-xs font-semibold transition ${
          isActive
            ? 'bg-[var(--accent-soft-bg)] text-[var(--accent-soft-text)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--panel-muted)] hover:text-[var(--text-primary)]'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function HeaderActionButton({
  title,
  onClick,
  children,
  className = '',
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-tauri-drag-region="false"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-9 items-center justify-center rounded-2xl bg-[var(--panel-muted)] px-3 text-[var(--text-secondary)] transition hover:bg-[var(--panel-bg)] hover:text-[var(--text-primary)] ${className}`}
    >
      {children}
    </button>
  );
}

export interface AppHeaderProps {
  mode?: 'default' | 'auth';
}

export function AppHeader({ mode = 'default' }: AppHeaderProps) {
  const { t } = useNotesTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthMode = mode === 'auth';
  const accountLabel = user?.displayName || t('user.guest');
  const accountSubLabel = user?.email || t('shell.layout.accountHint');
  const accountInitials =
    user?.initials || user?.displayName?.trim().slice(0, 1).toUpperCase() || null;

  return (
    <div className="relative z-30 bg-[var(--panel-bg)]/88 backdrop-blur-xl">
      <header className="relative flex h-12 items-center px-3 sm:px-4">
        <div
          data-slot="app-header-leading"
          data-tauri-drag-region
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-none text-[var(--text-primary)]">
                {t('shell.layout.brand')}
              </div>
            </div>
          </div>

          {!isAuthMode ? (
            <div
              data-slot="app-header-search"
              data-tauri-drag-region="false"
              className="ml-4"
            >
              <HeaderActionButton
                title={t('notes.searchPlaceholder')}
                onClick={() => navigate('/notes')}
                className="gap-2 px-2.5"
              >
                <Search className="h-4 w-4" />
                <span className="hidden text-xs font-medium md:inline">{t('common.search')}</span>
              </HeaderActionButton>
            </div>
          ) : null}
        </div>

        {!isAuthMode ? (
          <div
            data-slot="app-header-center"
            data-tauri-drag-region="false"
            className="pointer-events-none absolute left-1/2 top-1/2 flex w-full max-w-[36rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center px-24 lg:px-32"
          >
            <nav
              data-slot="app-header-nav"
              className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-[var(--panel-muted)] p-1 shadow-[0_6px_20px_rgba(15,23,42,0.06)]"
            >
              <HeaderNavLink to="/notes">{t('shell.layout.notes')}</HeaderNavLink>
              <HeaderNavLink to="/account">{t('shell.layout.account')}</HeaderNavLink>
            </nav>
          </div>
        ) : null}

        <div
          data-slot="app-header-trailing"
          data-tauri-drag-region="false"
          className="ml-auto flex h-full shrink-0 items-center justify-end gap-2"
        >
          {!isAuthMode ? (
            <HeaderActionButton
              title={accountLabel}
              onClick={() => navigate('/account')}
              className="hidden gap-2 px-2 md:flex"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--accent-soft-bg)] text-[11px] font-semibold text-[var(--accent-soft-text)]">
                {accountInitials ? accountInitials : <CircleUserRound className="h-4 w-4" />}
              </div>
              <div className="hidden max-w-28 truncate text-xs font-medium lg:inline">
                {accountLabel}
              </div>
              <div className="hidden rounded-full bg-[var(--surface-scrim)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] xl:inline">
                {accountSubLabel}
              </div>
            </HeaderActionButton>
          ) : null}

          <DesktopWindowControls variant="header" />
        </div>
      </header>
    </div>
  );
}
