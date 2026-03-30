import { useLocation } from 'react-router-dom';
import { AppRoutes } from '../router/AppRoutes';
import { ShellLayout } from './ShellLayout';

function isAuthRoute(pathname: string) {
  return (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/login/oauth/callback/')
  );
}

export function MainLayout() {
  const location = useLocation();
  const isAuthenticationRoute = isAuthRoute(location.pathname);

  if (isAuthenticationRoute) {
    return (
      <ShellLayout mode="auth">
        <main className="relative z-10 min-h-0 flex-1 overflow-auto scrollbar-hide">
          <AppRoutes />
        </main>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <main className="relative z-10 min-w-0 flex-1 overflow-auto scrollbar-hide bg-[var(--surface-soft)]">
          <AppRoutes />
        </main>
      </div>
    </ShellLayout>
  );
}
