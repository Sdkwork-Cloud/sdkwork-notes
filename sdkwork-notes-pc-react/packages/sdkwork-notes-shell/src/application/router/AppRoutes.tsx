import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore } from '@sdkwork/notes-core';
import { useNotesTranslation } from '@sdkwork/notes-i18n';
import { ShellLayout } from '../layouts/ShellLayout';

const AuthPage = lazy(async () => ({
  default: (await import('@sdkwork/notes-auth')).AuthPage,
}));

const AuthOAuthCallbackPage = lazy(async () => ({
  default: (await import('@sdkwork/notes-auth')).AuthOAuthCallbackPage,
}));

const NotesWorkspacePage = lazy(async () => ({
  default: (await import('@sdkwork/notes-notes')).NotesWorkspacePage,
}));

const AccountPage = lazy(async () => ({
  default: (await import('@sdkwork/notes-user')).AccountPage,
}));

function buildRedirectParam(pathname: string, search: string) {
  const target = `${pathname}${search}`.trim() || '/notes';
  return encodeURIComponent(target);
}

function IndexRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/notes' : '/login'} replace />;
}

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${buildRedirectParam(location.pathname, location.search)}`}
        replace
      />
    );
  }

  return <Outlet />;
}

function PublicOnlyRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/notes" replace />;
  }
  return <Outlet />;
}

export function AppRoutes() {
  const { t } = useNotesTranslation();

  return (
    <Suspense
      fallback={<div className="px-6 py-8 text-sm text-[var(--text-muted)]">{t('common.loading')}</div>}
    >
      <Routes>
        <Route path="/" element={<IndexRedirect />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<AuthPage />} />
          <Route path="/login/oauth/callback/:provider" element={<AuthOAuthCallbackPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<ShellLayout />}>
            <Route path="/notes" element={<NotesWorkspacePage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
