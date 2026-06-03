import { MainLayout } from './layouts/MainLayout';
import { AppProviders, type AppProvidersProps } from './providers/AppProviders';

export interface AppRootProps {
  notesWorkspaceBootstrapOptions?: AppProvidersProps['notesWorkspaceBootstrapOptions'];
}

export function AppRoot(props: AppRootProps) {
  return (
    <AppProviders {...props}>
      <MainLayout />
    </AppProviders>
  );
}
