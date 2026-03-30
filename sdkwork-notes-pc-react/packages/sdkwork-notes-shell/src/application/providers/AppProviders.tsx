import type { ReactNode } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAppStore } from '@sdkwork/notes-core';
import { LanguageManager } from './LanguageManager';
import { ThemeManager } from './ThemeManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const themeMode = useAppStore((state) => state.themeMode);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeManager />
      <LanguageManager />
      <Router>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          theme={themeMode === 'system' ? 'system' : themeMode === 'dark' ? 'dark' : 'light'}
        />
      </Router>
    </QueryClientProvider>
  );
}
