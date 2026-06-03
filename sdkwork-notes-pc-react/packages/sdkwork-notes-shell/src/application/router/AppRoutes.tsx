import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthOAuthCallbackPage, AuthPage, useAuthStore } from '@sdkwork/notes-auth';
import { useNotesTranslation } from '@sdkwork/notes-i18n';

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
  return <Navigate to={isAuthenticated ? '/notes' : '/auth/login'} replace />;
}

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth/login?redirect=${buildRedirectParam(location.pathname, location.search)}`}
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
  const isSessionReady = useAuthStore((state) => state.isSessionReady);

  if (!isSessionReady) {
    return <RouteFallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<IndexRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route
          path="/auth/login"
          element={<AuthPage />}
        />
        <Route
          path="/auth/register"
          element={<AuthPage />}
        />
        <Route
          path="/auth/forgot-password"
          element={<AuthPage />}
        />
        <Route
          path="/auth/oauth/callback/:provider"
          element={<AuthOAuthCallbackPage />}
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
