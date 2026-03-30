import { MainLayout } from './layouts/MainLayout';
import { AppProviders } from './providers/AppProviders';

export function AppRoot() {
  return (
    <AppProviders>
      <MainLayout />
    </AppProviders>
  );
}
