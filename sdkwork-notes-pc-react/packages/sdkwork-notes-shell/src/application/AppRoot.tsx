import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './router/AppRoutes';

export function AppRoot() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
