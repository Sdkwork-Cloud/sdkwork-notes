import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore } from '@sdkwork/notes-core';
import { useNotesTranslation } from '@sdkwork/notes-i18n';

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

function RouteFallback() {
  const { t } = useNotesTranslation();

  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-[var(--app-bg)]/35 px-6 py-8 text-sm text-[var(--text-muted)]">
      {t('common.loading')}
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<IndexRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route
          path="/login"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <AuthPage />
            </Suspense>
          )}
        />
        <Route
          path="/register"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <AuthPage />
            </Suspense>
          )}
        />
        <Route
          path="/forgot-password"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <AuthPage />
            </Suspense>
          )}
        />
        <Route
          path="/login/oauth/callback/:provider"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <AuthOAuthCallbackPage />
            </Suspense>
          )}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          path="/notes"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <NotesWorkspacePage />
            </Suspense>
          )}
        />
        <Route
          path="/account"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <AccountPage />
            </Suspense>
          )}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
